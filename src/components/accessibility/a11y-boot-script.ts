import { STORAGE_KEY, STORAGE_VERSION } from "./a11y-constants";

/**
 * Stamps stored accessibility preferences on <html> before first paint.
 *
 * This parser mirrors AccessibilityProvider, including the legacy two-boolean
 * shape, but never writes storage. ONLY A STORED, EXPLICIT CHOICE STAMPS
 * ANYTHING: since 2026-07-30 the operating system's `prefers-reduced-motion`
 * setting is not consulted here, so a visitor who has never opened the
 * accessibility panel gets `data-a11y-reduce-motion="false"` and the site moves
 * for her. Daniel's call — animations on by default, the panel switch off by
 * default, and the panel switch is the only opt-out. Do not add a `matchMedia`
 * call back into this string.
 *
 * Stamping the stored choice HERE, before the first paint, is what keeps the
 * static rendering flash-free for a visitor who did switch it on.
 */
export const A11Y_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,s=[100,115,130],p=null,v=null;try{var r=window.localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)});v=r?JSON.parse(r):null}catch(e){}if(v&&typeof v==="object"){var c=v.version===${STORAGE_VERSION}?v.preferences:null;if(c&&typeof c==="object"&&s.indexOf(c.textScale)>-1&&typeof c.enhancedContrast==="boolean"&&typeof c.comfortableSpacing==="boolean"&&typeof c.reduceMotion==="boolean"&&typeof c.emphasizeLinks==="boolean"){p={textScale:c.textScale,enhancedContrast:c.enhancedContrast,comfortableSpacing:c.comfortableSpacing,reduceMotion:c.reduceMotion,emphasizeLinks:c.emphasizeLinks}}else if(typeof v.reduceMotion==="boolean"&&typeof v.emphasizeLinks==="boolean"){p={textScale:100,enhancedContrast:false,comfortableSpacing:false,reduceMotion:v.reduceMotion,emphasizeLinks:v.emphasizeLinks}}}if(!p){p={textScale:100,enhancedContrast:false,comfortableSpacing:false,reduceMotion:false,emphasizeLinks:false}}d.dataset.a11yTextScale=String(p.textScale);d.dataset.a11yEnhancedContrast=String(p.enhancedContrast);d.dataset.a11yComfortableSpacing=String(p.comfortableSpacing);d.dataset.a11yReduceMotion=String(p.reduceMotion);d.dataset.a11yEmphasizeLinks=String(p.emphasizeLinks)}catch(e){}})();`;
