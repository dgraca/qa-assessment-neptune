import { test, expect } from '@playwright/test';
import {
    createExpenseRecord,
    enterEditMode,
    openTable,
    openTableBrowser,
} from './helpers/table-browser';
import {
    createExpenseData,
    EXPENSE_FIELD_LABELS,
    EXPENSE_TABLE_NAME,
} from './expense-record';

/**
 * Tries to create an invalid record (i.e.: tries to save a record with a mandatory field as empty/nullable)
 * Uses helper methods to avoid redundant code
 */
test('Create an invalid record', async ({ page }) => {
    const validExpense = createExpenseData({
        description: `Invalid expense ${Date.now()}`,
    });

    // Remove the category which is a mandatory field/column
    const { category: _category, ...invalidExpense } = validExpense;

    await openTableBrowser(page);
    await openTable(page, EXPENSE_TABLE_NAME);
    await enterEditMode(page);

    await createExpenseRecord(page, invalidExpense);

    const errorDialog = page.getByRole('alertdialog', {
        name: `NOT NULL constraint failed: entityset_${EXPENSE_TABLE_NAME}.category`,
    });

    await expect(errorDialog).toBeVisible();
    await errorDialog.getByRole('button', { name: 'Close' }).click();
    await page.getByRole('button', {
        name: 'Display',
        exact: true,
    }).click();

    const discardDialog = page.getByRole('dialog').filter({
        has: page.getByRole('heading', { name: 'Data changed' }),
    });

    await expect(discardDialog).toBeVisible();
    await discardDialog.getByRole('button', {
        name: 'Yes, continue!',
    }).click();

    // Asserts that the data wasn't saved
    await expect(page.locator(
        `input[value="${invalidExpense.description}"]`,
    )).toHaveCount(0);
});


/**
 * Creates a valid record
 * Uses helper methods to avoid redundant code
 */
test('Creates a valid record', async ({ page }) => {
    const validExpense = createExpenseData();

    await openTableBrowser(page);
    await openTable(page, EXPENSE_TABLE_NAME);
    await enterEditMode(page);

    const { row, response } = await createExpenseRecord(page, validExpense);
    expect(response.ok()).toBeTruthy();

    // Asserts that the data was saved
    await expect(row.getByRole('textbox', {
        name: EXPENSE_FIELD_LABELS.description,
    })).toHaveValue(validExpense.description);
});
