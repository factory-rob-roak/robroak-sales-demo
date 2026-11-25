/**
 * Contrast checks against the colors declared in CSS Modules. jsdom does not
 * lay out or cascade styles, so tests read the stylesheet source instead.
 */
export type Rgb = readonly [number, number, number];

export function parseHex(hex: string): Rgb {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match?.[1]) throw new Error(`Not a hex color: ${hex}`);
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join('') : match[1];
  const channel = (start: number) => parseInt(digits.slice(start, start + 2), 16);
  return [channel(0), channel(2), channel(4)];
}

/** `top` drawn at `alpha` opacity over `bottom`. */
export function blend(top: Rgb, bottom: Rgb, alpha: number): Rgb {
  const channel = (i: 0 | 1 | 2) => top[i] * alpha + bottom[i] * (1 - alpha);
  return [channel(0), channel(1), channel(2)];
}

function luminance([r, g, b]: Rgb): number {
  const linear = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Declarations of every rule whose selector list contains exactly `selector`. */
export function declarations(css: string, selector: string): Record<string, string> {
  const result: Record<string, string> = {};
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, selectors = '', body = ''] of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectors.split(',').some((s) => s.trim() === selector)) continue;
    for (const declaration of body.split(';')) {
      const colon = declaration.indexOf(':');
      if (colon > 0) result[declaration.slice(0, colon).trim()] = declaration.slice(colon + 1).trim();
    }
  }
  return result;
}

/** The color of an `outline: <width> <style> <color>` shorthand. */
export function outlineColor(css: string, selector: string): Rgb {
  const color = declarations(css, selector)
    .outline?.split(/\s+/)
    .find((part) => part.startsWith('#'));
  if (!color) throw new Error(`No outline color for ${selector}`);
  return parseHex(color);
}
