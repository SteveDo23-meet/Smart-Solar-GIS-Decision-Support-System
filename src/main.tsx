import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import { App } from './app/App'
import { MapProvider } from './app/providers/MapProvider'
import { AnalysisProvider } from './app/providers/AnalysisProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MapProvider>
      <AnalysisProvider>
        <App />
      </AnalysisProvider>
    </MapProvider>
  </StrictMode>,
)
