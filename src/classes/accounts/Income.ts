// Income.ts

import Account from './Account';
import { IIncome } from '../../types/account.types';
import { AccountType } from '../../Constants';

/**
 * Class representing an income account.
 * Income increases on credit and decreases on debit.
 * @extends Account
 * @implements {IIncome}
 */
class Income extends Account implements IIncome {
    /**
     * The account type identifier
     */
    public readonly type: 'INCOME' = AccountType.INCOME as 'INCOME';

    /**
     * Create an income account.
     * @param {string} name - The name of the income account.
     * @param {number} initialBalance - The initial balance of the income account. Defaults to 0.
     */
    constructor(name: string, initialBalance: number = 0) {
        // Income increases on credit, hence isDebitPositive is false
        super(name, initialBalance, false);
    }

    // Income-specific methods can be added here if needed in the future
}

export default Income;
