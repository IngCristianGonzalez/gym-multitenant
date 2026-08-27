import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SyncProvider } from './offline/sync-provider';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SyncProvider>
        <AuthProvider>
          <PrimeReactProvider value={{ ripple: false }}>
            <App />
          </PrimeReactProvider>
        </AuthProvider>
      </SyncProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

// ---------- Service Worker Registration ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Check for SW updates every hour
      setInterval(() => reg.update(), 60 * 60 * 1000);

      // Listen for new service worker activating
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
            // New version available — notify user
            window.dispatchEvent(new CustomEvent('sw-update'));
          }
        });
      });
    }).catch(() => {});
  });

  // Listen for sync requests from the service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_REQUESTED') {
      window.dispatchEvent(new CustomEvent('sw-sync-requested'));
    }
  });
}
