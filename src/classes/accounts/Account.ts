import { ISerializable } from '../../types/serialization.ts';
import { IAccountInternal } from '../../types/account.types.ts';
import { AccountConfig } from '../../types/config.types.ts';
import { Money } from '../value-objects/Money.ts';
import { ERROR_MESSAGES } from '../../Constants.ts';

/**
 * Known keys in AccountConfig that are handled specially by the constructor.
 * Extra fields (not in this list) are stored directly on the instance.
 */
const KNOWN_CONFIG_KEYS = ['name', 'balance', 'isDebitPositive', 'currency'];

/**
 * Class representing a generic account with Money integration.
 * Implements transparent mode - returns the same type as initialized.
 *
 * @example
 * ```typescript
 * // Basic usage with config object
 * const account = new Account({
 *     name: 'Cash',
 *     balance: 1000,
 *     isDebitPositive: true,
 *     currency: 'USD'
 * });
 *
 * // With Money object
 * const account = new Account({
 *     name: 'Cash',
 *     balance: new Money(1000, 'USD'),
 *     isDebitPositive: true
 * });
 *
 * // Extended with custom fields
 * const account = new Account({
 *     name: 'Cash',
 *     balance: 1000,
 *     isDebitPositive: true,
 *     department: 'Sales',  // custom field
 *     category: 'Operating' // custom field
 * });
 * ```
 *
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
     * Index signature to allow extra fields for extensibility
     */
    [key: string]: unknown;

    /**
     * Create an account.
     * @param {AccountConfig} config - Configuration object for the account.
     * @throws {Error} If name is empty
     * @throws {Error} If balance is negative
     *
     * @example
     * ```typescript
     * new Account({ name: 'Cash', balance: 1000, isDebitPositive: true })
     * ```
     */
    constructor(config: AccountConfig) {
        // Validate name
        if (!config.name || config.name.trim().length === 0) {
            throw new Error('Account name cannot be empty');
        }

        this.name = config.name;
        this.isDebitPositive = config.isDebitPositive;

        // Setup balance
        const balance = config.balance ?? 0;
        const currency = config.currency ?? 'CURR';

        // Detect initialization mode and setup balance
        if (Money.isMoney(balance)) {
            // Money mode
            if (balance.isNegative()) {
                throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
            }
            this.initialMode = 'money';
            this.balanceMoney = balance;
        } else {
            // Number mode
            const numericBalance = balance as number;
            if (numericBalance < 0) {
                throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
            }
            this.initialMode = 'number';
            this.balanceMoney = new Money(numericBalance, currency);
        }

        // Store extra fields (excluding known config keys)
        for (const [key, value] of Object.entries(config)) {
            if (!KNOWN_CONFIG_KEYS.includes(key)) {
                this[key] = value;
            }
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
     * Serialize the account for persistence.
     * Includes all extra fields stored on the instance.
     */
    public serialize(): Record<string, unknown> {
        const base: Record<string, unknown> = {
            name: this.name,
            type: (this as Record<string, unknown>).type || 'ACCOUNT',
            balance: this.balanceMoney.toJSON(),
            isDebitPositive: this.isDebitPositive,
            initialMode: this.initialMode,
            currency: this.balanceMoney.currency
        };

        // Include extra fields (not in known keys and not private/internal)
        const internalKeys = ['name', 'balanceMoney', 'initialMode', 'isDebitPositive', 'type'];
        for (const key of Object.keys(this)) {
            if (!internalKeys.includes(key) && !key.startsWith('_')) {
                base[key] = this[key];
            }
        }

        return base;
    }

    /**
     * Create an Account instance from serialized data.
     * @param {Record<string, unknown>} data - The serialized account data
     * @returns {Account} A new Account instance
     */
    public static fromData(data: Record<string, unknown>): Account {
        let balance: number | Money = 0;

        if (data.balance) {
            const balanceData = data.balance as Record<string, unknown>;
            if (data.initialMode === 'number') {
                // If originally created with number, restore as number
                balance = balanceData.amount as number;
            } else {
                // Reconstruct Money object
                balance = new Money(
                    balanceData.amount as number,
                    (balanceData.currency as string) || (data.currency as string)
                );
            }
        }

        // Build config from data, preserving extra fields
        const config: AccountConfig = {
            name: data.name as string,
            balance,
            isDebitPositive: data.isDebitPositive as boolean,
            currency: (data.currency as string) || 'CURR'
        };

        // Copy extra fields to config
        const knownDataKeys = ['name', 'balance', 'isDebitPositive', 'currency', 'type', 'initialMode', 'id'];
        for (const [key, value] of Object.entries(data)) {
            if (!knownDataKeys.includes(key)) {
                config[key] = value;
            }
        }

        return new Account(config);
    }
}

export default Account;
