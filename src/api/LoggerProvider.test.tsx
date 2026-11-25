import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createStubLogger } from './createStubLogger';
import { LoggerProvider, useLogger } from './LoggerProvider';

describe('useLogger', () => {
  it('returns the provided logger', () => {
    const onEntry = vi.fn();
    const logger = createStubLogger({ onEntry });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <LoggerProvider logger={logger}>{children}</LoggerProvider>
    );
    const { result } = renderHook(() => useLogger(), { wrapper });

    result.current.warn('from hook');
    expect(result.current).toBe(logger);
    expect(onEntry).toHaveBeenCalledWith(expect.objectContaining({ level: 'warn', message: 'from hook' }));
  });

  it('falls back to a stub that does not throw', () => {
    const { result } = renderHook(() => useLogger());
    expect(() => result.current.error('nobody listening')).not.toThrow();
  });
});
