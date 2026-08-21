import { expect, type Page } from '@playwright/test';

/**
 * Opens the Cockpit and waits until its loading overlay no longer blocks input.
 */
export async function openCockpitHome(page: Page) {
    await page.goto('/cockpit.html');

    await expect(page.locator('.pg-loading-screen.pg-loading')).toBeHidden();

    await page.getByRole('button', {
        name: 'Home',
        exact: true,
    }).click();
}
