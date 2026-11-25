import { describe, expect, it, vi } from 'vitest';
import { createLogger, toCapturedError, type CreateLoggerOptions, type LogEntry } from './logger';

function recordingLogger(options: Omit<CreateLoggerOptions, 'sink'> = {}) {
  const entries: LogEntry[] = [];
  const logger = createLogger({ sink: (entry) => entries.push(entry), now: () => 1000, ...options });
  return { logger, entries };
}

describe('toCapturedError', () => {
  it('keeps the name, message, and stack of an Error', () => {
    const error = new TypeError('bad input');
    expect(toCapturedError(error)).toEqual({ name: 'TypeError', message: 'bad input', stack: error.stack });
  });

  it('omits the stack when the Error has none', () => {
    const error = new Error('no stack');
    error.stack = undefined;
    expect(toCapturedError(error)).toEqual({ name: 'Error', message: 'no stack' });
  });

  it('captures error-like objects such as a DOMException', () => {
    expect(toCapturedError(new DOMException('full', 'QuotaExceededError'))).toMatchObject({
      name: 'QuotaExceededError',
      message: 'full',
    });
    expect(toCapturedError({ name: 'AppError', message: 'plain', stack: 7 })).toEqual({
      name: 'AppError',
      message: 'plain',
    });
  });

  it('describes values that are not errors', () => {
    expect(toCapturedError('oops')).toEqual({ name: 'NonErrorThrown', message: 'oops' });
    expect(toCapturedError(42)).toEqual({ name: 'NonErrorThrown', message: '42' });
    expect(toCapturedError(null)).toEqual({ name: 'NonErrorThrown', message: 'null' });
    expect(toCapturedError({ name: 'NoMessage' })).toEqual({ name: 'NonErrorThrown', message: '[object Object]' });
    expect(toCapturedError({ name: 1, message: 'x' })).toEqual({ name: 'NonErrorThrown', message: '[object Object]' });
    expect(toCapturedError({ message: 'x' })).toEqual({ name: 'NonErrorThrown', message: '[object Object]' });
  });

  it('falls back when a thrown value cannot be turned into a string', () => {
    const hostile = {
      toString() {
        throw new Error('no');
      },
    };
    expect(toCapturedError(hostile)).toEqual({ name: 'NonErrorThrown', message: 'Unknown error' });
  });
});

describe('createLogger', () => {
  it('sends an entry for each level with context and a timestamp', () => {
    const { logger, entries } = recordingLogger();
    logger.debug('d');
    logger.info('i', { a: 1 });
    logger.warn('w', { b: true });
    logger.error('e', { c: null });

    expect(entries).toEqual([
      { level: 'debug', message: 'd', context: {}, timestamp: 1000 },
      { level: 'info', message: 'i', context: { a: 1 }, timestamp: 1000 },
      { level: 'warn', message: 'w', context: { b: true }, timestamp: 1000 },
      { level: 'error', message: 'e', context: { c: null }, timestamp: 1000 },
    ]);
  });

  it('attaches a captured error when one is given', () => {
    const { logger, entries } = recordingLogger();
    const error = new Error('boom');
    logger.warn('Save failed', { reason: 'quota' }, error);
    expect(entries[0]?.error).toEqual(toCapturedError(error));
  });

  it('captures an error at the error level using its message', () => {
    const { logger, entries } = recordingLogger();
    logger.captureError(new RangeError('out of range'), { area: 'editor' });
    expect(entries).toEqual([
      {
        level: 'error',
        message: 'out of range',
        context: { area: 'editor' },
        timestamp: 1000,
        error: expect.objectContaining({ name: 'RangeError', message: 'out of range' }),
      },
    ]);
  });

  it('drops entries below the minimum level', () => {
    const { logger, entries } = recordingLogger({ minLevel: 'warn' });
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(entries.map((entry) => entry.level)).toEqual(['warn', 'error']);
  });

  it('merges child context over parent context and keeps the parent unchanged', () => {
    const { logger, entries } = recordingLogger({ context: { app: 'books', area: 'root' } });
    const child = logger.child({ area: 'editor' });
    child.child({ projectId: 'p1' }).info('nested', { step: 2 });
    logger.info('parent');

    expect(entries[0]?.context).toEqual({ app: 'books', area: 'editor', projectId: 'p1', step: 2 });
    expect(entries[1]?.context).toEqual({ app: 'books', area: 'root' });
  });

  it('never throws when the sink fails', () => {
    const sink = vi.fn(() => {
      throw new Error('transport down');
    });
    const logger = createLogger({ sink });
    expect(() => logger.error('still fine')).not.toThrow();
    expect(sink).toHaveBeenCalledOnce();
  });

  it('uses the current time by default', () => {
    vi.spyOn(Date, 'now').mockReturnValue(5);
    const entries: LogEntry[] = [];
    createLogger({ sink: (entry) => entries.push(entry) }).info('now');
    expect(entries[0]?.timestamp).toBe(5);
    vi.restoreAllMocks();
  });
});
