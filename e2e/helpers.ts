import type { Page } from '@playwright/test';
import { expect } from './fixtures';

// A valid 1x1 PNG. The upload stub only checks the file type and size.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

export function photoFile(name: string) {
  return { name, mimeType: 'image/png', buffer: PNG_1X1 };
}

export async function openProject(page: Page, title: string): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: `Open ${title}` }).click();
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeFocused();
}

export function trayPhoto(page: Page, description: string) {
  return page.getByRole('list', { name: 'Photo library' }).getByRole('button', { name: description, exact: true });
}

/** Uploads `qa-<name>.png` for each name; the editor describes each one as "qa <name>". */
export async function addPhotos(page: Page, names: readonly string[]): Promise<void> {
  await page.getByLabel('Add photos').setInputFiles(names.map((name) => photoFile(`qa-${name}.png`)));
  for (const name of names) await expect(trayPhoto(page, `qa ${name}`)).toBeVisible();
}

/** Selects a tray photo and then a slot, both with the Enter key. */
export async function placeWithKeyboard(page: Page, description: string, slot: number): Promise<void> {
  await trayPhoto(page, description).press('Enter');
  await page.getByRole('button', { name: `Place ${description} in slot ${slot}` }).press('Enter');
  await expect(page.getByRole('button', { name: `Slot ${slot}: ${description}` })).toBeVisible();
}

export async function chooseLayout(page: Page, label: string): Promise<void> {
  await page.getByRole('radio', { name: label }).check();
}

export async function addSpreads(page: Page, count: number): Promise<void> {
  const addSpread = page.getByRole('button', { name: 'Add spread' });
  for (let i = 0; i < count; i += 1) await addSpread.click();
}
