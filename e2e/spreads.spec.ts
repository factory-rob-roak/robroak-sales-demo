import { expect, test } from './fixtures';
import { openProject } from './helpers';

test.beforeEach(async ({ page }) => {
  await openProject(page, 'Family Recipes');
});

test('adds a spread and makes it the current one', async ({ page }) => {
  await page.getByRole('button', { name: 'Add spread' }).click();
  await expect(page.getByText('3 spreads · 6 printed pages')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Spread 3 of 3' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spread 3, pages 5–6' })).toHaveAttribute('aria-current', 'true');
});

test('reorders spreads with the move buttons and keeps focus on the moved spread', async ({ page }) => {
  const caption = page.getByRole('textbox', { name: 'Caption' });
  await caption.fill('Starters');
  await expect(page.getByRole('button', { name: 'Move spread 1 up' })).toHaveAttribute('aria-disabled', 'true');

  await page.getByRole('button', { name: 'Move spread 1 down' }).press('Enter');
  await expect(page.getByRole('button', { name: 'Move spread 2 down' })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Spread 2 of 2' })).toBeVisible();
  await expect(caption).toHaveValue('Starters');

  await page.getByRole('button', { name: 'Move spread 2 up' }).press('Enter');
  await expect(page.getByRole('heading', { name: 'Spread 1 of 2' })).toBeVisible();
  await expect(caption).toHaveValue('Starters');
});

test('deletes a spread and brings it back with the undo offer', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Caption' }).fill('Starters');
  const pages = page.getByRole('region', { name: 'Pages' });

  await pages.getByRole('button', { name: 'Delete spread 1' }).press('Enter');
  await expect(pages.getByText('1 spread · 2 printed pages')).toBeVisible();
  await expect(pages.getByRole('status')).toContainText('Spread 1 deleted.');
  const undo = pages.getByRole('button', { name: 'Undo' });
  await expect(undo).toBeFocused();
  // The last spread cannot be deleted.
  await expect(pages.getByRole('button', { name: 'Delete spread 1' })).toHaveAttribute('aria-disabled', 'true');

  await undo.press('Enter');
  await expect(pages.getByText('2 spreads · 4 printed pages')).toBeVisible();
  const restored = pages.getByRole('button', { name: 'Spread 1, pages 1–2' });
  await expect(restored).toBeFocused();
  await restored.press('Enter');
  await expect(page.getByRole('textbox', { name: 'Caption' })).toHaveValue('Starters');
});
