// Asset.ts

import Account from './Account';
import { IAsset } from '../../types/account.types';
import { AccountType } from '../../Constants';

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
     * @param {number} initialBalance - The initial balance of the asset account. Defaults to 0.
     */
    constructor(name: string, initialBalance: number = 0) {
        // Assets increase on debit, hence isDebitPositive is true
        super(name, initialBalance, true);
    }

    // Asset-specific methods can be added here if needed in the future
}

export default Asset;
