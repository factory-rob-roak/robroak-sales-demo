export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured, serializable fields attached to an entry. Never put user content
 * (file names, titles, captions, alt text) in a context.
 */
export type LogContext = Readonly<Record<string, string | number | boolean | null>>;

export interface CapturedError {
  name: string;
  message: string;
  stack?: string;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  /** Milliseconds since the Unix epoch. */
  timestamp: number;
  error?: CapturedError;
}

export interface Logger {
  debug(message: string, context?: LogContext, error?: unknown): void;
  info(message: string, context?: LogContext, error?: unknown): void;
  warn(message: string, context?: LogContext, error?: unknown): void;
  error(message: string, context?: LogContext, error?: unknown): void;
  /** Reports a caught error at the `error` level, using its message. */
  captureError(error: unknown, context?: LogContext): void;
  /** Returns a logger that adds `context` to every entry. */
  child(context: LogContext): Logger;
}

/** Where entries go: the stub drops them; a vendor transport would forward them. */
export type LogSink = (entry: LogEntry) => void;

export interface CreateLoggerOptions {
  sink: LogSink;
  /** Entries below this level are dropped. Defaults to `debug`. */
  minLevel?: LogLevel;
  context?: LogContext;
  now?: () => number;
}

const LEVEL_RANK: Readonly<Record<LogLevel, number>> = { debug: 0, info: 1, warn: 2, error: 3 };

function describe(value: unknown): string {
  try {
    return String(value);
  } catch {
    return 'Unknown error';
  }
}

/**
 * Turns anything thrown into plain data a transport can serialize. Checks the
 * shape rather than `instanceof Error`, because a DOMException is not an Error
 * in every environment.
 */
export function toCapturedError(value: unknown): CapturedError {
  if (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    const captured: CapturedError = { name: value.name, message: value.message };
    return 'stack' in value && typeof value.stack === 'string' ? { ...captured, stack: value.stack } : captured;
  }
  return { name: 'NonErrorThrown', message: describe(value) };
}

export function createLogger({ sink, minLevel = 'debug', context = {}, now = Date.now }: CreateLoggerOptions): Logger {
  function log(level: LogLevel, message: string, extra: LogContext = {}, error?: unknown) {
    if (LEVEL_RANK[level] < LEVEL_RANK[minLevel]) return;
    const entry: LogEntry = { level, message, context: { ...context, ...extra }, timestamp: now() };
    if (error !== undefined) entry.error = toCapturedError(error);
    try {
      sink(entry);
    } catch {
      // Reporting must never break the feature that is reporting.
    }
  }

  return {
    debug: (message, extra, error) => log('debug', message, extra, error),
    info: (message, extra, error) => log('info', message, extra, error),
    warn: (message, extra, error) => log('warn', message, extra, error),
    error: (message, extra, error) => log('error', message, extra, error),
    captureError: (error, extra) => log('error', toCapturedError(error).message, extra, error),
    child: (extra) => createLogger({ sink, minLevel, context: { ...context, ...extra }, now }),
  };
}
