import JournalEntry from '../src/classes/transactions/JournalEntry';
import { Account, Asset, Liability, Expense, Income } from '../src/classes/accounts';
import { ENTRY_TYPES, ERROR_MESSAGES } from '../src/Constants';

describe('JournalEntry class', () => {
  describe('Constructor', () => {
    test('should initialize with description and date', () => {
      const description = 'Test Journal Entry';
      const date = new Date('2025-04-27');
      const journalEntry = new JournalEntry({ description, date });

      expect(journalEntry.description).toBe(description);
      expect(journalEntry.date).toEqual(date);
      expect(journalEntry.getEntryCount()).toBe(0);
      expect(journalEntry.isCommitted()).toBe(false);
    });

    test('should use current date if not provided', () => {
      const journalEntry = new JournalEntry({ description: 'Test Entry' });
      const now = new Date();

      // Check that the date is close to now (within 1 second)
      expect(journalEntry.date.getTime()).toBeCloseTo(now.getTime(), -3);
    });

    test('should accept optional id parameter', () => {
      const journalEntry = new JournalEntry({ description: 'Test Entry', date: new Date(), id: 'JE-001' });
      expect(journalEntry.id).toBe('JE-001');
    });

    test('should accept optional reference parameter', () => {
      const journalEntry = new JournalEntry({ description: 'Test Entry', reference: 'INV-001' });
      expect(journalEntry.reference).toBe('INV-001');
    });

    test('should throw error for empty description', () => {
      expect(() => new JournalEntry({ description: '' })).toThrow('Journal entry description cannot be empty');
      expect(() => new JournalEntry({ description: '   ' })).toThrow('Journal entry description cannot be empty');
    });

    test('should store extra fields from config', () => {
      const journalEntry = new JournalEntry({
        description: 'Test Entry',
        department: 'Accounting',
        approvedBy: 'John Smith'
      });

      expect((journalEntry as any).department).toBe('Accounting');
      expect((journalEntry as any).approvedBy).toBe('John Smith');
    });
  });

  describe('addEntry method', () => {
    let journalEntry: JournalEntry;
    let cashAccount: Asset;
    let expenseAccount: Expense;

    beforeEach(() => {
      journalEntry = new JournalEntry({ description: 'Test Entry' });
      cashAccount = new Asset({ name: 'Cash', balance: 1000 });
      expenseAccount = new Expense({ name: 'Rent Expense', balance: 0 });
    });

    test('should add a valid debit entry to the journal', () => {
      journalEntry.addEntry(cashAccount, 500, ENTRY_TYPES.DEBIT);

      expect(journalEntry.getEntryCount()).toBe(1);
      const entries = journalEntry.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        account: cashAccount,
        amount: 500,
        type: ENTRY_TYPES.DEBIT,
      });
    });

    test('should add a valid credit entry to the journal', () => {
      journalEntry.addEntry(cashAccount, 300, ENTRY_TYPES.CREDIT);

      expect(journalEntry.getEntryCount()).toBe(1);
      const entries = journalEntry.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        account: cashAccount,
        amount: 300,
        type: ENTRY_TYPES.CREDIT,
      });
    });

    test('should add multiple entries', () => {
      journalEntry.addEntry(cashAccount, 500, ENTRY_TYPES.CREDIT);
      journalEntry.addEntry(expenseAccount, 500, ENTRY_TYPES.DEBIT);

      expect(journalEntry.getEntryCount()).toBe(2);
    });

    test('should throw error for negative amount', () => {
      expect(() => {
        journalEntry.addEntry(cashAccount, -100, ENTRY_TYPES.DEBIT);
      }).toThrow(ERROR_MESSAGES.NEGATIVE_AMOUNT);
    });

    test('should throw error for invalid account', () => {
      const invalidAccount = {} as any;
      expect(() => {
        journalEntry.addEntry(invalidAccount, 100, ENTRY_TYPES.DEBIT);
      }).toThrow('Invalid account passed to JournalEntry');
    });

    test('should throw error for invalid entry type', () => {
      expect(() => {
        journalEntry.addEntry(cashAccount, 100, 'invalid' as any);
      }).toThrow(ERROR_MESSAGES.INVALID_ENTRY_TYPE);
    });

    test('should accept zero amount', () => {
      journalEntry.addEntry(cashAccount, 0, ENTRY_TYPES.DEBIT);
      expect(journalEntry.getEntryCount()).toBe(1);
    });

    test('should handle decimal amounts', () => {
      journalEntry.addEntry(cashAccount, 99.99, ENTRY_TYPES.DEBIT);
      const entries = journalEntry.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.amount).toBe(99.99);
    });

    test('should throw error when adding to committed journal entry', () => {
      journalEntry.addEntry(cashAccount, 100, ENTRY_TYPES.CREDIT);
      journalEntry.addEntry(expenseAccount, 100, ENTRY_TYPES.DEBIT);
      journalEntry.commit();

      expect(() => {
        journalEntry.addEntry(cashAccount, 50, ENTRY_TYPES.DEBIT);
      }).toThrow('Cannot modify a committed journal entry');
    });
  });

  describe('Balance checking methods', () => {
    let journalEntry: JournalEntry;
    let cashAccount: Asset;
    let expenseAccount: Expense;

    beforeEach(() => {
      journalEntry = new JournalEntry({ description: 'Test Entry' });
      cashAccount = new Asset({ name: 'Cash', balance: 1000 });
      expenseAccount = new Expense({ name: 'Rent Expense', balance: 0 });
    });

    test('isBalanced should return true when debits equal credits', () => {
      journalEntry.addEntry(cashAccount, 500, ENTRY_TYPES.CREDIT);
      journalEntry.addEntry(expenseAccount, 500, ENTRY_TYPES.DEBIT);

      expect(journalEntry.isBalanced()).toBe(true);
    });

    test('isBalanced should return false when debits do not equal credits', () => {
      journalEntry.addEntry(cashAccount, 500, ENTRY_TYPES.CREDIT);
      journalEntry.addEntry(expenseAccount, 600, ENTRY_TYPES.DEBIT);

      expect(journalEntry.isBalanced()).toBe(false);
    });

    test('isBalanced should handle floating point precision', () => {
      journalEntry.addEntry(cashAccount, 0.1 + 0.2, ENTRY_TYPES.CREDIT);
      journalEntry.addEntry(expenseAccount, 0.3, ENTRY_TYPES.DEBIT);

      expect(journalEntry.isBalanced()).toBe(true);
    });

    test('getDebitTotal should return sum of all debits', () => {
      journalEntry.addEntry(expenseAccount, 300, ENTRY_TYPES.DEBIT);
      journalEntry.addEntry(cashAccount, 200, ENTRY_TYPES.DEBIT);

      expect(journalEntry.getDebitTotal()).toBe(500);
    });

    test('getCreditTotal should return sum of all credits', () => {
      journalEntry.addEntry(cashAccount, 300, ENTRY_TYPES.CREDIT);
      journalEntry.addEntry(expenseAccount, 200, ENTRY_TYPES.CREDIT);

      expect(journalEntry.getCreditTotal()).toBe(500);
    });

    test('totals should be zero for empty journal entry', () => {
      expect(journalEntry.getDebitTotal()).toBe(0);
      expect(journalEntry.getCreditTotal()).toBe(0);
    });
  });

  describe('commit method', () => {
    let journalEntry: JournalEntry;
    let cashAccount: Asset;
    let expenseAccount: Expense;
    let liabilityAccount: Liability;

    beforeEach(() => {
      journalEntry = new JournalEntry({ description: 'Test Entry' });
      cashAccount = new Asset({ name: 'Cash', balance: 1000 });
      expenseAccount = new Expense({ name: 'Rent Expense', balance: 0 });
      liabilityAccount = new Liability({ name: 'Accounts Payable', balance: 500 });
    });

    test('should apply transactions when debits and credits balance', () => {
      journalEntry.addEntry(cashAccount, 500, ENTRY_TYPES.CREDIT);
      journalEntry.addEntry(expenseAccount, 500, ENTRY_TYPES.DEBIT);

      journalEntry.commit();

      expect(cashAccount.getBalance()).toBe(500);
      expect(expenseAccount.getBalance()).toBe(500);
      expect(journalEntry.isCommitted()).toBe(true);
    });

    test('should throw error when debits and credits do not balance', () => {
      journalEntry.addEntry(cashAccount, 500, ENTRY_TYPES.CREDIT);
      journalEntry.addEntry(expenseAccount, 600, ENTRY_TYPES.DEBIT);

      expect(() => {
        journalEntry.commit();
      }).toThrow(ERROR_MESSAGES.UNBALANCED_ENTRY);
    });

    test('should include actual values in unbalanced error message', () => {
      journalEntry.addEntry(cashAccount, 500, ENTRY_TYPES.CREDIT);
      journalEntry.addEntry(expenseAccount, 600, ENTRY_TYPES.DEBIT);

      expect(() => {
        journalEntry.commit();
      }).toThrow('Debits: 600, Credits: 500');
    });

    test('should throw error when journal entry is empty', () => {
      expect(() => {
        journalEntry.commit();
      }).toThrow(ERROR_MESSAGES.EMPTY_JOURNAL_ENTRY);
    });

    test('should throw error when only debits exist', () => {
      journalEntry.addEntry(expenseAccount, 100, ENTRY_TYPES.DEBIT);

      expect(() => {
        journalEntry.commit();
      }).toThrow(ERROR_MESSAGES.EMPTY_JOURNAL_ENTRY);
    });

    test('should throw error when only credits exist', () => {
      journalEntry.addEntry(cashAccount, 100, ENTRY_TYPES.CREDIT);

      expect(() => {
        journalEntry.commit();
      }).toThrow(ERROR_MESSAGES.EMPTY_JOURNAL_ENTRY);
    });

    test('should throw error when committing twice', () => {
      journalEntry.addEntry(cashAccount, 100, ENTRY_TYPES.CREDIT);
      journalEntry.addEntry(expenseAccount, 100, ENTRY_TYPES.DEBIT);

      journalEntry.commit();

      expect(() => {
        journalEntry.commit();
      }).toThrow('Journal entry has already been committed');
    });

    test('should handle complex multi-account transactions', () => {
      // Scenario: Purchase equipment with cash and loan
      const equipmentAccount = new Asset({ name: 'Equipment', balance: 0 });
      const loanAccount = new Liability({ name: 'Bank Loan', balance: 0 });
      const cash = new Asset({ name: 'Cash', balance: 5000 });

      const purchase = new JournalEntry({ description: 'Equipment Purchase' });
      purchase.addEntry(equipmentAccount, 10000, ENTRY_TYPES.DEBIT);
      purchase.addEntry(cash, 3000, ENTRY_TYPES.CREDIT);
      purchase.addEntry(loanAccount, 7000, ENTRY_TYPES.CREDIT);

      purchase.commit();

      expect(equipmentAccount.getBalance()).toBe(10000);
      expect(cash.getBalance()).toBe(2000);
      expect(loanAccount.getBalance()).toBe(7000);
    });
  });

  describe('getDetails method', () => {
    test('should return details of all entries', () => {
      const date = new Date('2025-04-27');
      const journalEntry = new JournalEntry({ description: 'Monthly Rent', date });
      const cashAccount = new Asset({ name: 'Cash', balance: 1000 });
      const expenseAccount = new Expense({ name: 'Rent Expense', balance: 0 });

      journalEntry.addEntry(cashAccount, 500, ENTRY_TYPES.CREDIT);
      journalEntry.addEntry(expenseAccount, 500, ENTRY_TYPES.DEBIT);

      const details = journalEntry.getDetails();

      expect(details).toHaveLength(2);
      expect(details[0]).toEqual({
        accountName: 'Cash',
        amount: 500,
        type: ENTRY_TYPES.CREDIT,
        date: date,
        description: 'Monthly Rent'
      });
      expect(details[1]).toEqual({
        accountName: 'Rent Expense',
        amount: 500,
        type: ENTRY_TYPES.DEBIT,
        date: date,
        description: 'Monthly Rent'
      });
    });

    test('should return empty array for empty journal entry', () => {
      const journalEntry = new JournalEntry({ description: 'Empty Entry' });
      expect(journalEntry.getDetails()).toEqual([]);
    });
  });

  describe('getEntries method', () => {
    test('should return a copy of entries array', () => {
      const journalEntry = new JournalEntry({ description: 'Test Entry' });
      const account = new Asset({ name: 'Cash', balance: 1000 });

      journalEntry.addEntry(account, 100, ENTRY_TYPES.DEBIT);

      const entries1 = journalEntry.getEntries();
      const entries2 = journalEntry.getEntries();

      // Should be different array instances
      expect(entries1).not.toBe(entries2);
      // But with same content
      expect(entries1).toEqual(entries2);
    });

    test('modifying returned array should not affect original', () => {
      const journalEntry = new JournalEntry({ description: 'Test Entry' });
      const account = new Asset({ name: 'Cash', balance: 1000 });

      journalEntry.addEntry(account, 100, ENTRY_TYPES.DEBIT);

      const entries = journalEntry.getEntries();
      entries.pop(); // Try to remove entry

      // Original should still have the entry
      expect(journalEntry.getEntryCount()).toBe(1);
    });
  });

  describe('Real-world scenarios', () => {
    test('should handle salary payment transaction', () => {
      const cash = new Asset({ name: 'Cash', balance: 10000 });
      const salaryExpense = new Expense({ name: 'Salary Expense', balance: 0 });

      const salaryPayment = new JournalEntry({ description: 'Monthly Salary Payment' });
      salaryPayment.addEntry(salaryExpense, 5000, ENTRY_TYPES.DEBIT);
      salaryPayment.addEntry(cash, 5000, ENTRY_TYPES.CREDIT);

      salaryPayment.commit();

      expect(cash.getBalance()).toBe(5000);
      expect(salaryExpense.getBalance()).toBe(5000);
    });

    test('should handle sales transaction', () => {
      const cash = new Asset({ name: 'Cash', balance: 1000 });
      const salesRevenue = new Income({ name: 'Sales Revenue', balance: 0 });

      const sale = new JournalEntry({ description: 'Product Sale' });
      sale.addEntry(cash, 250, ENTRY_TYPES.DEBIT);
      sale.addEntry(salesRevenue, 250, ENTRY_TYPES.CREDIT);

      sale.commit();

      expect(cash.getBalance()).toBe(1250);
      expect(salesRevenue.getBalance()).toBe(250);
    });
  });

  describe('Serialization with extra fields', () => {
    test('should serialize extra fields', () => {
      const journalEntry = new JournalEntry({
        description: 'Test Entry',
        department: 'Accounting',
        approvedBy: 'John Smith'
      });

      // We need accounts to serialize properly
      const cash = new Asset({ name: 'Cash', balance: 1000 });
      const expense = new Expense({ name: 'Expense', balance: 0 });

      // Add id to accounts for serialization
      (cash as any).id = 'acc-1';
      (expense as any).id = 'acc-2';

      journalEntry.addEntry(cash, 100, ENTRY_TYPES.CREDIT);
      journalEntry.addEntry(expense, 100, ENTRY_TYPES.DEBIT);

      const serialized = journalEntry.serialize();
      expect(serialized.description).toBe('Test Entry');
      expect(serialized.department).toBe('Accounting');
      expect(serialized.approvedBy).toBe('John Smith');
    });
  });
});
