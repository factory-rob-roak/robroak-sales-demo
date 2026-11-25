import type { LayoutId } from '../../features/editor/types';
import type { BookFormat, CoverType } from '../../types';

/** How photos reached the book: chosen with the file picker, dragged onto a slot, or placed from a tray selection. */
export type PhotoAddedSource = 'upload' | 'drop' | 'tray';

/**
 * Every product analytics event, keyed by `name`. Property names are part of
 * the reporting contract with the analytics vendor, so rename them only with
 * a migration plan.
 */
export type AnalyticsEvent =
  | { name: 'photo_added'; properties: { source: PhotoAddedSource; count: number } }
  | { name: 'layout_changed'; properties: { spreadId: string; from: LayoutId; to: LayoutId } }
  | {
      name: 'order_started';
      properties: { pageCount: number; format: BookFormat; cover: CoverType; totalCents: number };
    };

/** What the app needs from an analytics vendor. Adapters for Statsig or Amplitude implement this. */
export interface AnalyticsClient {
  track(event: AnalyticsEvent): void;
}
