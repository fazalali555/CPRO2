import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered successfully:', registration.scope);
      }).catch(error => {
        console.log('SW registration failed:', error);
      });
    } else {
      const clearSw = navigator.serviceWorker.getRegistrations().then(registrations => {
        return Promise.all(registrations.map(r => r.unregister()));
      });
      const clearCaches = 'caches' in window
        ? caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
        : Promise.resolve();
      Promise.all([clearSw, clearCaches]).then(() => {
        if (!sessionStorage.getItem('dev_sw_cleared')) {
          sessionStorage.setItem('dev_sw_cleared', '1');
          window.location.reload();
        }
      });
    }
  });
}
