import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@xyflow/react/dist/style.css'
import 'react-datepicker/dist/react-datepicker.css'
import './index.css'
import App from './App.tsx'
import { initPersistence } from '@/lib/persistence'
import { initTheme } from '@/lib/theme'

initTheme()
initPersistence()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
