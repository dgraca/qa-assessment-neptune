import { test, expect } from '@playwright/test';
import {
    createExpenseRecord,
    enterEditMode,
    findExpenseRecordRow,
    openTable,
    openTableBrowser,
} from './helpers/table-browser';
import { createExpenseData, EXPENSE_FIELD_LABELS, EXPENSE_TABLE_NAME } from './expense-record';

/**
 * Reads a valid record and checks that its data was persisted
 * Uses helper methods to avoid redundant code
 */
test('Reads a valid record', async ({ page }) => {
    const validExpense = createExpenseData({
        description: `Read expense ${Date.now()}`,
    });
    const expectedAmount = String(Number(validExpense.amount));
    const expectedExpenseDate = new Date(
        `${validExpense.expenseDate} UTC`,
    ).toISOString();

    await openTableBrowser(page);
    await openTable(page, EXPENSE_TABLE_NAME);
    await enterEditMode(page);

    // Creates a record that will be used to be listed/read
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

    const persistedRow = findExpenseRecordRow(page, validExpense.description);

    await expect(persistedRow.getByRole('textbox', {
        name: EXPENSE_FIELD_LABELS.description,
    })).toHaveValue(validExpense.description);
    await expect(persistedRow.getByRole('textbox', {
        name: EXPENSE_FIELD_LABELS.amount,
    })).toHaveValue(expectedAmount);
    await expect(persistedRow.getByRole('textbox', {
        name: EXPENSE_FIELD_LABELS.category,
    })).toHaveValue(validExpense.category);
    await expect(persistedRow.getByRole('textbox', {
        name: EXPENSE_FIELD_LABELS.expenseDate,
    })).toHaveValue(expectedExpenseDate);
    await expect(persistedRow.getByRole('checkbox', {
        name: EXPENSE_FIELD_LABELS.paid,
    })).toBeChecked();
});


/**
 * Tries to read a record that does not exist
 * Uses helper methods to avoid redundant code
 */
test('Reads a non-existing record', async ({ page }) => {
    const nonExistingDescription = `Non-existing expense ${Date.now()}`;

    await openTableBrowser(page);
    await openTable(page, EXPENSE_TABLE_NAME, {
        field: 'description',
        value: nonExistingDescription,
    });

    // Asserts that the query didn't return any records
    await expect(page.getByRole('gridcell', {
        name: 'No data',
        exact: true,
    })).toBeVisible();
});
