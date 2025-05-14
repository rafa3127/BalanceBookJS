// Account.js

/**
 * Class representing a generic account.
 */
class Account {
    /**
     * Create an account.
     * @param {string} name - The name of the account.
     * @param {number} initialBalance - The initial balance of the account.
     * @param {boolean} isDebitPositive - Determines if debits increase or decrease the balance.
     */
    constructor(name, initialBalance, isDebitPositive) {
        this.name = name;
        this.balance = initialBalance;
        this.isDebitPositive = isDebitPositive;
    }

    /**
     * Debit an amount to the account.
     * @param {number} amount - The amount to debit.
     */
    debit(amount) {
        this.balance += this.isDebitPositive ? amount : -amount;
    }

    /**
     * Credit an amount to the account.
     * @param {number} amount - The amount to credit.
     */
    credit(amount) {
        this.balance += this.isDebitPositive ? -amount : amount;
    }

    /**
     * Get the current balance of the account.
     * @return {number} The current balance.
     */
    getBalance() {
        return this.balance;
    }
}

export default Account