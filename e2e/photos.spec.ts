import { expect, test } from './fixtures';
import { addPhotos, chooseLayout, openProject, placeWithKeyboard, trayPhoto } from './helpers';

test.beforeEach(async ({ page }) => {
  await openProject(page, 'Family Recipes');
  await addPhotos(page, ['red', 'green', 'blue']);
});

test('adds photos to the tray and reports unsupported files', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Photos (3)' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Auto-fill empty slots' })).toHaveAttribute('aria-disabled', 'false');

  await page
    .getByLabel('Add photos')
    .setInputFiles({ name: 'qa-not-an-image.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
  const problems = page.getByRole('list', { name: 'Upload problems' });
  await expect(problems).toContainText('qa-not-an-image.txt is not a supported image');
  await expect(page.getByRole('heading', { name: 'Photos (3)' })).toBeVisible();

  await problems.getByRole('button', { name: /^Dismiss: qa-not-an-image\.txt/ }).press('Enter');
  await expect(problems).toBeHidden();
  await expect(page.getByLabel('Add photos')).toBeFocused();
});

test('places a photo by dragging it onto a slot', async ({ page }) => {
  await trayPhoto(page, 'qa red').dragTo(page.getByRole('button', { name: 'Slot 1: empty' }));

  const slot = page.getByRole('button', { name: 'Slot 1: qa red' });
  await expect(slot.getByRole('img', { name: 'qa red' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove photo from slot 1' })).toBeVisible();
  await expect(trayPhoto(page, 'qa red, in book')).toBeVisible();
});

test('places a photo with the keyboard, then removes it and undoes the removal', async ({ page }) => {
  await chooseLayout(page, 'Two up');
  const green = trayPhoto(page, 'qa green');
  await green.press('Enter');
  await expect(green).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status').filter({ hasText: 'Selected qa green.' })).toBeVisible();

  await page.getByRole('button', { name: 'Place qa green in slot 2' }).press('Enter');
  await expect(page.getByRole('button', { name: 'Slot 2: qa green' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Placed qa green in slot 2.' })).toBeAttached();
  await expect(trayPhoto(page, 'qa green, in book')).toHaveAttribute('aria-pressed', 'false');

  // Escape in the tray clears a selection.
  await trayPhoto(page, 'qa blue').press('Enter');
  await page.keyboard.press('Escape');
  await expect(trayPhoto(page, 'qa blue')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Slot 1: empty' })).toHaveAttribute('aria-disabled', 'true');

  await page.getByRole('button', { name: 'Remove photo from slot 2' }).press('Enter');
  await expect(page.getByRole('button', { name: 'Slot 2: empty' })).toBeFocused();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.getByRole('button', { name: 'Slot 2: qa green' })).toBeVisible();
});

test('places a photo by tapping the photo and then the slot', async ({ page }) => {
  await trayPhoto(page, 'qa blue').click();
  await page.getByRole('button', { name: 'Place qa blue in slot 1' }).click();
  await expect(page.getByRole('button', { name: 'Slot 1: qa blue' })).toBeVisible();
});

test('keeps photos when switching layouts', async ({ page }) => {
  await chooseLayout(page, 'Two up');
  await placeWithKeyboard(page, 'qa red', 1);
  await placeWithKeyboard(page, 'qa green', 2);
  const slots = page.getByRole('button', { name: /^Slot \d+:/ });

  await chooseLayout(page, 'Full page');
  await expect(slots).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Slot 1: qa red' })).toBeVisible();
  // A photo hidden by a smaller layout still counts as used.
  await expect(trayPhoto(page, 'qa green, in book')).toBeVisible();

  await chooseLayout(page, 'Two up');
  await expect(page.getByRole('button', { name: 'Slot 2: qa green' })).toBeVisible();

  await chooseLayout(page, 'Collage');
  await expect(slots).toHaveCount(6);
  await expect(page.getByRole('button', { name: 'Slot 1: qa red' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Slot 2: qa green' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Slot [3-6]: empty$/ })).toHaveCount(4);
});
