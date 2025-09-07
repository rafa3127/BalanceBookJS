// Equity.ts

import Account from './Account';
import { IEquity } from '../../types/account.types';
import { AccountType } from '../../Constants';

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
     * @param {number} initialBalance - The initial balance of the equity account. Defaults to 0.
     */
    constructor(name: string, initialBalance: number = 0) {
        // Equity increases on credit, hence isDebitPositive is false
        super(name, initialBalance, false);
    }

    // Equity-specific methods can be added here if needed in the future
}

export default Equity;
