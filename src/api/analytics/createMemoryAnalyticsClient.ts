import type { AnalyticsClient, AnalyticsEvent } from './analyticsEvents';

export interface MemoryAnalyticsClient extends AnalyticsClient {
  /** Events in the order they were tracked. */
  readonly events: readonly AnalyticsEvent[];
  clear(): void;
}

/** Keeps tracked events in memory, for tests and for local debugging before a vendor is chosen. */
export function createMemoryAnalyticsClient(): MemoryAnalyticsClient {
  let events: AnalyticsEvent[] = [];
  return {
    get events() {
      return events;
    },
    track(event) {
      events = [...events, event];
    },
    clear() {
      events = [];
    },
  };
}

/** Drops every event. Used when no client is provided. */
export const noopAnalyticsClient: AnalyticsClient = Object.freeze({ track: () => {} });
