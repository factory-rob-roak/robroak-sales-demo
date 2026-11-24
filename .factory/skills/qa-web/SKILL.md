---
name: qa-web
description: >
  QA tests for the photo book web app (src/**): project list, photo book editor, photo tray
  uploads, drag-and-drop and keyboard photo placement, layouts, captions, and the order
  summary price. Drives a real browser through droid-control against the app built from the
  commit under test.
---

# QA: web app

Vite + React 19 + TypeScript single-page app. No backend, no login, no router. `src/App.tsx` shows the project list; opening a project replaces the page with the editor (once the editor is wired in). Uploads go through an in-memory stub client.

Use the `droid-control` skill for every browser interaction. Load its browser-use target route plus Capture and Verify; it owns how to drive the browser, record, and verify. This file says what to test and what success looks like. Load Compose only when both `video_evidence` and `droid_control.compose` are true in `.factory/skills/qa/config.yaml`.

## Testing target

Always test the code under test, served locally. Never fall back to a deployed or remote site.

- **In CI**, the workflow already ran `npm ci` and `npm run build`, started `npx vite preview --host 127.0.0.1 --port 4173 --strictPort`, and polled it. Use `QA_BASE_URL`. If `QA_BUILD_OUTCOME` is not `success` or `QA_PREVIEW_READY` is not `true`, report every web flow as BLOCKED ("Build failed" or "Preview server did not start"; point to the workflow log) and stop.
- **Locally**, from the repo root:
  ```bash
  npm ci && npm run build
  npx vite preview --host 127.0.0.1 --port 4173 --strictPort &   # run in the background
  for i in $(seq 1 30); do curl -sf http://127.0.0.1:4173/ >/dev/null && break; sleep 1; done
  ```
  Then use `http://127.0.0.1:4173`. Stop the server when done.

Use one browser session named `${RUN_ID}-browser`, a `1440x900` viewport (all three columns visible), and close the session at the end. A fresh session starts with empty localStorage, so every project opens as a new default book.

## Authentication

None. The app has no login and needs no secrets. The `customer` persona is the only persona.

## Test photos

Use small generated images, never real photos. In CI they are in `QA_PHOTO_DIR` (`qa-red.png`, `qa-green.png`, `qa-blue.png`, `qa-orange.png`, each 320x240 with its color name printed on it) plus `qa-not-an-image.txt` for negative tests. Locally, create them:

```bash
QA_PHOTO_DIR="$(mktemp -d)"
for c in red green blue orange; do
  convert -size 320x240 "xc:$c" -gravity center -pointsize 48 -fill white -annotate 0 "$c" "$QA_PHOTO_DIR/qa-$c.png"
done
echo "not an image" > "$QA_PHOTO_DIR/qa-not-an-image.txt"
```

The editor derives a photo's description from its file name: `qa-red.png` shows up as "qa red".

## Pricing oracle

Never trust the number on screen on its own. Compute the expected price from `src/lib/pricing.ts` at the commit under test:

`total = BASE_PRICE_CENTS[format] + (pages - INCLUDED_PAGES) * EXTRA_PAGE_CENTS[format] + COVER_UPCHARGE_CENTS[coverType]`

Printed pages = spreads x 2. Prices exist only for an even page count from `MIN_PAGES` (20) to `MAX_PAGES` (100); below 20 the summary says how many more pages are needed instead of a total. With the tables on `main` today: "Family Recipes" (8.5x11 Portrait, Softcover) is $39.99 at 20 pages and $42.49 at 22 pages; "Summer in Maine" (11x8.5 Landscape, Hardcover) is $59.99 at 20 pages and $62.99 at 22 pages. Re-derive these if `pricing.ts` changed in the diff. Money is formatted like `$42.49`.

## Flow menu

Pick only the flows the diff touches, plus adjacent ones that prove integration. Discover controls by role and accessible name from a fresh snapshot; the names below are what the app uses today and may change in the PR under test. Number the flows in run order for evidence file names.

### F1. Open a project from the project list

Touches: `src/App.tsx`, `src/components/ProjectCard*`, `src/data/sampleProjects.ts`, `src/features/editor/Editor*`.

1. Open `QA_BASE_URL`. Expect heading "Your photo books" and a "Projects" region with one article per sample project, each showing format, cover, page count, a price, and a button "Open <title>".
2. Check each card's price against the pricing oracle for its format, cover, and page count.
3. Activate "Open Family Recipes" with the keyboard (focus it, press Enter).
4. Expect the editor: heading level 1 "Family Recipes" with focus on it, a "Back to projects" button, regions "Photos (0)", "Spread 1 of 2", "Pages", "Order summary", and "Book settings".
5. Activate "Back to projects". Expect the list again, focus on "Your photo books".

If the editor is not wired into App at this commit, opening a project shows a status message instead; screenshot it and report editor flows as BLOCKED (see the orchestrator, diff case 3).

### F2. Add photos to the tray

Touches: `src/features/editor/components/PhotoTray*`, `AddPhotosButton*`, `UploadStatus*`, `useTrayUploads*`, `src/api/**`, `src/features/editor/usePhotoUpload*`.

1. In the editor, upload `qa-red.png`, `qa-green.png`, `qa-blue.png` together through the "Add photos" file input (`input[type=file][multiple]`).
2. Wait for the stub latency (about 300 ms per file) until the heading reads "Photos (3)".
3. Expect a "Photo library" list with buttons "qa red", "qa green", "qa blue", each with an image of the same name, and "Auto-fill empty slots" enabled.
4. Negative: upload `qa-not-an-image.txt`. Expect an error naming the file ("is not a supported image") that can be dismissed, and the count stays at 3.

### F3. Place a photo by drag-and-drop

Touches: `PageSlot*`, `TrayPhoto*`, `photoDrag*`, `PageCanvas*`.

1. With photos in the tray and layout "Full page", drag "qa red" onto "Slot 1: empty".
2. Expect the slot to read "Slot 1: qa red" with the image shown, a "Remove photo from slot 1" button, the tray button to read "qa red, in book" with an "In book" badge, and the spread's thumbnail in "Pages" to show the photo.
3. The app uses native HTML5 drag events with the data type `application/x-photobook-photo-id`. See Known Failure Modes item 1 for how to drive the drop when the driver's built-in drag does not fire those events.

### F4. Place a photo with the keyboard (select, then choose a slot)

Touches: `PageSlot*`, `TrayPhoto*`, `PhotoTray*`, `PageCanvas*`, `SelectedPhotoDetails*`.

1. Choose a layout with at least two slots ("Two up").
2. Tab to "qa green" and press Enter. Expect it pressed (`aria-pressed=true`), a status message "Selected qa green. Choose a slot on the page.", and slot buttons renamed "Place qa green in slot N".
3. Tab to "Place qa green in slot 2" and press Enter. Expect "Slot 2: qa green", status "Placed qa green in slot 2.", and the selection cleared.
4. Negative: with no photo selected, activating an empty slot does nothing (slots are `aria-disabled`). Press Escape while a photo is selected and focus is still in the photo tray: the selection clears (Escape on a page slot does nothing).
5. Tap path: clicking the photo and then the slot gives the same result.

### F5. Change layouts without losing photos

Touches: `LayoutPicker*`, `editorReducer*` (setLayout), `constants.ts` (LAYOUTS), `PageCanvas*`.

1. Fill slots 1 and 2 under "Two up".
2. Switch to "Full page" (1 slot). Expect only "Slot 1: qa red".
3. Switch back to "Two up". Expect "Slot 1: qa red" and "Slot 2: qa green" again.
4. Switch to "Collage". Expect 6 slots with the two photos in slots 1 and 2 and the rest empty.
5. While the "qa green" photo is hidden by the smaller layout, the tray still marks it "in book".

### F6. Add a caption

Touches: `PageCanvas*` (Caption field), `editorReducer*` (setCaption).

1. Fill the "Caption" text box with `Grandma's kitchen`.
2. Expect the value to stick. Switch to spread 2 and back; the caption belongs to spread 1 only.
3. Undo (the "Undo" button, or Ctrl+Z after moving focus out of the Caption field) restores the previous caption. Ctrl+Z inside the field is the browser's own text undo, not the editor's.

### F7. Price updates as spreads are added

Touches: `src/features/editor/order/**`, `SpreadList*`, `src/lib/pricing.ts`, `src/lib/money.ts`, `BookSettings*` (size and cover).

1. Open "Family Recipes". A new book has 2 spreads (4 printed pages). Expect "Order summary" to say books start at the 20-page price and how many more pages are needed ("Add 16 more pages to reach the 20-page minimum.").
2. Activate "Add spread" until "Pages" shows "10 spreads · 20 printed pages". Expect "Total" equal to the oracle for 20 pages, and "Book with 20 pages" in the breakdown.
3. Add one more spread (22 pages). Expect the total to rise by `2 * EXTRA_PAGE_CENTS[format]` and an "2 extra pages" line.
4. Change "Cover" to "Hardcover" in "Book settings". Expect a "Hardcover upgrade" line and the total to rise by the cover upcharge.
5. Boundary: at 50 spreads (100 pages) "Add spread" is disabled. Deleting a spread lowers the total.
6. Check "Order book" with empty spreads warns that spreads will print blank and offers "Order anyway" and "Keep editing" (no browser alert or confirm dialogs).

### Ad-hoc flows

When the diff changes something no flow covers (themes, zoom, undo and redo, spread reordering, alt text, re-adding a missing photo, saving and reloading), write a short flow that exercises exactly that change with the same evidence rules. For persistence, reload the page: placements and captions survive, and photos uploaded through the stub come back marked missing with a "Re-add photo" button, because blob: URLs do not survive a reload.

## Per-persona variations

Only the `customer` persona exists. Cover both input styles for anything interactive: mouse (or tap) and keyboard only. Every action a mouse can do must also work with the keyboard; a mouse-only action is a FAIL.

## Error handling

- The app must never show `alert`, `confirm`, or `prompt` dialogs. If droid-control reports a JavaScript dialog, record it as a FAIL.
- Check the browser console for uncaught errors at the end of each flow; report any as a FAIL with the message.

## Known Failure Modes

1. **Driver drag does not fire HTML5 drag events.** `agent-browser drag <src> <dst>` moves the mouse with CDP and completes without error, but Chromium does not dispatch `dragstart` / `drop` to the page, so the slot stays empty. That is a tooling limitation, not an app bug. Try the driver's drag first; if the slot did not change, dispatch the events in the page with a shared `DataTransfer` (evaluate this through the browser driver, adjusting the two selectors):
   ```js
   (() => {
     const src = document.querySelector('button[aria-label="qa red"]');
     const target = document.querySelector('button[aria-label="Slot 1: empty"]');
     const dt = new DataTransfer();
     const fire = (el, type) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
     fire(src, 'dragstart'); fire(target.parentElement, 'dragenter'); fire(target, 'dragover'); fire(target, 'drop'); fire(src, 'dragend');
     return Array.from(dt.types).join(',');
   })()
   ```
   It returns `application/x-photobook-photo-id` when the tray item set its drag data. Note in the row which method placed the photo.
2. **Interactive snapshots hide tray photos.** `snapshot -i` omits the photo buttons inside the "Photo library" list. Use a full snapshot (no `-i`) or CSS selectors such as `button[aria-label="qa red"]` for the tray.
3. **`aria-disabled` shows as disabled.** Slots without a selected photo, "Undo" with no history, and "Add spread" at the limit use `aria-disabled` and appear as `[disabled]` in snapshots. They stay focusable on purpose; do not report that as a bug.
4. **No price below 20 pages.** A new book has 2 spreads (4 pages), so the order summary shows the starting price and how many pages are missing, not a total. Add spreads before checking totals.
5. **Uploads are asynchronous.** The stub waits about 300 ms per file. Wait for the "Photos (N)" heading to reach the expected count before acting on new photos.
6. **Photos go missing after a reload.** Stub uploads are blob: URLs; after a reload they are marked missing with a "Re-add photo" button. Expected behavior, not a regression.
7. **Stacked PRs.** Editor components can land before the PR that renders them from `src/App.tsx`. If a changed component is not reachable, report it BLOCKED (orchestrator diff case 3) instead of failing it.
8. **"Re-add photo" opens a native file chooser.** The button remembers the photo and clicks a hidden single-file input (`input[type=file]:not([multiple])`, labeled "Replacement photo"), which the driver cannot operate as a dialog. Activate "Re-add photo <name>" first, then upload the file straight into that input through the browser driver.
9. **Page scripts share one global scope.** Every evaluated snippet runs in the same page scope, so a top-level `const` or `let` fails on the second run with "Identifier has already been declared". Wrap snippets in an IIFE (as in item 1) or use plain expressions. Move keyboard focus with the driver's focus command on a selector or ref.
