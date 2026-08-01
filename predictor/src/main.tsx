import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdminPortal from './AdminPortal.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { SettingsProvider } from './SettingsContext.tsx';
import './index.css';

window.addEventListener('error', (e) => {
  if (e.message === 'Script error.' || (typeof e.message === 'string' && e.message.includes('Script error'))) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
}, true);

const originalError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Script error')) {
    return;
  }
  originalError.apply(console, args);
};

const isAdmin = window.location.pathname === '/admin';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        {isAdmin ? <AdminPortal /> : <App />}
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
);

