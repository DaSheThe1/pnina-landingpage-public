/**
 * Storage identity for visitor accessibility preferences.
 *
 * This module deliberately has no client directive or React import so both the
 * server-rendered boot script and the client provider can share one source of
 * truth.
 */
export const STORAGE_KEY = "penina-accessibility";
export const STORAGE_VERSION = 1;
