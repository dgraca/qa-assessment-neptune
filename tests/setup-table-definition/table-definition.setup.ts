import { test, expect, type Page } from '@playwright/test';
import { EXPENSE_TABLE_NAME } from '../table-browser/expense-record';
import {
    findTableDefinition,
    openTableDefinition,
} from './helpers/table-definition';

const TEST_PROPERTIES = [
    {
        name: 'description',
        description: 'Expense description',
        type: 'Text',
    },
    {
        name: 'amount',
        description: 'Expense amount',
        type: 'Decimal',
        precision: 12,
        scale: 2,
    },
    {
        name: 'category',
        description: 'Expense category',
        type: 'Text',
    },
    {
        name: 'expenseDate',
        description: 'Date and time of the expense',
        type: 'Timestamp with Time Zone',
    },
    {
        name: 'paid',
        description: 'Whether the expense has been paid',
        type: 'Boolean',
    },
] as const;

/**
 * Waits until Neptune exposes the saved definition through its entity API.
 */
async function waitForTableEntitySchema(page: Page) {
    await expect.poll(async () => {
        const response = await page.request.get(
            `/api/entity/${EXPENSE_TABLE_NAME}`,
            {
                params: {
                    take: '1',
                    select: 'description',
                    where: '{}',
                },
            },
        );

        if (!response.ok()) {
            return false;
        }

        const responseBody = await response.text();
        return !responseBody.includes('Property "description" was not found');
    }, {
        message: 'Wait for the Table Browser entity schema to become available',
        timeout: 60_000,
        intervals: [500, 1_000, 2_000],
    }).toBeTruthy();
}

/**
 * Sets up table definition with dummy data to perform future tests on Table Browser
 * 
 * This test depends on auth/login and this test must be depended on by the Table Browser tests
 */
test('Setup table definition', async ({ page }) => {
    test.setTimeout(90_000);

    /*
     * Start from a known cockpit state. Neptune restores the last open artifact
     * asynchronously, so checking for either the list or an artifact here creates
     * a race. Closing the persisted tool first makes opening it deterministic.
     * AI assistance was used to help diagnose this race condition and make the
     * test flow deterministic.
     */
    await openTableDefinition(page);

    /**
     * Check if there's a table definition already created
     * 
     * Probably in a well set up environment with CI/CD the data is reset every time to avoid these type of checks.
     * But because I don't have a proper CI/CD set up and I think that would be overkill (and time consuming) I'm just going to check whether it exists, and if not, create it.
     */
    const existingTableDefinition = await findTableDefinition(
        page,
        EXPENSE_TABLE_NAME,
    );

    const tableDefinitionExists = await existingTableDefinition.count() > 0;

    if (tableDefinitionExists) {
        await waitForTableEntitySchema(page);
        return;
    }

    await page.getByRole('toolbar', {
        name: 'Header actions',
    }).getByRole('button', {
        name: 'Create',
        exact: true,
    }).click();

    const createDefinitionDialog = page.getByRole('dialog');

    await createDefinitionDialog.getByRole('textbox', {
        name: 'Name',
        exact: true,
    }).fill(EXPENSE_TABLE_NAME);

    await createDefinitionDialog.getByRole('button', {
        name: 'Create',
        exact: true,
    }).click();

    await page.getByRole('tab', { name: 'Properties' }).click();

    const propertiesPanel = page.getByRole('tabpanel', {
        name: 'Properties',
    });

    for (const property of TEST_PROPERTIES) {
        await propertiesPanel.getByRole('button', {
            name: 'Add',
            exact: true,
        }).click();

        const propertyRow = propertiesPanel.getByRole('row').last();

        await propertyRow.getByRole('textbox', {
            name: 'Name',
            exact: true,
        }).fill(property.name);
        await propertyRow.getByRole('textbox', {
            name: 'Description',
            exact: true,
        }).fill(property.description);

        await propertyRow.getByRole('combobox', {
            name: 'Type',
            exact: true,
        }).locator('..').click();
        await page.getByRole('dialog', {
            name: 'Available Values',
        }).last().getByRole('option', {
            name: property.type,
            exact: true,
        }).click();

        if ('precision' in property) {
            await propertyRow.getByRole('spinbutton', {
                name: 'Precision',
            }).fill(String(property.precision));
            await propertyRow.getByRole('spinbutton', {
                name: 'Scale',
            }).fill(String(property.scale));
        }
    }

    const saveResponsePromise = page.waitForResponse(response =>
        response.request().method() === 'POST'
        && response.url().includes('/api/'),
    );

    await page.getByRole('toolbar', {
        name: 'Header actions',
    }).getByRole('button', {
        name: 'Save',
        exact: true,
    }).click();

    const saveResponse = await saveResponsePromise;
    expect(saveResponse.ok()).toBeTruthy();

    await expect(page.getByRole('tab', {
        name: `Properties (${TEST_PROPERTIES.length})`,
        exact: true,
    })).toBeVisible();

    // Neptune acknowledges the definition before its entity schema is always
    // available to Table Browser. Do not release dependent CRUD tests until the
    // real entity endpoint recognises the expected schema.
    await waitForTableEntitySchema(page);
});
