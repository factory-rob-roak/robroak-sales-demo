import type { ReactNode } from 'react';
import { useLogger } from '../../api/LoggerProvider';
import { EditorErrorFallback } from './components/EditorErrorFallback';
import { RenderErrorBoundary } from './components/RenderErrorBoundary';

interface EditorErrorBoundaryProps {
  onClose: () => void;
  children: ReactNode;
}

/**
 * Catches render errors in the editor, reports them, and offers recovery.
 * Trying again remounts the editor, which reloads the draft from storage.
 */
export function EditorErrorBoundary({ onClose, children }: EditorErrorBoundaryProps) {
  const logger = useLogger();
  return (
    <RenderErrorBoundary
      logger={logger.child({ boundary: 'editor' })}
      renderFallback={(retry) => <EditorErrorFallback onRetry={retry} onClose={onClose} />}
    >
      {children}
    </RenderErrorBoundary>
  );
}
