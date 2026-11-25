import { describe, expect, it } from 'vitest';
import { createMemoryAnalyticsClient, noopAnalyticsClient } from './createMemoryAnalyticsClient';

describe('createMemoryAnalyticsClient', () => {
  it('records events in order and clears them', () => {
    const client = createMemoryAnalyticsClient();
    client.track({ name: 'photo_added', properties: { source: 'upload', count: 2 } });
    client.track({ name: 'layout_changed', properties: { spreadId: 's1', from: 'full', to: 'collage' } });
    expect(client.events.map((event) => event.name)).toEqual(['photo_added', 'layout_changed']);
    client.clear();
    expect(client.events).toEqual([]);
  });

  it('keeps separate events for separate clients', () => {
    const a = createMemoryAnalyticsClient();
    const b = createMemoryAnalyticsClient();
    a.track({ name: 'photo_added', properties: { source: 'tray', count: 1 } });
    expect(b.events).toEqual([]);
  });
});

describe('noopAnalyticsClient', () => {
  it('accepts events without keeping them', () => {
    expect(() =>
      noopAnalyticsClient.track({ name: 'photo_added', properties: { source: 'drop', count: 1 } }),
    ).not.toThrow();
  });
});
