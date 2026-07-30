import { STORAGE_KEY, STORAGE_VERSION } from "./a11y-constants";

/**
 * Stamps stored accessibility preferences on <html> before first paint.
 *
 * This parser mirrors AccessibilityProvider, including the legacy two-boolean
 * shape, but never writes storage. In particular, the operating-system motion
 * preference remains a live seed until the visitor explicitly changes a site
 * setting.
 */
export const A11Y_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,s=[100,115,130],p=null,v=null;try{var r=window.localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)});v=r?JSON.parse(r):null}catch(e){}if(v&&typeof v==="object"){var c=v.version===${STORAGE_VERSION}?v.preferences:null;if(c&&typeof c==="object"&&s.indexOf(c.textScale)>-1&&typeof c.enhancedContrast==="boolean"&&typeof c.comfortableSpacing==="boolean"&&typeof c.reduceMotion==="boolean"&&typeof c.emphasizeLinks==="boolean"){p={textScale:c.textScale,enhancedContrast:c.enhancedContrast,comfortableSpacing:c.comfortableSpacing,reduceMotion:c.reduceMotion,emphasizeLinks:c.emphasizeLinks}}else if(typeof v.reduceMotion==="boolean"&&typeof v.emphasizeLinks==="boolean"){p={textScale:100,enhancedContrast:false,comfortableSpacing:false,reduceMotion:v.reduceMotion,emphasizeLinks:v.emphasizeLinks}}}if(!p){var m=false;try{m=window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}p={textScale:100,enhancedContrast:false,comfortableSpacing:false,reduceMotion:m,emphasizeLinks:false}}d.dataset.a11yTextScale=String(p.textScale);d.dataset.a11yEnhancedContrast=String(p.enhancedContrast);d.dataset.a11yComfortableSpacing=String(p.comfortableSpacing);d.dataset.a11yReduceMotion=String(p.reduceMotion);d.dataset.a11yEmphasizeLinks=String(p.emphasizeLinks)}catch(e){}})();`;
