/**
 * Core type definitions for BalanceBookJS accounts
 */

/**
 * Base interface for all account types
 */
export interface IAccount {
  readonly name: string;
  debit(amount: number): void;
  credit(amount: number): void;
  getBalance(): number;
}

/**
 * Extended interface with internal properties
 */
export interface IAccountInternal extends IAccount {
  readonly isDebitPositive: boolean;
}

/**
 * Account constructor parameters
 */
export interface AccountConstructorParams {
  name: string;
  initialBalance?: number;
  isDebitPositive: boolean;
}

/**
 * Specific account type interfaces for better type safety
 */
export interface IAsset extends IAccount {
  readonly type: 'ASSET';
}

export interface ILiability extends IAccount {
  readonly type: 'LIABILITY';
}

export interface IEquity extends IAccount {
  readonly type: 'EQUITY';
}

export interface IIncome extends IAccount {
  readonly type: 'INCOME';
}

export interface IExpense extends IAccount {
  readonly type: 'EXPENSE';
}

/**
 * Union type for all account types
 */
export type AnyAccount = IAsset | ILiability | IEquity | IIncome | IExpense;
