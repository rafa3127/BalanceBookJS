/**
 * BalanceBookJS - A TypeScript/JavaScript library for double-entry bookkeeping
 * @module balancebookjs
 */

// Account classes
export { default as Account } from './classes/accounts/Account.js';
export { default as Asset } from './classes/accounts/Asset.js';
export { default as Liability } from './classes/accounts/Liability.js';
export { default as Equity } from './classes/accounts/Equity.js';
export { default as Income } from './classes/accounts/Income.js';
export { default as Expense } from './classes/accounts/Expense.js';

// Transaction classes
export { default as JournalEntry } from './classes/transactions/JournalEntry.js';

// Value Objects
export { 
  Money,
  MoneyUtils,
  createCurrency,
  createFactory,
  CurrencyRegistry,
  registerCurrencyConfig
} from './classes/value-objects/index.js';

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
} from './types/account.types.js';

export type {
  IJournalEntry,
  IJournalEntryLine,
  IEntryDetail,
  JournalEntryConstructorParams,
  TransactionStatus,
  IJournalEntryWithStatus
} from './types/transaction.types.js';

export type {
  IMoney,
  IMoneyOptions,
  ICurrencyConfig,
  IMoneyJSON,
  ICurrencyConstructor,
  ICurrencyFactory
} from './types/money.types.js';

// Constants and enums
export {
  ENTRY_TYPES,
  EntryType,
  AccountType,
  ACCOUNT_BEHAVIOR,
  VALIDATION,
  ERROR_MESSAGES
} from './Constants.js';

// Re-export everything from the convenience modules
export * from './classes/accounts/index.js';
export * from './classes/transactions/index.js';
