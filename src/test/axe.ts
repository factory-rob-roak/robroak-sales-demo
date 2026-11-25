import axe from 'axe-core';

/**
 * Runs axe-core on a rendered subtree and returns one line per violation.
 * jsdom has no layout, so color-contrast is off here; contrast is checked
 * against the CSS colors instead (see contrast.ts). Label-in-name is
 * experimental in axe and opted in explicitly.
 */
export async function axeViolations(context: Element): Promise<string[]> {
  const results = await axe.run(context, {
    rules: {
      'color-contrast': { enabled: false },
      'label-content-name-mismatch': { enabled: true },
    },
  });
  return results.violations.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`),
  );
}
