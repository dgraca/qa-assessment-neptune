import { test, expect } from '@playwright/test';
import {
    createExpenseRecord,
    enterEditMode,
    findExpenseRecordRow,
    fillExpenseRecord,
    openTable,
    openTableBrowser,
} from './helpers/table-browser';
import {
    createExpenseData,
    EXPENSE_FIELD_LABELS,
    EXPENSE_TABLE_NAME,
} from './expense-record';

/**
 * Updates a valid record
 * Uses helper methods to avoid redundant code
 */
test('Updates a valid record', async ({ page }) => {
    const validExpense = createExpenseData({
        description: `Valid update expense ${Date.now()}`,
    });
    const updatedExpense = {
        amount: '75.25',
        category: 'Updated automation',
    };

    await openTableBrowser(page);
    await openTable(page, EXPENSE_TABLE_NAME);
    await enterEditMode(page);

    // Creates a record that will be used to be updated
    const { response: createResponse } = await createExpenseRecord(page, validExpense);
    expect(createResponse.ok()).toBeTruthy();

    // Reopens the persisted record before updating it
    await openTableBrowser(page);
    await openTable(page, EXPENSE_TABLE_NAME, {
        field: 'description',
        value: validExpense.description,
    });
    await enterEditMode(page);

    const row = findExpenseRecordRow(page, validExpense.description);
    await fillExpenseRecord(row, updatedExpense);

    const updateResponsePromise = page.waitForResponse(response =>
        response.request().method() === 'POST'
        && response.url().includes('/api/'),
    );

    await page.getByRole('button', {
        name: 'Save',
        exact: true,
    }).click();

    const updateResponse = await updateResponsePromise;
    expect(updateResponse.ok()).toBeTruthy();

    // Reopens the table to assert that the updated data was persisted.
    // Instead of clicking on close button and checking directly, I use the automated helpers already created to get on that table.
    await openTableBrowser(page);
    await openTable(page, EXPENSE_TABLE_NAME, {
        field: 'description',
        value: validExpense.description,
    });

    const persistedRow = findExpenseRecordRow(page, validExpense.description);

    await expect(persistedRow.getByRole('textbox', {
        name: EXPENSE_FIELD_LABELS.amount,
    })).toHaveValue(updatedExpense.amount);
    await expect(persistedRow.getByRole('textbox', {
        name: EXPENSE_FIELD_LABELS.category,
    })).toHaveValue(updatedExpense.category);
});
