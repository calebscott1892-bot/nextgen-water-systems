/**
 * basePath-safe public asset URL. Mirrors next.config.mjs: assets live under
 * /nextgen-water-systems/ in production (GitHub Pages project site) and at root
 * in dev. NODE_ENV is statically inlined at build, so the right prefix bakes
 * into the exported bundle.
 */
export const BASE_PATH = process.env.NODE_ENV === "production" ? "/nextgen-water-systems" : "";

export const asset = (path: string): string => `${BASE_PATH}${path}`;
