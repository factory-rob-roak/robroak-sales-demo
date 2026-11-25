import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { Logger } from '../../../api/logger';

interface RenderErrorBoundaryProps {
  logger: Logger;
  /** Shown instead of `children` after a render error. Calling `retry` mounts `children` again. */
  renderFallback: (retry: () => void) => ReactNode;
  children: ReactNode;
}

interface RenderErrorBoundaryState {
  failed: boolean;
}

/**
 * The repo's one class component, approved as an exception to the "function
 * components only" rule: React can only catch render errors in a class with
 * `getDerivedStateFromError`, and there is no hook for it. Keep logic out of
 * here; put UI in the fallback function component.
 */
export class RenderErrorBoundary extends Component<RenderErrorBoundaryProps, RenderErrorBoundaryState> {
  state: RenderErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): RenderErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // Component names only; props and state never reach the log.
    this.props.logger.error('Render error caught by boundary', { componentStack: info.componentStack ?? null }, error);
  }

  retry = () => {
    this.setState({ failed: false });
  };

  render() {
    return this.state.failed ? this.props.renderFallback(this.retry) : this.props.children;
  }
}
