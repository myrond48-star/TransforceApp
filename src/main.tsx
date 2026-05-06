import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("Application main entry point starting...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Critical: Root element not found!");
} else {
  console.log("Root element found, rendering React app...");
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
