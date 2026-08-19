import { expect, type Locator, type Page } from "@playwright/test";
import {
    EXPENSE_FIELD_LABELS,
    type ExpenseRecord,
} from "../expense-record";

/**
 * Helper function to open table browser
 * 
 * @param page 
 */
export async function openTableBrowser(page: Page) {
    await page.goto("/cockpit.html");

    await page
        .getByRole("button", {
            name: "Home",
            exact: true,
        })
        .click();

    const openTableBrowser = page
        .getByRole("complementary")
        .getByRole("listitem", { name: "Table Browser" });

    if (await openTableBrowser.isVisible()) {
        await openTableBrowser
            .getByRole("button", {
                name: "Delete",
                exact: true,
            })
            .click();

        await expect(openTableBrowser).toBeHidden();
    }

    await page
        .getByRole("searchbox", {
            name: "Search tools & artifacts (ALT or Option+S)",
        })
        .fill("Table Browser");

    const toolsResults = page
        .getByRole("heading", {
            name: "TOOLS",
            level: 2,
        })
        .locator("..");

    await toolsResults.getByText("Table Browser", { exact: true }).click();

    await expect(
        page.getByRole("heading", {
            name: "Table Browser",
            level: 1,
        }),
    ).toBeVisible();
}


/**
 * Helper function to open a determined table to perform actions on
 * 
 * @param page 
 * @param tableName 
 */
export async function openTable(
    page: Page,
    tableName: string,
    filter?: { field: string; value: string },
) {
    await page
        .getByRole("searchbox", {
            name: "Search",
            exact: true,
        })
        .fill(tableName);

    await page
        .getByRole("gridcell", {
            name: tableName,
            exact: true,
        })
        .dblclick();

    if (filter) {
        const filterRow = page.getByRole("row").filter({
            has: page.locator(`input[value="${filter.field}"]`),
        });

        await filterRow.getByRole("textbox").nth(2).fill(filter.value);
    }

    await page
        .getByRole("button", {
            name: "Run",
            exact: true,
        })
        .click();

    await expect(
        page.getByRole("heading", {
            name: tableName,
            level: 1,
        }),
    ).toBeVisible();
}


/**
 * Helper function to enter edit mode
 * 
 * @param page 
 */
export async function enterEditMode(page: Page) {
    await page
        .getByRole("button", {
            name: "Edit",
            exact: true,
        })
        .click();

    const recordLockedDialog = page.getByRole("dialog").filter({
        has: page.getByRole("heading", { name: "Record Locked" }),
    });
    const addButton = page.getByRole("button", {
        name: "Add",
        exact: true,
    });

    await addButton.or(recordLockedDialog).waitFor();

    if (await recordLockedDialog.isVisible()) {
        await recordLockedDialog
            .getByRole("button", {
                name: "Yes, it's me, unlock",
            })
            .click();
    }

    await expect(addButton).toBeVisible();
}


/**
 * Adds an empty record and returns its editable row.
 *
 * @param page
 */
export async function addRecordRow(page: Page) {
    await page
        .getByRole("button", {
            name: "Add",
            exact: true,
        })
        .click();

    return page.getByRole("row").filter({
        has: page.getByRole("textbox", {
            name: EXPENSE_FIELD_LABELS.description,
        }),
    }).first();
}


/**
 * Finds an expense row by its unique description.
 *
 * @param page
 * @param description
 */
export function findExpenseRecordRow(page: Page, description: string) {
    return page.getByRole("row").filter({
        has: page.locator(`input[value="${description}"]`),
    });
}


/**
 * Fills only the expense fields supplied by the test.
 * It can be used with a newly added row or an existing row being updated.
 *
 * @param row
 * @param expense
 */
export async function fillExpenseRecord(
    row: Locator,
    expense: Partial<ExpenseRecord>,
) {
    if (expense.description !== undefined) {
        const descriptionInput = row.getByRole("textbox", {
            name: EXPENSE_FIELD_LABELS.description,
        });
        await descriptionInput.fill(expense.description);
    }

    if (expense.amount !== undefined) {
        const amountInput = row.getByRole("textbox", {
            name: EXPENSE_FIELD_LABELS.amount,
        });
        await amountInput.fill(expense.amount);
    }

    if (expense.category !== undefined) {
        const categoryInput = row.getByRole("textbox", {
            name: EXPENSE_FIELD_LABELS.category,
        });
        await categoryInput.fill(expense.category);
    }

    if (expense.expenseDate !== undefined) {
        const expenseDateInput = row.getByRole("textbox", {
            name: EXPENSE_FIELD_LABELS.expenseDate,
        });
        await expenseDateInput.fill(expense.expenseDate);
    }

    if (expense.paid !== undefined) {
        const paidCheckbox = row.getByRole("checkbox", {
            name: EXPENSE_FIELD_LABELS.paid,
        });

        if (await paidCheckbox.isChecked() !== expense.paid) {
            await paidCheckbox.focus();
            await paidCheckbox.press("Space");
        }

        await expect(paidCheckbox).toBeChecked({
            checked: expense.paid,
        });
    }
}


/**
 * Creates an expense record and returns the UI row and save response.
 * Assertions about the result belong in the calling test.
 *
 * @param page
 * @param expense
 */
export async function createExpenseRecord(
    page: Page,
    expense: Partial<ExpenseRecord>,
) {
    const row = await addRecordRow(page);
    await fillExpenseRecord(row, expense);

    const saveResponsePromise = page.waitForResponse(response =>
        response.request().method() === "POST"
        && response.url().includes("/api/"),
    );

    await page
        .getByRole("button", {
            name: "Save",
            exact: true,
        })
        .click();

    const response = await saveResponsePromise;

    return { row, response };
}
