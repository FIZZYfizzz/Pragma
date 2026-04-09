import './types/global.d'
import './globals.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Apply saved theme before first paint to prevent flash
;(function applyTheme() {
  try {
    const saved = localStorage.getItem('pragma_theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = saved ?? (prefersDark ? 'dark' : 'light')
    if (theme !== 'light') {
      document.documentElement.setAttribute('data-theme', theme)
    }
  } catch {
    // Ignore — localStorage may not be available
  }
})()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
