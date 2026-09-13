import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Normalize localhost backend calls so the frontend works from this machine and Vite proxy.
const originalFetch = window.fetch;
window.fetch = function(input, init) {
  if (typeof input === 'string') {
    try {
      const url = new URL(input);
      if (['localhost', '127.0.0.1'].includes(url.hostname)) {
        input = url.pathname + url.search;
      }
    } catch {
      // Leave relative paths and other values unchanged.
    }
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
