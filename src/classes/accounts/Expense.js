import Account from "./Account.js";

/**
 * Class representing an expense account.
 * Inherits from Account.
 */
class Expense extends Account {
    /**
     * Create an expense account.
     * @param {string} name - The name of the expense account.
     * @param {number} initialBalance - The initial balance of the expense account, often starts at 0.
     */
    constructor(name, initialBalance = 0) {
        super(name, initialBalance, true); // Expenses increase on debit, hence isDebitPositive is true
    }

    // Additional methods specific to Expense accounts can be added here if needed in the future
}

export default Expense