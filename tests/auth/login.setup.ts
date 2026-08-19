import { test, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

/**
 * Logs into DXP and persists the session to be used with other tests
 */
test('Logs into DXP', async ({ page }) => {
	await page.goto('/');

	const loginHeading = page.getByRole('heading', {
		level: 1,
		name: 'Sign In',
	});

	await expect(loginHeading).toBeVisible();

	const password = process.env.ADMIN_PASSWORD;

	if (!password) {
		throw new Error('ADMIN_PASSWORD must be defined in .env');
	}

	await page.getByPlaceholder('username').fill('admin');
	await page.getByPlaceholder('password').fill(password);
	await page.getByRole('button', {
		name: 'Sign In'
	}).click();

	await expect(page).toHaveURL(
		url => url.pathname === '/cockpit.html',
	);

	await expect(
		page.getByText('Neptune DXP - Open Edition', { exact: true }),
	).toBeVisible();

	await page.context().storageState({ path: authFile });
});
