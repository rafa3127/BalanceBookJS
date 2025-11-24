/**
 * Core type definitions for BalanceBookJS accounts
 */

import type { IMoney } from './money.types.js';

/**
 * Base interface for all account types
 */
export interface IAccount {
  readonly name: string;
  debit(amount: number | IMoney): void;
  credit(amount: number | IMoney): void;
  getBalance(): number | IMoney;
  getCurrency(): string;
  isNumberMode(): boolean;
  isMoneyMode(): boolean;
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
  initialBalance?: number | IMoney;
  isDebitPositive: boolean;
  defaultCurrency?: string;
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
 * Union type for any account type
 */
export type AnyAccount = IAsset | ILiability | IEquity | IIncome | IExpense;
