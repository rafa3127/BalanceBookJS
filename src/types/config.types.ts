/**
 * Configuration types for BalanceBookJS constructors (v3.0)
 * These interfaces enable config-based constructors that support extensibility.
 */

import type { IMoney } from './money.types.ts';

/**
 * Base configuration for all accounts.
 * Users can extend this interface to add custom required/optional fields.
 *
 * @example
 * ```typescript
 * // Basic usage
 * new Account({ name: 'Cash', balance: 1000, isDebitPositive: true })
 *
 * // With Money object
 * new Account({ name: 'Cash', balance: new Money(1000, 'USD'), isDebitPositive: true })
 * ```
 */
export interface AccountConfig {
    /** Account name (required) */
    name: string;

    /** Initial balance - number or Money object (default: 0) */
    balance?: number | IMoney;

    /** Whether debits increase the balance */
    isDebitPositive: boolean;

    /** Currency code for number mode (default: 'CURR') */
    currency?: string;

    /** Allow extra fields for extensibility */
    [key: string]: unknown;
}

/**
 * Configuration for Asset accounts.
 * Assets: Debits increase, Credits decrease (isDebitPositive = true)
 *
 * @example
 * ```typescript
 * new Asset({ name: 'Cash', balance: 1000, currency: 'USD' })
 * ```
 */
export interface AssetConfig extends Omit<AccountConfig, 'isDebitPositive'> {
    // isDebitPositive is always true for Assets, so it's omitted
}

/**
 * Configuration for Liability accounts.
 * Liabilities: Credits increase, Debits decrease (isDebitPositive = false)
 *
 * @example
 * ```typescript
 * new Liability({ name: 'Accounts Payable', balance: 5000 })
 * ```
 */
export interface LiabilityConfig extends Omit<AccountConfig, 'isDebitPositive'> {
    // isDebitPositive is always false for Liabilities
}

/**
 * Configuration for Equity accounts.
 * Equity: Credits increase, Debits decrease (isDebitPositive = false)
 *
 * @example
 * ```typescript
 * new Equity({ name: "Owner's Equity", balance: 10000 })
 * ```
 */
export interface EquityConfig extends Omit<AccountConfig, 'isDebitPositive'> {
    // isDebitPositive is always false for Equity
}

/**
 * Configuration for Income/Revenue accounts.
 * Income: Credits increase, Debits decrease (isDebitPositive = false)
 *
 * @example
 * ```typescript
 * new Income({ name: 'Sales Revenue', balance: 0 })
 * ```
 */
export interface IncomeConfig extends Omit<AccountConfig, 'isDebitPositive'> {
    // isDebitPositive is always false for Income
}

/**
 * Configuration for Expense accounts.
 * Expenses: Debits increase, Credits decrease (isDebitPositive = true)
 *
 * @example
 * ```typescript
 * new Expense({ name: 'Rent Expense', balance: 0 })
 * ```
 */
export interface ExpenseConfig extends Omit<AccountConfig, 'isDebitPositive'> {
    // isDebitPositive is always true for Expenses
}

/**
 * Configuration for Journal Entry.
 *
 * @example
 * ```typescript
 * new JournalEntry({ description: 'Monthly rent payment', date: new Date() })
 * ```
 */
export interface JournalEntryConfig {
    /** Description of the transaction (required) */
    description: string;

    /** Entry date (default: current date) */
    date?: Date;

    /** Optional unique identifier */
    id?: string;

    /** Optional reference number (e.g., invoice number, check number) */
    reference?: string;

    /** Allow extra fields for extensibility */
    [key: string]: unknown;
}
