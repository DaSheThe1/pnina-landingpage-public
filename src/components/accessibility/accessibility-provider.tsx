"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  STORAGE_KEY,
  STORAGE_VERSION,
} from "@/components/accessibility/a11y-constants";

export const textScaleSteps = [100, 115, 130] as const;
export type TextScale = (typeof textScaleSteps)[number];

export type AccessibilityPreferences = {
  textScale: TextScale;
  enhancedContrast: boolean;
  comfortableSpacing: boolean;
  reduceMotion: boolean;
  emphasizeLinks: boolean;
};

type AccessibilityContextValue = AccessibilityPreferences & {
  /**
   * True once these values came from the visitor rather than from the seed.
   *
   * The provider seeds `reduceMotion` from the device preference, so
   * `reduceMotion === true` alone cannot tell "her operating system is set to
   * reduce motion" apart from "she switched it on in this panel". One place
   * needs that difference: the hero clip autoplays for everyone by Daniel's
   * 2026-07-29 call (see hero-video.tsx), and only a choice made HERE stops it.
   */
  hasExplicitPreferences: boolean;
  setTextScale: (scale: TextScale) => void;
  setEnhancedContrast: (enabled: boolean) => void;
  setComfortableSpacing: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setEmphasizeLinks: (enabled: boolean) => void;
  reset: () => void;
};

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  textScale: 100,
  enhancedContrast: false,
  comfortableSpacing: false,
  reduceMotion: false,
  emphasizeLinks: false,
};

type StoredPreferences = {
  version: typeof STORAGE_VERSION;
  preferences: AccessibilityPreferences;
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null
);

function isTextScale(value: unknown): value is TextScale {
  return textScaleSteps.some((step) => step === value);
}

function isPreferences(value: unknown): value is AccessibilityPreferences {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<AccessibilityPreferences>;
  return (
    isTextScale(candidate.textScale) &&
    typeof candidate.enhancedContrast === "boolean" &&
    typeof candidate.comfortableSpacing === "boolean" &&
    typeof candidate.reduceMotion === "boolean" &&
    typeof candidate.emphasizeLinks === "boolean"
  );
}

type ParsedPreferences = {
  preferences: AccessibilityPreferences;
  migrated: boolean;
};

function parseStoredPreferences(value: unknown): ParsedPreferences | null {
  if (!value || typeof value !== "object") return null;

  const stored = value as Partial<StoredPreferences>;
  if (
    stored.version === STORAGE_VERSION &&
    isPreferences(stored.preferences)
  ) {
    return { preferences: stored.preferences, migrated: false };
  }

  // Migrate the small unversioned shape used by the reference implementation.
  // This site never shipped it, but accepting it prevents lost preferences if a
  // visitor carried the old shape over during local development.
  const legacy = value as Partial<AccessibilityPreferences>;
  if (
    typeof legacy.reduceMotion === "boolean" &&
    typeof legacy.emphasizeLinks === "boolean"
  ) {
    return {
      preferences: {
        ...defaultAccessibilityPreferences,
        reduceMotion: legacy.reduceMotion,
        emphasizeLinks: legacy.emphasizeLinks,
      },
      migrated: true,
    };
  }

  return null;
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    defaultAccessibilityPreferences
  );
  const [hasLoaded, setHasLoaded] = useState(false);
  // Only an explicit visitor choice or a storage migration may be persisted.
  // The OS reduced-motion seed stays unpersisted so it keeps tracking the OS.
  const dirtyRef = useRef(false);
  // The rendered half of `dirtyRef`: restored-from-storage or changed-in-panel.
  const [hasExplicitPreferences, setHasExplicitPreferences] = useState(false);

  useEffect(() => {
    const loadPreferences = window.setTimeout(() => {
      let restored: ParsedPreferences | null = null;

      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = stored ? JSON.parse(stored) : null;
        restored = parsed ? parseStoredPreferences(parsed) : null;
      } catch {
        // Malformed or blocked storage falls through to the OS-seeded defaults.
      }

      if (restored) {
        if (restored.migrated) dirtyRef.current = true;
        setHasExplicitPreferences(true);
        setPreferences(restored.preferences);
      } else {
        let reduceMotion = false;
        try {
          reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
          ).matches;
        } catch {
          // An unavailable matchMedia must never prevent the page from loading.
        }
        setPreferences({
          ...defaultAccessibilityPreferences,
          reduceMotion,
        });
      }

      setHasLoaded(true);
    }, 0);

    return () => window.clearTimeout(loadPreferences);
  }, []);

  useEffect(() => {
    // The inline boot script already holds the stored or OS-seeded attributes
    // until this load completes. Writing defaults sooner would cause a flash.
    if (!hasLoaded) return;

    const root = document.documentElement;
    root.dataset.a11yTextScale = String(preferences.textScale);
    root.dataset.a11yEnhancedContrast = String(
      preferences.enhancedContrast
    );
    root.dataset.a11yComfortableSpacing = String(
      preferences.comfortableSpacing
    );
    root.dataset.a11yReduceMotion = String(preferences.reduceMotion);
    root.dataset.a11yEmphasizeLinks = String(preferences.emphasizeLinks);

    if (!dirtyRef.current) return;

    try {
      const stored: StoredPreferences = {
        version: STORAGE_VERSION,
        preferences,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // The choices still work for this visit when storage is unavailable.
    }
  }, [hasLoaded, preferences]);

  const setTextScale = useCallback((textScale: TextScale) => {
    dirtyRef.current = true;
    setHasExplicitPreferences(true);
    setPreferences((current) => ({ ...current, textScale }));
  }, []);

  const setEnhancedContrast = useCallback((enhancedContrast: boolean) => {
    dirtyRef.current = true;
    setHasExplicitPreferences(true);
    setPreferences((current) => ({ ...current, enhancedContrast }));
  }, []);

  const setComfortableSpacing = useCallback((comfortableSpacing: boolean) => {
    dirtyRef.current = true;
    setHasExplicitPreferences(true);
    setPreferences((current) => ({ ...current, comfortableSpacing }));
  }, []);

  const setReduceMotion = useCallback((reduceMotion: boolean) => {
    dirtyRef.current = true;
    setHasExplicitPreferences(true);
    setPreferences((current) => ({ ...current, reduceMotion }));
  }, []);

  const setEmphasizeLinks = useCallback((emphasizeLinks: boolean) => {
    dirtyRef.current = true;
    setHasExplicitPreferences(true);
    setPreferences((current) => ({ ...current, emphasizeLinks }));
  }, []);

  const reset = useCallback(() => {
    dirtyRef.current = true;
    setHasExplicitPreferences(true);
    setPreferences(defaultAccessibilityPreferences);
  }, []);

  const value = useMemo(
    () => ({
      ...preferences,
      hasExplicitPreferences,
      setTextScale,
      setEnhancedContrast,
      setComfortableSpacing,
      setReduceMotion,
      setEmphasizeLinks,
      reset,
    }),
    [
      hasExplicitPreferences,
      preferences,
      reset,
      setComfortableSpacing,
      setEmphasizeLinks,
      setEnhancedContrast,
      setReduceMotion,
      setTextScale,
    ]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityPreferences(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibilityPreferences must be used within <AccessibilityProvider>"
    );
  }
  return context;
}
