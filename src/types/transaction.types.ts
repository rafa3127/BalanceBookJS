/**
 * Core type definitions for BalanceBookJS transactions
 */

import { IAccount } from './account.types';
import { EntryType } from '../Constants';

/**
 * Represents a single entry within a journal entry
 */
export interface IJournalEntryLine {
  account: IAccount;
  amount: number;
  type: EntryType;
}

/**
 * Details of a journal entry for reporting
 */
export interface IEntryDetail {
  accountName: string;
  amount: number;
  type: EntryType;
  date: Date;
  description: string;
}

/**
 * Main journal entry interface
 */
export interface IJournalEntry {
  readonly description: string;
  readonly date: Date;
  readonly id?: string;
  addEntry(account: IAccount, amount: number, type: EntryType): void;
  commit(): void;
  getDetails(): IEntryDetail[];
  isBalanced(): boolean;
  getDebitTotal(): number;
  getCreditTotal(): number;
}

/**
 * Journal entry constructor parameters
 */
export interface JournalEntryConstructorParams {
  description: string;
  date?: Date;
  id?: string;
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 'PENDING',
  COMMITTED = 'COMMITTED',
  VOID = 'VOID'
}

/**
 * Extended journal entry with status tracking
 */
export interface IJournalEntryWithStatus extends IJournalEntry {
  readonly status: TransactionStatus;
  void(): void;
}
