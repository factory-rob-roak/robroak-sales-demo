import { expect, test } from './fixtures';

// Expected prices come from the price list (base + extra pages + cover), not from the app.
const PROJECTS = [
  { title: 'Summer in Maine', meta: '11x8.5 Landscape · Hardcover · 24 pages', price: '$65.99' },
  { title: "Ava's First Year", meta: '8x8 Square · Lay-flat · 40 pages', price: '$79.99' },
  { title: 'Family Recipes', meta: '8.5x11 Portrait · Softcover · 20 pages', price: '$39.99' },
];

test.describe('project list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('lists every project with its format, cover, pages, and price', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Your photo books' })).toBeVisible();
    const projects = page.getByRole('region', { name: 'Projects' });
    await expect(projects.getByRole('article')).toHaveCount(PROJECTS.length);

    for (const { title, meta, price } of PROJECTS) {
      const card = projects.getByRole('article', { name: title });
      await expect(card.getByText(meta)).toBeVisible();
      await expect(card.getByText(price, { exact: true })).toBeVisible();
      await expect(card.getByRole('button', { name: `Open ${title}` })).toBeVisible();
    }
  });

  test('opens a project with the keyboard and returns to the list', async ({ page }) => {
    await page.getByRole('button', { name: 'Open Family Recipes' }).focus();
    await page.keyboard.press('Enter');

    const title = page.getByRole('heading', { level: 1, name: 'Family Recipes' });
    await expect(title).toBeFocused();
    for (const region of ['Photos (0)', 'Spread 1 of 2', 'Pages', 'Order summary', 'Book settings']) {
      await expect(page.getByRole('region', { name: region })).toBeVisible();
    }

    await page.getByRole('button', { name: 'Back to projects' }).press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Your photo books' })).toBeFocused();
    await expect(page.getByRole('region', { name: 'Projects' })).toBeVisible();
  });

  test('opens a project with the mouse', async ({ page }) => {
    await page.getByRole('button', { name: 'Open Summer in Maine' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Summer in Maine' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Size' })).toHaveValue('landscape-11');
    await expect(page.getByRole('combobox', { name: 'Cover' })).toHaveValue('hardcover');
  });
});
