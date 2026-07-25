import pkg from "../../package.json";

// Single source of truth for the app version is package.json.
// Bump it there (plus a CHANGELOG.md entry) for every release — see AGENTS.md.
export const APP_VERSION: string = pkg.version;
