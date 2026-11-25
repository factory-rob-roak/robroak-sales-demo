import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createStubLogger } from './api/createStubLogger';
import { LoggerProvider } from './api/LoggerProvider';
import { App } from './App';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root element');
}

const logger = createStubLogger();

createRoot(root, {
  onUncaughtError: (error, { componentStack }) =>
    logger.error('Uncaught render error', { componentStack: componentStack ?? null }, error),
  onRecoverableError: (error) => logger.warn('React recovered from an error', {}, error),
}).render(
  <StrictMode>
    <LoggerProvider logger={logger}>
      <App />
    </LoggerProvider>
  </StrictMode>,
);
