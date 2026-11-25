#!/usr/bin/env node
// Fails when the gzip size of the production build goes over the budgets in
// bundle-budget.json. Run after `npm run build`: `npm run size`.
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

/** Budget keys, in report order, with what each one measures. */
export const BUDGETS = {
  initialJs: 'JS loaded by index.html (project list)',
  initialCss: 'CSS loaded by index.html (project list)',
  totalJs: 'All JS, including lazy chunks',
  totalCss: 'All CSS, including lazy chunks',
};

const gzipBytes = (file) => gzipSync(readFileSync(file)).length;

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

/** The JS and CSS files index.html loads up front: entry script, stylesheets, and modulepreloads. */
function initialFiles(distDir) {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+\.(?:js|css))"/g)];
  return refs.map(([, ref]) => {
    const file = join(distDir, ref.replace(/^\//, ''));
    if (!existsSync(file)) throw new Error(`index.html loads ${ref}, which is not in ${distDir}`);
    return file;
  });
}

/** Gzip sizes in bytes for each budget key. */
export function measure(distDir) {
  if (!existsSync(join(distDir, 'index.html'))) {
    throw new Error(`No build found in ${distDir}. Run \`npm run build\` first.`);
  }
  const sum = (files, ext) => files.filter((f) => extname(f) === ext).reduce((total, f) => total + gzipBytes(f), 0);
  const initial = initialFiles(distDir);
  const all = listFiles(distDir);
  return {
    initialJs: sum(initial, '.js'),
    initialCss: sum(initial, '.css'),
    totalJs: sum(all, '.js'),
    totalCss: sum(all, '.css'),
  };
}

/** Compares sizes (bytes) with budgets (kB, 1 kB = 1000 bytes, matching Vite's report). */
export function compare(sizes, budgets) {
  return Object.keys(BUDGETS).map((key) => {
    const budget = budgets[key];
    if (typeof budget !== 'number' || !(budget > 0)) {
      throw new Error(`bundle-budget.json needs a positive number of kB for "${key}"`);
    }
    return { key, label: BUDGETS[key], kb: sizes[key] / 1000, budget, ok: sizes[key] <= budget * 1000 };
  });
}

export function formatReport(rows) {
  const lines = [
    '| Budget | Gzip size | Limit | Status |',
    '| --- | ---: | ---: | --- |',
    ...rows.map(
      (r) => `| ${r.label} | ${r.kb.toFixed(2)} kB | ${r.budget.toFixed(2)} kB | ${r.ok ? 'ok' : 'OVER BUDGET'} |`,
    ),
  ];
  return lines.join('\n');
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const budgets = JSON.parse(readFileSync(join(root, 'bundle-budget.json'), 'utf8'));
  const rows = compare(measure(join(root, 'dist')), budgets);
  const report = formatReport(rows);
  process.stdout.write(`${report}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Bundle size\n\n${report}\n`);
  }
  const over = rows.filter((r) => !r.ok);
  if (over.length > 0) {
    process.stderr.write(
      `\nOver budget: ${over.map((r) => r.key).join(', ')}. ` +
        'Shrink the bundle, or raise the limit in bundle-budget.json and explain why in the PR.\n',
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
