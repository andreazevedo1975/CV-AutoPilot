
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registrar Service Worker com Workbox para permitir acesso offline e instalação PWA
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[Workbox PWA] Service Worker ativo com sucesso. Escopo:', registration.scope);
      })
      .catch((err) => {
        console.warn('[Workbox PWA] Falha ao registrar Service Worker:', err);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

