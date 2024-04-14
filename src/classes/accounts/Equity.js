import Account from "./Account.js";

/**
 * Class representing an equity account.
 * Inherits from Account.
 */
class Equity extends Account {
    /**
     * Create an equity account.
     * @param {string} name - The name of the equity account.
     * @param {number} initialBalance - The initial balance of the equity account.
     */
    constructor(name, initialBalance) {
        super(name, initialBalance, false); // Equity increases on credit, hence isDebitPositive is false
    }

    // Additional methods specific to Equity accounts can be added here if needed in the future
}

export default Equity