export type Theme = 'light' | 'dark'

const KEY = 'wf:theme'

export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // ignore storage failures
  }
  applyTheme(theme)
}

/** Apply the persisted theme at startup. */
export function initTheme() {
  applyTheme(getTheme())
}
