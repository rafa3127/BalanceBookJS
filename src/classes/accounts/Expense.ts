// Expense.ts

import Account from './Account';
import { IExpense } from '../../types/account.types';
import { AccountType } from '../../Constants';

/**
 * Class representing an expense account.
 * Expenses increase on debit and decrease on credit.
 * @extends Account
 * @implements {IExpense}
 */
class Expense extends Account implements IExpense {
    /**
     * The account type identifier
     */
    public readonly type: 'EXPENSE' = AccountType.EXPENSE as 'EXPENSE';

    /**
     * Create an expense account.
     * @param {string} name - The name of the expense account.
     * @param {number} initialBalance - The initial balance of the expense account. Defaults to 0.
     */
    constructor(name: string, initialBalance: number = 0) {
        // Expenses increase on debit, hence isDebitPositive is true
        super(name, initialBalance, true);
    }

    // Expense-specific methods can be added here if needed in the future
}

export default Expense;
