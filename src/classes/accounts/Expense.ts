// Expense.ts

import Account from './Account.ts';
import type { IExpense } from '../../types/account.types.ts';
import { Money } from '../value-objects/Money.ts';
import { AccountType } from '../../Constants.ts';

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
     * @param {number | Money} initialBalance - The initial balance of the expense account. Defaults to 0.
     * @param {string} defaultCurrency - Default currency for number mode (default: 'CURR')
     */
    constructor(name: string, initialBalance: number | Money = 0, defaultCurrency: string = 'CURR') {
        // Expenses increase on debit, hence isDebitPositive is true
        super(name, initialBalance, true, defaultCurrency);
    }

    // Expense-specific methods can be added here if needed in the future
}

export default Expense;
