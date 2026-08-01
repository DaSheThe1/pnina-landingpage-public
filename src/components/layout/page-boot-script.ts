/**
 * Page boot work that has to happen before React and before scroll restoration.
 *
 * 1. A real reload starts at the top. Back/forward navigation keeps the
 *    browser's normal restoration; only NavigationTiming's `reload` path is
 *    intercepted.
 * 2. Save-Data is stamped before paint so the static process cards win before
 *    the browser's preload scanner is ever given pearl-frame URLs.
 *
 * Keep this parser-blocking and ahead of page content. Neither decision reads
 * the operating system's reduced-motion preference.
 */
export const PAGE_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,c=navigator.connection;d.dataset.saveData=String(!!(c&&c.saveData));var e=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];if(!e||e.type!=="reload")return;history.scrollRestoration="manual";var old=d.style.scrollBehavior;d.style.scrollBehavior="auto";var top=function(){window.scrollTo(0,0)};top();window.addEventListener("pageshow",function(){top();requestAnimationFrame(function(){requestAnimationFrame(top)})},{once:true});window.addEventListener("load",function(){top();setTimeout(function(){top();history.scrollRestoration="auto";d.style.scrollBehavior=old},120)},{once:true})}catch(e){}})();`;
