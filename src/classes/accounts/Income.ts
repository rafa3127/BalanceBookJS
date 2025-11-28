// Income.ts

import Account from './Account.ts';
import type { IIncome } from '../../types/account.types.ts';
import { Money } from '../value-objects/Money.ts';
import { AccountType } from '../../Constants.ts';

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
     * @param {number | Money} initialBalance - The initial balance of the income account. Defaults to 0.
     * @param {string} defaultCurrency - Default currency for number mode (default: 'CURR')
     */
    constructor(name: string, initialBalance: number | Money = 0, defaultCurrency: string = 'CURR') {
        // Income increases on credit, hence isDebitPositive is false
        super(name, initialBalance, false, defaultCurrency);
    }

    // Income-specific methods can be added here if needed in the future
}

export default Income;
