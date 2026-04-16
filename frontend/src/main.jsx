import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { CompareProvider } from './context/CompareContext'
import { CurrencyProvider } from './context/CurrencyContext'
import './styles/theme.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CompareProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </CompareProvider>
  </StrictMode>,
)
