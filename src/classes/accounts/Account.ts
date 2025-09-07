// Account.ts

import { IAccountInternal } from '../../types/account.types';
import { ERROR_MESSAGES } from '../../Constants';

/**
 * Class representing a generic account.
 * @implements {IAccountInternal}
 */
class Account implements IAccountInternal {
    /**
     * The name of the account
     */
    public readonly name: string;
    
    /**
     * The current balance of the account
     */
    protected balance: number;
    
    /**
     * Determines if debits increase (true) or decrease (false) the balance
     */
    readonly isDebitPositive: boolean;

    /**
     * Create an account.
     * @param {string} name - The name of the account.
     * @param {number} initialBalance - The initial balance of the account.
     * @param {boolean} isDebitPositive - Determines if debits increase or decrease the balance.
     * @throws {Error} If initialBalance is negative
     */
    constructor(name: string, initialBalance: number = 0, isDebitPositive: boolean) {
        if (initialBalance < 0) {
            throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
        }
        
        this.name = name;
        this.balance = initialBalance;
        this.isDebitPositive = isDebitPositive;
    }

    /**
     * Debit an amount to the account.
     * @param {number} amount - The amount to debit.
     * @throws {Error} If amount is negative
     */
    public debit(amount: number): void {
        if (amount < 0) {
            throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
        }
        
        this.balance += this.isDebitPositive ? amount : -amount;
    }

    /**
     * Credit an amount to the account.
     * @param {number} amount - The amount to credit.
     * @throws {Error} If amount is negative
     */
    public credit(amount: number): void {
        if (amount < 0) {
            throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
        }
        
        this.balance += this.isDebitPositive ? -amount : amount;
    }

    /**
     * Get the current balance of the account.
     * @return {number} The current balance.
     */
    public getBalance(): number {
        return this.balance;
    }
}

export default Account;
