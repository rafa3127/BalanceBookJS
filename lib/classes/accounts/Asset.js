// En tu archivo src/classes/Asset.js

import Account from "./Account.js";

/**
 * Class representing an asset account.
 * Inherits from Account.
 */
class Asset extends Account {
    /**
     * Create an asset account.
     * @param {string} name - The name of the asset account.
     * @param {number} initialBalance - The initial balance of the asset account.
     */
    constructor(name, initialBalance) {
        super(name, initialBalance, true); // Assets increase on debit, hence isDebitPositive is true
    }

    // Here you can add any methods specific to Asset accounts if needed in the future
}

export default Asset

