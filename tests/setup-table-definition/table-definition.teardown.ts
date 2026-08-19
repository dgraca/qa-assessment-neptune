import { test, expect } from '@playwright/test';
import { EXPENSE_TABLE_NAME } from '../table-browser/expense-record';
import {
    findTableDefinition,
    openTableDefinition,
} from './helpers/table-definition';

/**
 * Removes the table definition created for the Table Browser tests.
 */
test('Teardown table definition', async ({ page }) => {
    await openTableDefinition(page);

    const tableDefinition = await findTableDefinition(
        page,
        EXPENSE_TABLE_NAME,
    );

    if (await tableDefinition.count() === 0) {
        return;
    }

    await tableDefinition.dblclick();

    await expect(page.getByRole('heading', {
        name: EXPENSE_TABLE_NAME,
        level: 1,
    })).toBeVisible();

    const headerActions = page.getByRole('toolbar', {
        name: 'Header actions',
    });

    await headerActions.getByRole('button', {
        name: 'Edit',
        exact: true,
    }).click();

    const deleteButton = headerActions.getByRole('button', {
        name: 'Delete',
        exact: true,
    });
    const recordLockedDialog = page.getByRole('dialog').filter({
        has: page.getByRole('heading', { name: 'Record Locked' }),
    });

    await deleteButton.or(recordLockedDialog).waitFor();

    if (await recordLockedDialog.isVisible()) {
        await recordLockedDialog.getByRole('button', {
            name: "Yes, it's me, unlock",
        }).click();
    }

    await deleteButton.click();

    const confirmationDialog = page.getByRole('dialog');
    await confirmationDialog.getByRole('button', {
        name: 'Yes, delete!',
        exact: true,
    }).click();

    await findTableDefinition(page, EXPENSE_TABLE_NAME);

    await expect(tableDefinition).toHaveCount(0);
});
