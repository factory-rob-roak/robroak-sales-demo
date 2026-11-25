import { createContext, useContext, type ReactNode } from 'react';
import { createStubLogger } from './createStubLogger';
import type { Logger } from './logger';

// The default stub drops entries and holds no state, so sharing one instance is safe.
const LoggerContext = createContext<Logger>(createStubLogger());

interface LoggerProviderProps {
  logger: Logger;
  children: ReactNode;
}

/** Swaps the logger for its subtree, for example a vendor logger or a test spy. */
export function LoggerProvider({ logger, children }: LoggerProviderProps) {
  return <LoggerContext.Provider value={logger}>{children}</LoggerContext.Provider>;
}

/** Returns the nearest provided logger, or a stub that drops entries when none is provided. */
export function useLogger(): Logger {
  return useContext(LoggerContext);
}
