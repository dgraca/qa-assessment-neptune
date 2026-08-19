import { expect, type Page } from '@playwright/test';

/**
 * Opens table definition from /cockpit
 */
export async function openTableDefinition(page: Page) {
    await page.goto('/cockpit.html');

    await page.getByRole('button', {
        name: 'Home',
        exact: true,
    }).click();

    const openTableDefinition = page
        .getByRole('complementary')
        .getByRole('listitem', { name: 'Table Definition' });

    if (await openTableDefinition.isVisible()) {
        await openTableDefinition.getByRole('button', {
            name: 'Delete',
            exact: true,
        }).click();

        await expect(openTableDefinition).toBeHidden();
    }

    await page.getByRole('searchbox', {
        name: 'Search tools & artifacts (ALT or Option+S)',
    }).fill('Table Definition');

    const toolsResults = page.getByRole('heading', {
        name: 'TOOLS',
        level: 2,
    }).locator('..');

    await toolsResults.getByText('Table Definition', { exact: true }).click();

    await expect(page.getByRole('heading', {
        name: 'Table Definition',
        level: 1,
    })).toBeVisible();
}

/**
 * Searches for a table definition and returns its result cell.
 */
export async function findTableDefinition(page: Page, tableName: string) {
    await page.getByRole('searchbox', {
        name: 'Search',
        exact: true,
    }).fill(tableName);

    return page.getByRole('gridcell', {
        name: tableName,
        exact: true,
    });
}
