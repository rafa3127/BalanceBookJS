// Asset.ts

import Account from './Account.js';
import type { IAsset } from '../../types/account.types.js';
import { Money } from '../value-objects/Money.js';
import { AccountType } from '../../Constants.js';

/**
 * Class representing an asset account.
 * Assets increase on debit and decrease on credit.
 * @extends Account
 * @implements {IAsset}
 */
class Asset extends Account implements IAsset {
    /**
     * The account type identifier
     */
    public readonly type: 'ASSET' = AccountType.ASSET as 'ASSET';

    /**
     * Create an asset account.
     * @param {string} name - The name of the asset account.
     * @param {number | Money} initialBalance - The initial balance of the asset account. Defaults to 0.
     * @param {string} defaultCurrency - Default currency for number mode (default: 'CURR')
     */
    constructor(name: string, initialBalance: number | Money = 0, defaultCurrency: string = 'CURR') {
        // Assets increase on debit, hence isDebitPositive is true
        super(name, initialBalance, true, defaultCurrency);
    }

    // Asset-specific methods can be added here if needed in the future
}

export default Asset;
