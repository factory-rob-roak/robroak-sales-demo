import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { AnalyticsClient } from './analyticsEvents';
import { AnalyticsProvider, useTrackEvent } from './AnalyticsProvider';
import { createMemoryAnalyticsClient } from './createMemoryAnalyticsClient';

function AddButton() {
  const track = useTrackEvent();
  return (
    <button type="button" onClick={() => track({ name: 'photo_added', properties: { source: 'tray', count: 1 } })}>
      Add
    </button>
  );
}

describe('useTrackEvent', () => {
  it('sends events to the provided client', async () => {
    const client = createMemoryAnalyticsClient();
    render(
      <AnalyticsProvider client={client}>
        <AddButton />
      </AnalyticsProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(client.events).toEqual([{ name: 'photo_added', properties: { source: 'tray', count: 1 } }]);
  });

  it('works without a provider', async () => {
    render(<AddButton />);
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('keeps the UI working when the client throws', async () => {
    const failing: AnalyticsClient = {
      track: () => {
        throw new Error('vendor down');
      },
    };
    render(
      <AnalyticsProvider client={failing}>
        <AddButton />
      </AnalyticsProvider>,
    );
    await expect(userEvent.click(screen.getByRole('button', { name: 'Add' }))).resolves.toBeUndefined();
  });
});
