/**
 * BalanceBookJS - A TypeScript/JavaScript library for double-entry bookkeeping
 * @module balancebookjs
 */

// Account classes
export { default as Account } from './classes/accounts/Account';
export { default as Asset } from './classes/accounts/Asset';
export { default as Liability } from './classes/accounts/Liability';
export { default as Equity } from './classes/accounts/Equity';
export { default as Income } from './classes/accounts/Income';
export { default as Expense } from './classes/accounts/Expense';

// Transaction classes
export { default as JournalEntry } from './classes/transactions/JournalEntry';

// Type exports for TypeScript consumers
export type {
  IAccount,
  IAccountInternal,
  AccountConstructorParams,
  IAsset,
  ILiability,
  IEquity,
  IIncome,
  IExpense,
  AnyAccount
} from './types/account.types';

export type {
  IJournalEntry,
  IJournalEntryLine,
  IEntryDetail,
  JournalEntryConstructorParams,
  TransactionStatus,
  IJournalEntryWithStatus
} from './types/transaction.types';

// Constants and enums
export {
  ENTRY_TYPES,
  EntryType,
  AccountType,
  ACCOUNT_BEHAVIOR,
  VALIDATION,
  ERROR_MESSAGES
} from './Constants';

// Re-export everything from the convenience modules
export * from './classes/accounts';
export * from './classes/transactions';
