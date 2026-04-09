import type { PragmaAPI } from '../../../preload'

// Expose the typed Pragma API on window
declare global {
  interface Window {
    pragma: PragmaAPI
  }
}

// Allow WebkitAppRegion as a valid CSS property (used for frameless window drag regions)
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag'
  }
}
