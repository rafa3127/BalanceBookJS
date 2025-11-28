// Liability.ts

import Account from './Account.ts';
import type { ILiability } from '../../types/account.types.ts';
import { Money } from '../value-objects/Money.ts';
import { AccountType } from '../../Constants.ts';

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
     * @param {number | Money} initialBalance - The initial balance of the liability account. Defaults to 0.
     * @param {string} defaultCurrency - Default currency for number mode (default: 'CURR')
     */
    constructor(name: string, initialBalance: number | Money = 0, defaultCurrency: string = 'CURR') {
        // Liabilities increase on credit, hence isDebitPositive is false
        super(name, initialBalance, false, defaultCurrency);
    }

    // Liability-specific methods can be added here if needed in the future
}

export default Liability;
