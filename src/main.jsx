import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const BACKEND_URL = 'https://latticelink-backend.onrender.com'

const originalFetch = window.fetch.bind(window)

window.fetch = function (input, init) {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    input = `${BACKEND_URL}${input}`
  }

  return originalFetch(input, init)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)