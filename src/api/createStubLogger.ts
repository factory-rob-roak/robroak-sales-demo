import { createLogger, type LogEntry, type Logger, type LogLevel } from './logger';

export interface StubLoggerOptions {
  /** Receives every entry, for example a test spy. Entries are dropped when omitted. */
  onEntry?: (entry: LogEntry) => void;
  minLevel?: LogLevel;
  now?: () => number;
}

/**
 * Stand-in until an error tracking vendor is chosen. A vendor logger only
 * needs to implement `Logger`, or pass its transport as the sink to `createLogger`.
 */
export function createStubLogger({ onEntry, minLevel, now }: StubLoggerOptions = {}): Logger {
  return createLogger({ sink: onEntry ?? (() => undefined), minLevel, now });
}
