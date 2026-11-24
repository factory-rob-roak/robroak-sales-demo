import { useState } from 'react';
import type { BookSpec } from '../../../types';

export type OrderStep = 'idle' | 'blocked' | 'confirm-empty' | 'ready';

interface OrderFlowInput extends BookSpec {
  emptySpreadCount: number;
  canOrder: boolean;
}

export function useOrderFlow({ canOrder, emptySpreadCount, ...spec }: OrderFlowInput) {
  const bookKey = `${spec.format}|${spec.coverType}|${spec.pageCount}|${emptySpreadCount}`;
  const [state, setState] = useState<{ step: OrderStep; bookKey: string }>({
    step: 'idle',
    bookKey,
  });
  // An order attempt only applies to the book as it was; any edit starts over.
  const step = state.bookKey === bookKey ? state.step : 'idle';
  const goTo = (next: OrderStep) => setState({ step: next, bookKey });

  return {
    step,
    order: () => goTo(!canOrder ? 'blocked' : emptySpreadCount > 0 ? 'confirm-empty' : 'ready'),
    acknowledgeEmpty: () => goTo('ready'),
    cancel: () => goTo('idle'),
  };
}
