import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Compare from './pages/Compare.jsx'

// Eenvoudige routing zonder extra pakket: /vergelijk toont de testpagina.
const Page = window.location.pathname.startsWith('/vergelijk') ? Compare : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
