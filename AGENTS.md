# AGENTS.md

Rules for every human and agent working in this repo. Senior engineers own this file; change it only in a PR that a senior engineer approves.

## Commands

```bash
npm ci               # install (use the lockfile, never npm install in CI)
npm run lint         # ESLint, zero warnings
npm run typecheck    # tsc --noEmit, strict mode
npm run test         # Vitest + Testing Library
npm run build        # Vite production build
npm run check        # all of the above; must pass before you open a PR
```

## Repo map

- `src/` is production code. Everything here ships.
- `src/lib/` holds shared domain logic. `pricing.ts` is the only source of truth for prices.
- `src/components/` holds shared UI components.
- `src/features/<feature>/` holds feature code, for example `src/features/editor/`.
- `prototype/` holds design hand-offs. It is a read-only spec: never edit, import, or copy code from it. Rebuild the behavior in `src/` to these standards.
- `infra/` holds deployment config for AWS.

## Code standards

- TypeScript strict. No `any`, no `@ts-ignore`, no non-null assertions on data from users or storage.
- Function components and hooks only. One component per file, named exports, file name matches the component.
- Keep components under about 150 lines. Move state logic into a reducer or a custom hook in the same feature folder.
- Styles go in CSS Modules (`*.module.css`). No inline `style` props except for values computed at runtime.
- Money is always integer cents. Use `priceBook` from `src/lib/pricing.ts` and `formatCents` from `src/lib/money.ts`. Never compute prices with floats or duplicate price tables.
- No `console.*`, `alert`, `confirm`, or `window.location` assignments in components. Use UI state and the router.
- No module-level mutable state and no globals on `window`.
- Network calls go through `src/api/`, never directly from components. The upload API is not live; stub it behind an interface.
- Persisting to `localStorage` goes through a single typed, versioned storage module that handles bad data.
- No new runtime dependencies without a one-line justification in the PR description.

## Accessibility

- Interactive elements are `<button>`, `<a>`, or labeled form controls. No clickable `<div>` or `<span>`.
- Every image has meaningful `alt` text, or `alt=""` if decorative.
- Everything that works with a mouse also works with a keyboard, including drag-and-drop (offer a keyboard alternative).
- Keep visible focus styles. Never remove outlines.

## Tests

- Colocate tests as `*.test.ts(x)` next to the code.
- Test behavior through Testing Library queries by role and label, not implementation details.
- Every bug fix includes a test that fails without the fix.
- New logic in `src/lib/` needs full branch coverage.

## Pull requests

- One area of work per PR, ideally under 400 changed lines. Split larger work into stacked PRs.
- Branch names: `<type>/<short-description>`, for example `feat/editor-page-canvas`.
- Titles use Conventional Commits: `feat(editor): add page canvas`.
- Fill in the PR template, including how you verified the change and screenshots for UI changes.
- `npm run check` passes locally and CI is green before you request review.
- Never push to `main` directly.
