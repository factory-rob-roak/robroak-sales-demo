import { createElement, memo, type ComponentType, type MemoExoticComponent } from 'react';

/**
 * Wraps a component for render-count tests: `onRender` runs each time its parent
 * re-renders it. Updates from the component's own state are not counted. A
 * `React.memo` component stays memoized (with the default shallow prop comparison),
 * so a render it skips is not counted.
 */
export function countRenders<P extends object>(
  component: ComponentType<P> | MemoExoticComponent<ComponentType<P>>,
  onRender: () => void,
): ComponentType<P> {
  const isMemo = 'type' in component;
  const Inner: ComponentType<P> = isMemo ? component.type : component;
  function Counted(props: P) {
    onRender();
    return createElement(Inner, props);
  }
  return isMemo ? memo(Counted) : Counted;
}
