/**
 * Core constants for BalanceBookJS
 */

/**
 * Entry types for journal entries
 */
export const ENTRY_TYPES = {
  DEBIT: 'debit',
  CREDIT: 'credit'
} as const;

export type EntryType = typeof ENTRY_TYPES[keyof typeof ENTRY_TYPES];

/**
 * Account types enumeration
 */
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

/**
 * Account behavior configuration
 */
export const ACCOUNT_BEHAVIOR = {
  [AccountType.ASSET]: { isDebitPositive: true },
  [AccountType.LIABILITY]: { isDebitPositive: false },
  [AccountType.EQUITY]: { isDebitPositive: false },
  [AccountType.INCOME]: { isDebitPositive: false },
  [AccountType.EXPENSE]: { isDebitPositive: true }
} as const;

/**
 * Validation constants
 */
export const VALIDATION = {
  MIN_AMOUNT: 0,
  MAX_DECIMAL_PLACES: 2,
  BALANCE_TOLERANCE: 0.01 // For floating point comparison
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NEGATIVE_AMOUNT: 'Amount must be positive',
  INVALID_ENTRY_TYPE: 'Entry type must be either debit or credit',
  UNBALANCED_ENTRY: 'Journal entry must balance (debits must equal credits)',
  EMPTY_JOURNAL_ENTRY: 'Journal entry must have at least one debit and one credit',
  ACCOUNT_NOT_FOUND: 'Account not found',
  INVALID_DATE: 'Invalid date provided'
} as const;
