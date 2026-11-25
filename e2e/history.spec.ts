import { expect, test } from './fixtures';
import { addPhotos, openProject, photoFile, placeWithKeyboard } from './helpers';

test.beforeEach(async ({ page }) => {
  await openProject(page, 'Family Recipes');
});

test('keeps a caption on its own spread and undoes it with the toolbar', async ({ page }) => {
  const caption = page.getByRole('textbox', { name: 'Caption' });
  await caption.fill("Grandma's kitchen");

  await page.getByRole('button', { name: 'Spread 2, pages 3–4' }).click();
  await expect(page.getByRole('heading', { name: 'Spread 2 of 2' })).toBeVisible();
  await expect(caption).toHaveValue('');
  await page.getByRole('button', { name: 'Spread 1, pages 1–2' }).click();
  await expect(caption).toHaveValue("Grandma's kitchen");

  const history = page.getByRole('group', { name: 'History' });
  await history.getByRole('button', { name: 'Undo' }).click();
  await expect(caption).toHaveValue('');
  await expect(history.getByRole('button', { name: 'Undo' })).toHaveAttribute('aria-disabled', 'true');
  await history.getByRole('button', { name: 'Redo' }).click();
  await expect(caption).toHaveValue("Grandma's kitchen");
});

test('undoes and redoes with keyboard shortcuts only while focus is in the editor', async ({ page }) => {
  await addPhotos(page, ['red']);
  await placeWithKeyboard(page, 'qa red', 1);
  const filled = page.getByRole('button', { name: 'Slot 1: qa red' });
  const empty = page.getByRole('button', { name: 'Slot 1: empty' });

  await filled.focus();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(empty).toBeVisible();
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(filled).toBeVisible();

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('ControlOrMeta+z');
  await expect(filled).toBeVisible();
  await expect(page.getByRole('button', { name: 'Redo' })).toHaveAttribute('aria-disabled', 'true');
});

test('brings the draft back after a reload', async ({ page }) => {
  await addPhotos(page, ['red']);
  await placeWithKeyboard(page, 'qa red', 1);
  await page.getByRole('textbox', { name: 'Caption' }).fill('Sunday dinner');
  await page.getByRole('button', { name: 'Add spread' }).click();
  const header = page.getByRole('banner');
  await expect(header.getByRole('status')).toHaveText('Saving…');
  await expect(header.getByRole('status')).toHaveText('All changes saved on this device');

  await page.reload();
  await page.getByRole('button', { name: 'Open Family Recipes' }).click();

  await expect(page.getByText('3 spreads · 6 printed pages')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Caption' })).toHaveValue('Sunday dinner');
  // Stub uploads are blob: URLs, which do not survive a reload, so the photo comes back as missing.
  await expect(page.getByRole('button', { name: 'Slot 1: qa-red.png (missing)' })).toBeVisible();

  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('region', { name: 'Spread 1 of 3' }).getByRole('button', { name: 'Re-add photo qa-red.png' }).click();
  await (await chooser).setFiles(photoFile('qa-red.png'));
  await expect(page.getByRole('button', { name: 'Slot 1: qa red' })).toBeVisible();
});
