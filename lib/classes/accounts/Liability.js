// En tu archivo src/classes/Liability.js

import Account from "./Account.js";


/**
 * Class representing a liability account.
 * Inherits from Account.
 */
class Liability extends Account {
    /**
     * Create a liability account.
     * @param {string} name - The name of the liability account.
     * @param {number} initialBalance - The initial balance of the liability account.
     */
    constructor(name, initialBalance) {
        super(name, initialBalance, false); // Liabilities increase on credit, hence isDebitPositive is false
    }

    // Additional methods specific to Liability accounts can be added here if needed in the future
}

export default Liability
