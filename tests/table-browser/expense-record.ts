export const EXPENSE_TABLE_NAME = 'playwright-test-qa';

export type ExpenseRecord = {
    description: string;
    amount: string;
    category: string;
    expenseDate: string;
    paid: boolean;
};

export const EXPENSE_FIELD_LABELS = {
    description: 'description Info Label',
    amount: 'amount Info Label',
    category: 'category Info Label',
    expenseDate: 'expenseDate Info Label',
    paid: 'paid Info Label',
} as const;

/**
 * Works like a factory with default data, which can be overwriten by @param overrides
 * 
 * @param overrides 
 * @returns 
 */
export function createExpenseData(
    overrides: Partial<ExpenseRecord> = {},
): ExpenseRecord {
    return {
        description: `Playwright expense ${Date.now()}-${Math.random().toString(36).slice(2)}`,
        amount: '42.50',
        category: 'Automation',
        expenseDate: 'Aug 19, 2026, 10:00',
        paid: true,
        ...overrides,
    };
}
