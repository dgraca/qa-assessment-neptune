import { test, expect } from '@playwright/test';

const TEST_NAME = 'playwright-test-qa';
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
 * Sets up table definition with dummy data to perform future tests on Table Browser
 * 
 * This test depends on auth/login and this test must be depended on by the Table Browser tests
 */
test('Setup table definition', async ({ page }) => {
    /*
     * Start from a known cockpit state. Neptune restores the last open artifact
     * asynchronously, so checking for either the list or an artifact here creates
     * a race. Closing the persisted tool first makes opening it deterministic.
     * AI assistance was used to help diagnose this race condition and make the
     * test flow deterministic.
     */
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

    const toolsSearch = page.getByRole('searchbox', {
        name: 'Search tools & artifacts (ALT or Option+S)',
    });

    await toolsSearch.fill('Table Definition');
    const toolsResults = page.getByRole('heading', {
        name: 'TOOLS',
        level: 2,
    }).locator('..');

    await toolsResults.getByText('Table Definition', { exact: true }).click();

    const tableDefinitionPage = page.getByRole('heading', {
        name: 'Table Definition',
        level: 1
    });

    await expect(tableDefinitionPage).toBeVisible();

    /**
     * Check if there's a table definition already created
     * 
     * Probably in a well set up environment with CI/CD the data is reset every time to avoid these type of checks.
     * But because I don't have a proper CI/CD set up and I think that would be overkill (and time consuming) I'm just going to check whether it exists, and if not, create it.
     */
    const tableSearch = page.getByRole('searchbox', {
        name: 'Search',
        exact: true,
    });

    await tableSearch.fill(TEST_NAME);

    const existingTableDefinition = page.getByRole('gridcell', {
        name: TEST_NAME,
        exact: true,
    });

    const tableDefinitionExists = await existingTableDefinition.count() > 0;

    if (tableDefinitionExists) {
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
    }).fill(TEST_NAME);

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

    await page.getByRole('toolbar', {
        name: 'Header actions',
    }).getByRole('button', {
        name: 'Save',
        exact: true,
    }).click();

    await expect(page.getByRole('tab', {
        name: `Properties (${TEST_PROPERTIES.length})`,
        exact: true,
    })).toBeVisible();
});
