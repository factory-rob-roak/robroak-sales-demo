import { createContext, useCallback, useContext, type ReactNode } from 'react';
import type { AnalyticsClient, AnalyticsEvent } from './analyticsEvents';
import { noopAnalyticsClient } from './createMemoryAnalyticsClient';

const AnalyticsContext = createContext<AnalyticsClient>(noopAnalyticsClient);

interface AnalyticsProviderProps {
  client: AnalyticsClient;
  children: ReactNode;
}

/** Sends analytics events from its subtree to `client`, for example a vendor adapter or a test client. */
export function AnalyticsProvider({ client, children }: AnalyticsProviderProps) {
  return <AnalyticsContext.Provider value={client}>{children}</AnalyticsContext.Provider>;
}

export type TrackEvent = (event: AnalyticsEvent) => void;

/**
 * Returns a stable `track` function for the nearest provided client, or a
 * no-op without a provider. A failing client never breaks the UI: analytics
 * is best effort, so its errors are dropped.
 */
export function useTrackEvent(): TrackEvent {
  const client = useContext(AnalyticsContext);
  return useCallback(
    (event: AnalyticsEvent) => {
      try {
        client.track(event);
      } catch {
        // Losing an event is better than interrupting the user's edit.
      }
    },
    [client],
  );
}
