import { expect, test } from './fixtures';
import { addSpreads, openProject, photoFile } from './helpers';

// Family Recipes is 8.5x11 Portrait: $39.99 for 20 pages, $1.25 per extra page, hardcover +$15.00.
test.beforeEach(async ({ page }) => {
  await openProject(page, 'Family Recipes');
});

test('blocks ordering below the 20-page minimum', async ({ page }) => {
  const summary = page.getByRole('region', { name: 'Order summary' });
  await expect(summary).toContainText('4 pages · 8.5x11 Portrait · Softcover');
  await expect(summary).toContainText('Books start at $39.99 for 20 pages.');
  await expect(summary).toContainText('Add 16 more pages to reach the 20-page minimum.');

  await summary.getByRole('button', { name: 'Order book' }).click();
  await expect(summary.getByRole('alert')).toHaveText(
    "You can't order yet. Add 16 more pages to reach the 20-page minimum.",
  );
  await expect(summary.getByRole('status')).toBeEmpty();
});

test('hides and shows the price', async ({ page }) => {
  const summary = page.getByRole('region', { name: 'Order summary' });
  const toggle = summary.getByRole('button', { name: /^(Hide|Show) price$/ });
  await expect(toggle).toHaveText('Hide price');
  await toggle.click();

  await expect(toggle).toHaveText('Show price');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(summary.getByRole('group', { name: 'Price details' })).toBeHidden();
  await expect(summary).toContainText('4 pages · 8.5x11 Portrait · Softcover');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(summary.getByRole('group', { name: 'Price details' })).toContainText('Books start at $39.99');
});

test('updates the price as spreads and the cover change', async ({ page }) => {
  const price = page.getByRole('group', { name: 'Price details' });
  await addSpreads(page, 8);
  await expect(page.getByText('10 spreads · 20 printed pages')).toBeVisible();
  await expect(price).toContainText(/Total\s*\$39\.99/);
  await expect(price).toContainText(/Book with 20 pages\s*\$39\.99/);

  await addSpreads(page, 1);
  await expect(price).toContainText(/Total\s*\$42\.49/);
  await expect(price).toContainText(/2 extra pages\s*\+\$2\.50/);

  await page.getByRole('combobox', { name: 'Cover' }).selectOption({ label: 'Hardcover' });
  await expect(price).toContainText(/Hardcover upgrade\s*\+\$15\.00/);
  await expect(price).toContainText(/Total\s*\$57\.49/);

  await page.getByRole('button', { name: 'Delete spread 11' }).click();
  await expect(price).toContainText(/Total\s*\$54\.99/);
});

test('warns about empty spreads before ordering', async ({ page }) => {
  const summary = page.getByRole('region', { name: 'Order summary' });
  const order = summary.getByRole('button', { name: 'Order book' });
  await addSpreads(page, 8);

  await order.click();
  const warning = summary.getByRole('alert');
  await expect(warning).toContainText('10 spreads have no photos and will print blank.');
  await warning.getByRole('button', { name: 'Keep editing' }).press('Enter');
  await expect(warning).toBeHidden();
  await expect(order).toBeFocused();

  await order.click();
  await summary.getByRole('button', { name: 'Order anyway' }).click();
  await expect(order).toBeFocused();
  await expect(summary.getByRole('status')).toHaveText(
    'Ready to order: 20 pages · 8.5x11 Portrait · Softcover · $39.99',
  );
});

test('is ready to order straight away when every spread has a photo', async ({ page }) => {
  await addSpreads(page, 8);
  // Spread 2 uses "Two up", so 10 spreads need 11 photos.
  const files = Array.from({ length: 11 }, (_, i) => photoFile(`qa-${i + 1}.png`));
  await page.getByLabel('Add photos').setInputFiles(files);
  await expect(page.getByRole('heading', { name: 'Photos (11)' })).toBeVisible();
  await page.getByRole('button', { name: 'Auto-fill empty slots' }).click();

  const summary = page.getByRole('region', { name: 'Order summary' });
  await summary.getByRole('button', { name: 'Order book' }).click();
  await expect(summary.getByRole('alert')).toHaveCount(0);
  await expect(summary.getByRole('status')).toHaveText(
    'Ready to order: 20 pages · 8.5x11 Portrait · Softcover · $39.99',
  );
});
