import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/instrument-sans/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProveedorApp } from './app/contexto';
import { crearPlataforma } from './modules/platform';
import { App } from './ui/App';
import { ErrorBoundary } from './ui/ErrorBoundary';

document.documentElement.dataset.theme = 'light';

crearPlataforma().then((plataforma) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <ProveedorApp plataforma={plataforma}>
          <App />
        </ProveedorApp>
      </ErrorBoundary>
    </StrictMode>,
  );
});
