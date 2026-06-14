// Editor version, injected from package.json at build time (vite `define`).
// Falls back to 'dev' when the define isn't present (e.g. in unit tests).
declare const __APP_VERSION__: string | undefined

export const APP_VERSION: string =
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'
