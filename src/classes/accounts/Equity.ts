// Equity.ts

import Account from './Account.ts';
import type { IEquity } from '../../types/account.types.ts';
import { Money } from '../value-objects/Money.ts';
import { AccountType } from '../../Constants.ts';

/**
 * Class representing an equity account.
 * Equity increases on credit and decreases on debit.
 * @extends Account
 * @implements {IEquity}
 */
class Equity extends Account implements IEquity {
    /**
     * The account type identifier
     */
    public readonly type: 'EQUITY' = AccountType.EQUITY as 'EQUITY';

    /**
     * Create an equity account.
     * @param {string} name - The name of the equity account.
     * @param {number | Money} initialBalance - The initial balance of the equity account. Defaults to 0.
     * @param {string} defaultCurrency - Default currency for number mode (default: 'CURR')
     */
    constructor(name: string, initialBalance: number | Money = 0, defaultCurrency: string = 'CURR') {
        // Equity increases on credit, hence isDebitPositive is false
        super(name, initialBalance, false, defaultCurrency);
    }

    // Equity-specific methods can be added here if needed in the future
}

export default Equity;
