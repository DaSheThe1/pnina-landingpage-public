"use client";

/**
 * Chooses between one stable animated process shell and the complete static
 * cards. The animated shell is in the server HTML at its FINAL height; it is
 * never swapped in after two network probes. That invariant is what prevents a
 * cold phone load from moving every following section while the visitor is
 * already scrolling.
 *
 * Both renderings stay in the markup because the site's motion switch is
 * stamped on <html> before React hydrates. CSS exposes exactly one of them
 * before first paint, and the hook below keeps the media runtime in step after
 * the visitor changes the switch. Save-Data uses the same static branch.
 */

import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";

import { ProcessSection } from "./marketing-sections";
import { ProcessScrub } from "./process-scrub";

type SaveDataNavigator = Navigator & {
  connection?: EventTarget & { saveData?: boolean };
};

export function ProcessExperience() {
  const reducedMotion = usePrefersReducedMotion();
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const connection = (navigator as SaveDataNavigator).connection;
    const apply = () => setSaveData(connection?.saveData === true);
    apply();
    connection?.addEventListener("change", apply);
    return () => connection?.removeEventListener("change", apply);
  }, []);

  const animated = !reducedMotion && !saveData;

  return (
    <div
      className="process-experience"
      data-process-mode={animated ? "motion" : "static"}
    >
      <noscript>
        <style>{`.process-experience__motion{display:none}.process-experience__static{display:block}`}</style>
      </noscript>
      <div className="process-experience__motion">
        <ProcessScrub enabled={animated} />
      </div>
      <div className="process-experience__static">
        <ProcessSection />
      </div>
    </div>
  );
}
