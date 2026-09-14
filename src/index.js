import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

(() => {
  const originalConsole = { ...console };

  ['log', 'warn', 'error', 'info', 'debug', 'trace', 'dir', 'xml', 'table'].forEach(method => {
    console[method] = (...args) => {
      originalConsole[method](...args);
    };
  });

  const blockKeys = (e) => {
    const key = e.key.toLowerCase();
    if (
      key === 'f12' ||
      (e.ctrlKey && e.shiftKey && ['i', 'j', 'k', 'c'].includes(key)) ||
      (e.ctrlKey && key === 'u')
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  document.addEventListener('keydown', blockKeys, { capture: true });

  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

  const detectDevTools = () => {
    const threshold = 160;

    const interval = setInterval(() => {
      const widthDiff = window.innerWidth - document.documentElement.clientWidth;
      if (widthDiff > threshold) {
        clearInterval(interval);
        document.body.innerHTML = '';
        window.location.href = '/';
      }
    }, 1000);
  };

  detectDevTools();
})();
