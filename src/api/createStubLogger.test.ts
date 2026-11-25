import { describe, expect, it, vi } from 'vitest';
import { createStubLogger } from './createStubLogger';

describe('createStubLogger', () => {
  it('drops entries when no listener is given', () => {
    const logger = createStubLogger();
    expect(() => logger.captureError(new Error('ignored'))).not.toThrow();
  });

  it('passes entries at or above the minimum level to the listener', () => {
    const onEntry = vi.fn();
    const logger = createStubLogger({ onEntry, minLevel: 'info', now: () => 7 });
    logger.debug('hidden');
    logger.info('shown', { area: 'test' });
    expect(onEntry).toHaveBeenCalledExactlyOnceWith({
      level: 'info',
      message: 'shown',
      context: { area: 'test' },
      timestamp: 7,
    });
  });
});
