import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'
// Font vendored from the package (its exports map doesn't expose the file).
// Twemoji Country Flags subset — CC-BY 4.0, © Twitter/Mozilla contributors.
import twemojiFlagsFontUrl from '@/assets/TwemojiCountryFlags.woff2?url'
import '@xyflow/react/dist/style.css'
import 'react-datepicker/dist/react-datepicker.css'
import './index.css'
import App from './App.tsx'
import { initPersistence } from '@/lib/persistence'
import { initTheme } from '@/lib/theme'

// Chrome/Edge on Windows have no country-flag emoji glyphs (🇫🇷 degrades to
// "FR"). This injects a flags-only webfont on such browsers — self-hosted via
// the bundler, not the polyfill's default CDN URL — and is a no-op elsewhere.
// "Twemoji Country Flags" is prepended to --font-sans in index.css.
polyfillCountryFlagEmojis('Twemoji Country Flags', twemojiFlagsFontUrl)

initTheme()
initPersistence()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
