import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// In development, leave relative /api/ requests intact so the Vite dev server proxy
// forwards them cleanly to the local Flask backend (http://127.0.0.1:5000).
const isLocalHost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const RAW_BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').trim()
const BACKEND_URL = RAW_BACKEND_URL
  ? RAW_BACKEND_URL.replace(/\/+$/, '')
  : (import.meta.env.DEV || isLocalHost ? '' : 'https://latticelink-backend.onrender.com')

const originalFetch = window.fetch.bind(window)

window.fetch = function (input, init) {
  if (typeof input === 'string' && input.startsWith('/api/') && BACKEND_URL) {
    input = `${BACKEND_URL}${input}`
  }

  return originalFetch(input, init)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)