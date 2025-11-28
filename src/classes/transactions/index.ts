/**
 * Central export point for all transaction classes
 * This module exports transaction-related classes that handle
 * the recording and processing of accounting entries.
 */

export { default as JournalEntry } from './JournalEntry.ts';

// Future transaction types can be added here:
// export { default as ExpenseTransaction } from './ExpenseTransaction';
// export { default as IncomeTransaction } from './IncomeTransaction';
// export { default as TransferTransaction } from './TransferTransaction';
// export { default as AdjustmentEntry } from './AdjustmentEntry';
// export { default as ClosingEntry } from './ClosingEntry';
// etc.
