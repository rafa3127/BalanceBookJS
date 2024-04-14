import Account from "./Account.js";

/**
 * Class representing an income account.
 * Inherits from Account.
 */
class Income extends Account {
    /**
     * Create an income account.
     * @param {string} name - The name of the income account.
     * @param {number} initialBalance - The initial balance of the income account, often starts at 0.
     */
    constructor(name, initialBalance = 0) {
        super(name, initialBalance, false); // Income increases on credit, hence isDebitPositive is false
    }

    // Additional methods specific to Income accounts can be added here if needed in the future
}

export default Income