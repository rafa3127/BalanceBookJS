// Liability.ts

import Account from './Account';
import { ILiability } from '../../types/account.types';
import { AccountType } from '../../Constants';

/**
 * Class representing a liability account.
 * Liabilities increase on credit and decrease on debit.
 * @extends Account
 * @implements {ILiability}
 */
class Liability extends Account implements ILiability {
    /**
     * The account type identifier
     */
    public readonly type: 'LIABILITY' = AccountType.LIABILITY as 'LIABILITY';

    /**
     * Create a liability account.
     * @param {string} name - The name of the liability account.
     * @param {number} initialBalance - The initial balance of the liability account. Defaults to 0.
     */
    constructor(name: string, initialBalance: number = 0) {
        // Liabilities increase on credit, hence isDebitPositive is false
        super(name, initialBalance, false);
    }

    // Liability-specific methods can be added here if needed in the future
}

export default Liability;
