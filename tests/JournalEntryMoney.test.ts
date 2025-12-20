/**
 * Integration tests for JournalEntry with Money value objects
 */

import JournalEntry from '../src/classes/transactions/JournalEntry';
import { Asset, Expense, Liability } from '../src/classes/accounts';
import { Money } from '../src/classes/value-objects/Money';
import { ENTRY_TYPES } from '../src/Constants';

describe('JournalEntry with Money integration', () => {
  describe('Basic Money support', () => {
    test('should accept Money objects in addEntry', () => {
      const journal = new JournalEntry({ description: 'Purchase supplies' });
      const cash = new Asset({ name: 'Cash', balance: new Money(5000, 'USD') });
      const supplies = new Asset({ name: 'Supplies', balance: new Money(0, 'USD') });

      // Add entries with Money objects
      const amount = new Money(100, 'USD');
      journal.addEntry(supplies, amount, ENTRY_TYPES.DEBIT);
      journal.addEntry(cash, amount, ENTRY_TYPES.CREDIT);

      expect(journal.getEntryCount()).toBe(2);
      expect(journal.isBalanced()).toBe(true);
    });

    test('should handle mixed Money and number entries', () => {
      const journal = new JournalEntry({ description: 'Mixed transaction' });
      const cash = new Asset({ name: 'Cash', balance: 1000 });
      const expense = new Expense({ name: 'Office Expense', balance: 0 });

      // Mix Money and number
      journal.addEntry(expense, new Money(250.50, 'USD'), ENTRY_TYPES.DEBIT);
      journal.addEntry(cash, 250.50, ENTRY_TYPES.CREDIT);

      expect(journal.isBalanced()).toBe(true);
      expect(journal.getDebitTotal()).toBe(250.50);
      expect(journal.getCreditTotal()).toBe(250.50);
    });

    test('should commit transactions with Money amounts', () => {
      const journal = new JournalEntry({ description: 'Rent payment' });
      const cash = new Asset({ name: 'Cash', balance: new Money(10000, 'USD') });
      const rentExpense = new Expense({ name: 'Rent', balance: new Money(0, 'USD') }); // Use USD for consistency

      const rentAmount = new Money(2500, 'USD');
      journal.addEntry(rentExpense, rentAmount, ENTRY_TYPES.DEBIT);
      journal.addEntry(cash, rentAmount, ENTRY_TYPES.CREDIT);

      // Before commit - use toNumber() since we initialized with Money
      expect((cash.getBalance() as Money).toNumber()).toBe(10000);
      expect((rentExpense.getBalance() as Money).toNumber()).toBe(0);

      // Commit
      journal.commit();

      // After commit - cash decreased, expense increased
      expect((cash.getBalance() as Money).toNumber()).toBe(7500);
      expect((rentExpense.getBalance() as Money).toNumber()).toBe(2500);
    });

    test('should validate negative Money amounts', () => {
      const journal = new JournalEntry({ description: 'Test entry' });
      const account = new Asset({ name: 'Test', balance: 100 });

      // Money with negative amount should still be validated
      expect(() => {
        journal.addEntry(account, new Money(-50, 'USD'), ENTRY_TYPES.DEBIT);
      }).toThrow('Amount must be positive'); // Use the actual error message
    });

    test('should calculate totals correctly with Money', () => {
      const journal = new JournalEntry({ description: 'Complex transaction' });
      const cash = new Asset({ name: 'Cash', balance: 5000 });
      const inventory = new Asset({ name: 'Inventory', balance: 0 });
      const sales = new Asset({ name: 'Sales', balance: 0 });

      // Multiple Money entries
      journal.addEntry(inventory, new Money(1000, 'USD'), ENTRY_TYPES.DEBIT);
      journal.addEntry(sales, new Money(500, 'USD'), ENTRY_TYPES.DEBIT);
      journal.addEntry(cash, new Money(1500, 'USD'), ENTRY_TYPES.CREDIT);

      expect(journal.getDebitTotal()).toBe(1500);
      expect(journal.getCreditTotal()).toBe(1500);
      expect(journal.isBalanced()).toBe(true);
    });

    test('should handle Money with different internal precision', () => {
      const journal = new JournalEntry({ description: 'Precision test' });
      const account1 = new Asset({ name: 'Account1', balance: 0 });
      const account2 = new Asset({ name: 'Account2', balance: 0 });

      // Money with micro amounts (internal precision)
      const microAmount = new Money(0.001, 'USD'); // Internal: 0.001, Display: 0.00

      journal.addEntry(account1, microAmount, ENTRY_TYPES.DEBIT);
      journal.addEntry(account2, microAmount, ENTRY_TYPES.CREDIT);

      // Should balance at display precision
      expect(journal.isBalanced()).toBe(true);
      expect(journal.getDebitTotal()).toBe(0); // Display rounds to 0
      expect(journal.getCreditTotal()).toBe(0); // Display rounds to 0
    });

    test('getDetails should work with Money amounts', () => {
      const journal = new JournalEntry({ description: 'Detail test', date: new Date('2025-01-15') });
      const cash = new Asset({ name: 'Cash', balance: 1000 });
      const expense = new Expense({ name: 'Supplies', balance: 0 });

      journal.addEntry(expense, new Money(75.25, 'USD'), ENTRY_TYPES.DEBIT);
      journal.addEntry(cash, new Money(75.25, 'USD'), ENTRY_TYPES.CREDIT);

      const details = journal.getDetails();

      expect(details).toHaveLength(2);
      expect(details[0]).toEqual({
        accountName: 'Supplies',
        amount: 75.25,
        type: ENTRY_TYPES.DEBIT,
        date: new Date('2025-01-15'),
        description: 'Detail test'
      });
      expect(details[1]).toEqual({
        accountName: 'Cash',
        amount: 75.25,
        type: ENTRY_TYPES.CREDIT,
        date: new Date('2025-01-15'),
        description: 'Detail test'
      });
    });

    test('should prevent currency mixing through accounts', () => {
      const journal = new JournalEntry({ description: 'Currency test' });

      // Create accounts with different currencies
      const usdAccount = new Asset({ name: 'USD Cash', balance: new Money(1000, 'USD') });
      const eurAccount = new Asset({ name: 'EUR Cash', balance: new Money(1000, 'EUR') });

      // Try to transfer between different currencies
      journal.addEntry(usdAccount, new Money(100, 'EUR'), ENTRY_TYPES.DEBIT); // Wrong currency!
      journal.addEntry(eurAccount, new Money(100, 'EUR'), ENTRY_TYPES.CREDIT);

      // This will balance at the numeric level
      expect(journal.isBalanced()).toBe(true);

      // But commit will fail when trying to debit USD account with EUR
      expect(() => {
        journal.commit();
      }).toThrow('Currency mismatch'); // Will throw currency mismatch
    });
  });

  describe('Complex scenarios', () => {
    test('should handle multi-account journal entry with Money', () => {
      const journal = new JournalEntry({ description: 'Payroll transaction' });

      // Accounts - all with USD to avoid currency mismatch
      const cash = new Asset({ name: 'Cash', balance: new Money(50000, 'USD') });
      const salaries = new Expense({ name: 'Salaries', balance: new Money(0, 'USD') });
      const taxes = new Liability({ name: 'Tax Payable', balance: new Money(0, 'USD') }); // Changed to Liability
      const benefits = new Liability({ name: 'Benefits Payable', balance: new Money(0, 'USD') }); // Changed to Liability

      // Complex payroll entry
      journal.addEntry(salaries, new Money(10000, 'USD'), ENTRY_TYPES.DEBIT);
      journal.addEntry(taxes, new Money(2000, 'USD'), ENTRY_TYPES.CREDIT);
      journal.addEntry(benefits, new Money(1000, 'USD'), ENTRY_TYPES.CREDIT);
      journal.addEntry(cash, new Money(7000, 'USD'), ENTRY_TYPES.CREDIT);

      expect(journal.isBalanced()).toBe(true);
      expect(journal.getDebitTotal()).toBe(10000);
      expect(journal.getCreditTotal()).toBe(10000);

      journal.commit();

      // Use toNumber() since accounts were initialized with Money
      expect((salaries.getBalance() as Money).toNumber()).toBe(10000);
      expect((cash.getBalance() as Money).toNumber()).toBe(43000); // 50000 - 7000
    });

    test('should maintain precision through journal entries', () => {
      const journal = new JournalEntry({ description: 'Precision maintenance' });
      const account1 = new Asset({ name: 'Account1', balance: new Money(0, 'USD') });
      const account2 = new Asset({ name: 'Account2', balance: new Money(0, 'USD') });

      // Use amounts that would have floating point issues
      const amount1 = new Money(0.1, 'USD');
      const amount2 = new Money(0.2, 'USD');
      const total = amount1.add(amount2); // Internally precise

      journal.addEntry(account1, amount1, ENTRY_TYPES.DEBIT);
      journal.addEntry(account1, amount2, ENTRY_TYPES.DEBIT);
      journal.addEntry(account2, total, ENTRY_TYPES.CREDIT);

      expect(journal.isBalanced()).toBe(true);
      // The totals use toNumber() which gives display precision
      expect(journal.getDebitTotal()).toBeCloseTo(0.30, 10); // Use toBeCloseTo for safety
    });
  });
});
