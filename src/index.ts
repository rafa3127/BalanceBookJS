/**
 * BalanceBookJS - A TypeScript/JavaScript library for double-entry bookkeeping
 * @module balancebookjs
 */

// Account classes
export { default as Account } from './classes/accounts/Account.ts';
export { default as Asset } from './classes/accounts/Asset.ts';
export { default as Liability } from './classes/accounts/Liability.ts';
export { default as Equity } from './classes/accounts/Equity.ts';
export { default as Income } from './classes/accounts/Income.ts';
export { default as Expense } from './classes/accounts/Expense.ts';

// Transaction classes
export { default as JournalEntry } from './classes/transactions/JournalEntry.ts';

// Value Objects
export {
  Money,
  MoneyUtils,
  createCurrency,
  createFactory,
  CurrencyRegistry,
  registerCurrencyConfig
} from './classes/value-objects/index.ts';

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
} from './types/account.types.ts';

// Config types for v3 constructor API
export type {
  AccountConfig,
  AssetConfig,
  LiabilityConfig,
  EquityConfig,
  IncomeConfig,
  ExpenseConfig,
  JournalEntryConfig
} from './types/config.types.ts';

export type {
  IJournalEntry,
  IJournalEntryLine,
  IEntryDetail,
  JournalEntryConstructorParams,
  TransactionStatus,
  IJournalEntryWithStatus
} from './types/transaction.types.ts';

export type {
  IMoney,
  IMoneyOptions,
  ICurrencyConfig,
  IMoneyJSON,
  ICurrencyConstructor,
  ICurrencyFactory
} from './types/money.types.ts';

// Constants and enums
export {
  ENTRY_TYPES,
  EntryType,
  AccountType,
  ACCOUNT_BEHAVIOR,
  VALIDATION,
  ERROR_MESSAGES
} from './Constants.ts';

// Re-export everything from the convenience modules
export * from './classes/accounts/index.ts';
export * from './classes/transactions/index.ts';
