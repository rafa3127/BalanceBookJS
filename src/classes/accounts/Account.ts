import { ISerializable } from '../../types/serialization';
import { IAccountInternal } from '../../types/account.types.js';
import { Money } from '../value-objects/Money.js';
import { ERROR_MESSAGES } from '../../Constants.js';

/**
 * Class representing a generic account with Money integration.
 * Implements transparent mode - returns the same type as initialized.
 * @implements {IAccountInternal}
 */
class Account implements IAccountInternal, ISerializable {
    /**
     * The name of the account
     */
    public readonly name: string;

    /**
     * Internal balance stored as Money for precision
     */
    protected balanceMoney: Money;

    /**
     * Mode tracking - was initialized with number or Money
     */
    protected readonly initialMode: 'number' | 'money';

    /**
     * Determines if debits increase (true) or decrease (false) the balance
     */
    readonly isDebitPositive: boolean;

    /**
     * Create an account.
     * @param {string} name - The name of the account.
     * @param {number | Money} initialBalance - The initial balance of the account.
     * @param {boolean} isDebitPositive - Determines if debits increase or decrease the balance.
     * @param {string} defaultCurrency - Default currency for number mode (default: 'CURR')
     * @throws {Error} If initialBalance is negative
     */
    constructor(
        name: string,
        initialBalance: number | Money = 0,
        isDebitPositive: boolean,
        defaultCurrency: string = 'CURR'
    ) {
        // Validate name
        if (!name || name.trim().length === 0) {
            throw new Error('Account name cannot be empty');
        }

        this.name = name;
        this.isDebitPositive = isDebitPositive;

        // Detect initialization mode and setup balance
        if (Money.isMoney(initialBalance)) {
            // Money mode
            if (initialBalance.isNegative()) {
                throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
            }
            this.initialMode = 'money';
            this.balanceMoney = initialBalance;
        } else {
            // Number mode
            if (initialBalance < 0) {
                throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
            }
            this.initialMode = 'number';
            this.balanceMoney = new Money(initialBalance, defaultCurrency);
        }
    }

    /**
     * Convert amount to Money, validating currency if needed
     * @private
     * @param {number | Money} amount - The amount to convert
     * @returns {Money} The converted Money instance
     * @throws {Error} If currency mismatch when using Money
     */
    private toMoney(amount: number | Money): Money {
        if (Money.isMoney(amount)) {
            // Validate currency matches
            if (this.balanceMoney.currency !== amount.currency) {
                throw new Error(
                    `Currency mismatch: Account uses ${this.balanceMoney.currency}, ` +
                    `but received ${amount.currency}`
                );
            }
            return amount;
        }

        // Convert number to Money using account's currency
        return new Money(amount, this.balanceMoney.currency);
    }

    /**
     * Debit an amount to the account.
     * @param {number | Money} amount - The amount to debit.
     * @throws {Error} If amount is negative or currency mismatch
     */
    public debit(amount: number | Money): void {
        const moneyAmount = this.toMoney(amount);

        if (moneyAmount.isNegative()) {
            throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
        }

        if (this.isDebitPositive) {
            this.balanceMoney = this.balanceMoney.add(moneyAmount);
        } else {
            this.balanceMoney = this.balanceMoney.subtract(moneyAmount);
        }
    }

    /**
     * Credit an amount to the account.
     * @param {number | Money} amount - The amount to credit.
     * @throws {Error} If amount is negative or currency mismatch
     */
    public credit(amount: number | Money): void {
        const moneyAmount = this.toMoney(amount);

        if (moneyAmount.isNegative()) {
            throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
        }

        if (this.isDebitPositive) {
            this.balanceMoney = this.balanceMoney.subtract(moneyAmount);
        } else {
            this.balanceMoney = this.balanceMoney.add(moneyAmount);
        }
    }

    /**
     * Get the current balance of the account.
     * Returns the same type as initialized (number or Money).
     * @return {number | Money} The current balance.
     */
    public getBalance(): number | Money {
        return this.initialMode === 'number'
            ? this.balanceMoney.toNumber()
            : this.balanceMoney;
    }

    /**
     * Get the currency of this account
     * @return {string} The currency code
     */
    public getCurrency(): string {
        return this.balanceMoney.currency;
    }

    /**
     * Check if account was initialized with numbers
     * @return {boolean} True if using number mode
     */
    public isNumberMode(): boolean {
        return this.initialMode === 'number';
    }

    /**
     * Check if account was initialized with Money
     * @return {boolean} True if using Money mode
     */
    public isMoneyMode(): boolean {
        return this.initialMode === 'money';
    }

    /**
     * Protected getter for balance (used by subclasses)
     * @protected
     * @return {number} The balance as number
     */
    protected get balance(): number {
        return this.balanceMoney.toNumber();
    }

    /**
     * Protected setter for balance (used by subclasses if needed)
     * @protected
     * @param {number} value - The new balance value
     */
    protected set balance(value: number) {
        if (value < 0) {
            throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
        }
        this.balanceMoney = new Money(value, this.balanceMoney.currency);
    }

    /**
     * Serialize the account for persistence
     */
    public serialize(): any {
        return {
            name: this.name,
            balance: this.balanceMoney.toJSON(),
            isDebitPositive: this.isDebitPositive,
            initialMode: this.initialMode,
            currency: this.balanceMoney.currency
        };
    }

    /**
     * Create an Account instance from serialized data
     */
    public static fromData(data: any): Account {
        let initialBalance: number | Money = 0;

        if (data.balance) {
            if (data.initialMode === 'number') {
                // If originally created with number, restore as number
                initialBalance = data.balance.amount;
            } else {
                // Reconstruct Money object
                initialBalance = new Money(
                    data.balance.amount,
                    data.balance.currency || data.currency
                );
            }
        }

        // Use the public constructor to ensure all invariants are respected
        const account = new Account(
            data.name,
            initialBalance,
            data.isDebitPositive,
            data.currency || 'CURR'
        );

        return account;
    }
}

export default Account;
