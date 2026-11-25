import { useEffect, useRef, useState } from 'react';

export const ANNOUNCE_DELAY_MS = 600;

/**
 * Returns `message` once it has stopped changing for `delayMs`, for a polite
 * live region. Stays empty until the message first changes, so nothing is
 * announced on load and screen readers are not interrupted on every keystroke.
 */
export function useSettledAnnouncement(message: string, delayMs = ANNOUNCE_DELAY_MS): string {
  const [announcement, setAnnouncement] = useState('');
  const [initial] = useState(message);
  const changed = useRef(false);

  useEffect(() => {
    if (!changed.current && message === initial) return;
    changed.current = true;
    const timer = setTimeout(() => setAnnouncement(message), delayMs);
    return () => clearTimeout(timer);
  }, [message, initial, delayMs]);

  return announcement;
}
