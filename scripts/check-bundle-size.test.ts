// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { compare, formatReport, measure } from './check-bundle-size.mjs';

let dist = '';

function write(path: string, content: string) {
  writeFileSync(join(dist, path), content);
}

const gz = (content: string) => gzipSync(content).length;

const entryJs = 'console.log("entry");'.repeat(50);
const entryCss = '.page { color: red; }'.repeat(20);
const lazyJs = 'export const editor = 1;'.repeat(80);
const lazyCss = '.editor { color: blue; }'.repeat(30);

beforeEach(() => {
  dist = mkdtempSync(join(tmpdir(), 'bundle-size-'));
  mkdirSync(join(dist, 'assets'));
  write(
    'index.html',
    '<script type="module" crossorigin src="/assets/index.js"></script>\n' +
      '<link rel="stylesheet" crossorigin href="/assets/index.css">',
  );
  write('assets/index.js', entryJs);
  write('assets/index.css', entryCss);
  write('assets/Editor.js', lazyJs);
  write('assets/Editor.css', lazyCss);
});

afterEach(() => {
  rmSync(dist, { recursive: true, force: true });
});

describe('measure', () => {
  it('splits what index.html loads from the lazy chunks', () => {
    expect(measure(dist)).toEqual({
      initialJs: gz(entryJs),
      initialCss: gz(entryCss),
      totalJs: gz(entryJs) + gz(lazyJs),
      totalCss: gz(entryCss) + gz(lazyCss),
    });
  });

  it('counts modulepreloaded chunks as initial', () => {
    write(
      'index.html',
      '<script type="module" src="/assets/index.js"></script><link rel="modulepreload" href="/assets/Editor.js">',
    );
    expect(measure(dist).initialJs).toBe(gz(entryJs) + gz(lazyJs));
  });

  it('asks for a build when dist has none', () => {
    expect(() => measure(join(dist, 'missing'))).toThrow('Run `npm run build` first');
  });

  it('fails when index.html loads a file that is not there', () => {
    rmSync(join(dist, 'assets/index.css'));
    expect(() => measure(dist)).toThrow('index.html loads /assets/index.css');
  });
});

describe('compare', () => {
  const sizes = { initialJs: 70_000, initialCss: 500, totalJs: 82_000, totalCss: 3_900 };

  it('passes sizes at or under budget and flags the ones over', () => {
    const rows = compare(sizes, { initialJs: 70, initialCss: 1, totalJs: 81.9, totalCss: 4 });
    expect(rows.map((row) => [row.key, row.ok])).toEqual([
      ['initialJs', true],
      ['initialCss', true],
      ['totalJs', false],
      ['totalCss', true],
    ]);
    expect(formatReport(rows)).toContain('| All JS, including lazy chunks | 82.00 kB | 81.90 kB | OVER BUDGET |');
  });

  it('rejects a missing or non-positive budget', () => {
    expect(() => compare(sizes, { initialJs: 70, initialCss: 1, totalJs: 90 })).toThrow('"totalCss"');
    expect(() => compare(sizes, { initialJs: 0, initialCss: 1, totalJs: 90, totalCss: 4 })).toThrow('"initialJs"');
  });
});
