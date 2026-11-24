---
name: qa
description: >
  Run QA tests for robroak-sales-demo (photo book storefront and editor). Analyzes the git
  diff against the PR's base branch to find affected areas, runs the relevant customer flows
  against the locally built app, and writes a standardized report with screenshot and GIF
  evidence. Uses droid-control for browser interactions. Use when testing PRs or smoke
  testing the app.
---

# QA Orchestrator

**Scope:** manual, functional QA. Verify the app works by using it as a customer would, in a real browser. Do NOT run lint, typecheck, unit tests, builds as test cases, or other static analysis; separate workflows do that. The one exception is reporting: when no UI change is reachable (Step 3), the report lists the results of the checks that already ran on the commit, read from `qa-results/ci-checks.md` (never by running them yourself).

**Never silently skip a flow.** If a flow cannot complete, report it as BLOCKED with what was tried and how the user can fix it, then continue with the next flow. Never abort the whole run for one failure.

## Step 1: Load configuration

Read `.factory/skills/qa/config.yaml`. It holds the target URL, persona, app path patterns, evidence settings, and the CI checks settings.

Run inputs come from environment variables set by `.github/workflows/qa.yml`. When a variable is unset (a local run), use the default:

| Variable | Meaning | Local default |
| --- | --- | --- |
| `CI` | `true` in CI: no human is available, never ask questions | unset |
| `RUN_ID` | Unique id for this run; prefix for sessions and evidence folder | `$(date +%s)-$$` |
| `QA_BASE_URL` | URL of the app built from this commit | `base_url` in config |
| `QA_DIFF_BASE` | Ref to diff against (the PR's base branch) | `origin/main` |
| `QA_HEAD_SHA` | Commit whose checks are listed | `git rev-parse HEAD` |
| `QA_PR_NUMBER` | PR number, empty for a branch run | empty |
| `QA_BUILD_OUTCOME` | `success` or `failure` of `npm run build` | build it yourself |
| `QA_PREVIEW_READY` | `true` when the preview server answered | start it yourself (see qa-web) |
| `QA_PHOTO_DIR` | Folder of small generated test images | create them (see qa-web) |

Evidence settings are read on every run; never cache them:

- For every affected interactive app, invoke the `droid-control` skill before touching the app. Load its target route for the app (web: browser-use) plus the Capture and Verify stages.
- Load droid-control Compose only when both `video_evidence: true` and `droid_control.compose: true`. Otherwise never invoke Compose; keep raw recordings, screenshots, and text snapshots as evidence.

## Step 2: Target environment

Always test the app built from the commit under test, served locally at `QA_BASE_URL`. There are no preview deployments and no remote environments for QA. Never point the browser at a deployed site; it runs different code than the PR. If the build failed or the preview server is not up, report every web flow as BLOCKED with the reason (see qa-web Known Failure Modes).

## Step 3: Analyze the diff

```bash
git diff --name-only "${QA_DIFF_BASE:-origin/main}...HEAD"
git diff "${QA_DIFF_BASE:-origin/main}...HEAD" -- src index.html vite.config.ts package.json
```

`QA_DIFF_BASE` is the PR's actual base branch. This repo stacks PRs, so the base is often another feature branch, not `main`. Never substitute `main` when a base is given.

Map changed files to apps with `apps.*.path_patterns`. Files that match no app (`infra/**`, `.github/**`, `.factory/**`, docs, `prototype/**`) are not app changes. `prototype/**` is a read-only design spec and never ships.

Decide which case applies:

1. **Reachable UI change.** Changed `src/**` code renders in the running app at this commit. Run Step 5.
2. **No UI change.** No app matched, or the change is pure logic or config with no user-visible effect at this commit. Do not run app flows. Report one row per area of the diff with result :grey_question: INCONCLUSIVE and the note "No reachable UI change; see checks below", then fill the "Checks on `<sha>`" section from `qa-results/ci-checks.md`.
3. **UI change not reachable yet (stacked PRs).** The diff adds or changes components that nothing imported by `src/App.tsx` renders at this commit (check with `git grep` from `src/App.tsx` and `src/main.tsx` down the import chain). Report each such change as :no_entry: BLOCKED with the note "`<Component>` is not rendered by App at this commit; it is wired in by a later PR in the stack". Still open the app, screenshot what is reachable (for example the project list and whatever opening a project shows), and fill the "Checks on `<sha>`" section.

A diff can mix cases; handle each changed area by its own case.

**Checks section.** In CI, `qa-results/ci-checks.md` holds a ready-made table of every check run on `QA_HEAD_SHA` (CI jobs such as lint and typecheck, unit tests, production build, and Terraform fmt and validate when `infra/` changed) with status and conclusion. Copy it as-is under the heading; do not re-run any check. If the file is missing (a local run), use `gh api "repos/{owner}/{repo}/commits/$(git rev-parse HEAD)/check-runs"` when `gh` is authenticated; otherwise write "Check results are only available in CI." Include the section only for cases 2 and 3.

## Step 4: Pre-flight (affected apps only)

Only for apps the diff affects:

- `droid-control@factory-plugins` is active (`droid plugin list --scope project`).
- `agent-browser` is available (`agent-browser doctor --offline --quick`).
- The build succeeded and `QA_BASE_URL` answers (`curl -sf "$QA_BASE_URL"`).
- Test photos exist in `QA_PHOTO_DIR`.

If a pre-flight check fails, report the affected flows as BLOCKED with the error and the fix, and continue with anything that can still run. Skip pre-flight entirely for apps the diff does not affect.

## Step 5: Run diff-relevant flows

For each affected app, read `.factory/skills/qa-<app>/SKILL.md`. It is a menu, not a checklist.

1. Read the diff and pick the flows that exercise the change, plus adjacent flows that prove it integrates (for example a new tray feature still lets you place a photo).
2. Do not run unrelated flows.
3. If no listed flow covers the change, write an ad-hoc flow that directly verifies it.
4. Include at least one negative or boundary test related to the change.
5. Never run unit tests, lint, typecheck, or any automated suite.

## Step 6: Evidence capture

Save every evidence file under `qa-results/$RUN_ID/` with a clear, ordered name: `<NN>-<flow-slug>-<step>.png` (for example `03-keyboard-placement-2-slot-filled.png`), `<NN>-<flow-slug>.gif`, `<NN>-<flow-slug>.webm`. Lowercase, hyphens, no spaces.

For every UI flow you run:

- Take a screenshot after each meaningful state change, through the droid-control browser route.
- Capture the accessibility snapshot of the relevant region as text evidence; trim it to the lines that prove the result.
- When `imagemagick: true`, build one animated GIF per flow from its screenshots, in order:
  `convert -delay 120 -loop 0 -resize 1000x qa-results/$RUN_ID/03-keyboard-placement-*.png qa-results/$RUN_ID/03-keyboard-placement.gif`
- When `video_evidence: true`, also record the flow with droid-control Capture as `<NN>-<flow-slug>.webm` (one recording per flow, never one for the whole run). Keep it short; files over `evidence.max_upload_mb` stay in the artifact only. When `droid_control.compose: true`, run droid-control Compose on the recording with the literal `"preset": "factory"` and a `single` layout, and use the resulting `<NN>-<flow-slug>.mp4` instead; keep the edited video at 60 seconds or less.
- Verify each file exists and is non-empty before referencing it.

**Embedding evidence.** You never upload anything and never handle tokens. Reference each file in the report with a placeholder alone on its own line, using the path relative to `qa-results/`:

```markdown
[[evidence:<RUN_ID>/03-keyboard-placement-2-slot-filled.png]]
```

In CI, the workflow uploads each referenced file to GitHub and replaces the placeholder: images (`.png`, `.gif`) become `![name](url)`, videos (`.webm`, `.mp4`) become a bare URL on its own line. When the upload token is missing or an upload fails, it replaces the placeholder with a note pointing to the downloadable artifact. Never write `![...](...)` or a URL yourself; never embed a link that was not returned by an upload.

## Step 7: Test quality gate

1. Change-specific first: at least half the rows test the new or changed behavior itself.
2. Integration rows are valid: they show the change works with existing features.
3. No unrelated flows.
4. No automated test suites.
5. At least one negative or boundary test related to the change.
6. Interact like a real customer: mouse and keyboard, real file uploads.
7. If you cannot say what the PR changes, mark it INCONCLUSIVE rather than PASS.

## Step 8: Handle failures

Never silently skip a flow. If a flow cannot complete, report it as BLOCKED with what was tried and how the user can fix it, then continue with the next flow.

## Step 9: Generate the report

Write `qa-results/report.md` following `.factory/skills/qa/REPORT-TEMPLATE.md`:

- Start with `## QA Report` and the results table. Result column uses the emojis from the template.
- Keep it short: the table, "Action Required" only when something needs a human, the "Checks on `<sha>`" section only for diff cases 2 and 3, then one collapsed `<details>` block with all evidence.
- Do not add test rows for setup steps (install, build, starting the server).
- Inside the evidence block, give each flow a `### <NN> <flow name>` heading, then its GIF placeholder, its screenshot placeholders, its video placeholder (if any), and a short fenced accessibility snapshot that proves the result.
- Do not add a summary of what the diff does, metadata tables, or long prose.

## Step 10: Suggest skill updates (failure learning)

Read `failure_learning` from config. With `suggest_in_report`, when a BLOCKED or FAIL result reveals a new insight about the testing environment that is not already in the sub-skill's Known Failure Modes, append this section to the report. Do not write `skill-updates.json`.

```markdown
## Suggested Skill Updates (N issues found)

| # | Severity | File | Issue | Fix Prompt |
| --- | --- | --- | --- | --- |
| 1 | 🟡 Degraded | `.factory/skills/qa-web/SKILL.md` | <short description> | <details><summary>Copy</summary><br>`<self-contained droid prompt that adds the item under Known Failure Modes>`</details> |
```

Severity: `🔴 Breaking` (fails every run), `🟡 Degraded` (intermittent or slow), `🔵 Info` (useful new knowledge). Suggest only environment and workflow insights (timing, tooling quirks, setup steps), never selector typos or behavior changes the PR intended. Omit the section when there is nothing new.
