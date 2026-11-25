import { expect, test as base } from '@playwright/test';

/**
 * Every test runs offline: the app only talks to its own origin, and uploads
 * go through the app's in-memory PhotoUploadClient stub. The fixture also
 * fails a test on browser dialogs (the app must never use alert or confirm)
 * and on uncaught page errors.
 */
export const test = base.extend({
  page: async ({ page, baseURL }, provide) => {
    const appOrigin = new URL(baseURL ?? 'http://127.0.0.1').origin;
    const blockedRequests: string[] = [];
    const dialogs: string[] = [];
    const pageErrors: string[] = [];

    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (new URL(url).origin === appOrigin) return route.continue();
      blockedRequests.push(url);
      return route.abort('blockedbyclient');
    });
    page.on('dialog', (dialog) => {
      dialogs.push(`${dialog.type()}: ${dialog.message()}`);
      void dialog.dismiss();
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await provide(page);

    expect(blockedRequests, 'requests outside the app origin').toEqual([]);
    expect(dialogs, 'browser dialogs').toEqual([]);
    expect(pageErrors, 'uncaught page errors').toEqual([]);
  },
});

export { expect };
