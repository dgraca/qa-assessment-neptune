import { test, expect } from '@playwright/test';
import {
    createExpenseRecord,
    enterEditMode,
    findExpenseRecordRow,
    openTable,
    openTableBrowser,
} from './helpers/table-browser';
import { createExpenseData, EXPENSE_TABLE_NAME } from './expense-record';

/**
 * Deletes a record and checks if it was indeed deleted
 * Uses helper methods to avoid redundant code
 */
test('Deletes a valid record', async ({ page }) => {
    const validExpense = createExpenseData({
        description: `Delete expense ${Date.now()}`,
    });

    await openTableBrowser(page);
    await openTable(page, EXPENSE_TABLE_NAME);
    await enterEditMode(page);

    // Creates a record that will be deleted from existence :)
    const { response: createResponse } = await createExpenseRecord(
        page,
        validExpense,
    );
    expect(createResponse.ok()).toBeTruthy();

    await openTableBrowser(page);
    await openTable(page, EXPENSE_TABLE_NAME, {
        field: 'description',
        value: validExpense.description,
    });
    await enterEditMode(page);

    // Selects the row using its associated SAP table row selector
    const row = findExpenseRecordRow(page, validExpense.description);
    await page.locator('.sapUiTableRowSelectionCell:visible').first().click();
    await expect(row).toHaveAttribute('aria-selected', 'true');

    const headerActions = page.getByRole('toolbar', {
        name: 'Header actions',
    });

    const deleteResponsePromise = page.waitForResponse(response =>
        response.request().method() !== 'GET',
    );

    await headerActions.getByRole('button', {
        name: 'Delete',
        exact: true,
    }).click();

    await headerActions.getByRole('button', {
        name: 'Save',
        exact: true,
    }).click();

    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.ok()).toBeTruthy();

    await openTableBrowser(page);
    await openTable(page, EXPENSE_TABLE_NAME, {
        field: 'description',
        value: validExpense.description,
    });

    // Asserts that the deleted record was indeed removed from existence :)
    await expect(page.getByRole('gridcell', {
        name: 'No data',
        exact: true,
    })).toBeVisible();
});
