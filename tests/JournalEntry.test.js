import JournalEntry from '../src/classes/transactions/JournalEntry.js';
import Account from '../src/classes/accounts/Account.js';

describe('JournalEntry class', () => {
  test('should initialize with description and date', () => {
    const description = 'Test Journal Entry';
    const date = new Date('2025-04-27');
    const journalEntry = new JournalEntry(description, date);

    expect(journalEntry.description).toBe(description);
    expect(journalEntry.date).toEqual(date);
    expect(journalEntry.entries).toEqual([]);
  });

  test('addEntry should add a valid entry to the journal', () => {
    const account = new Account('Test Account', 1000, true);
    const journalEntry = new JournalEntry('Test Entry');

    journalEntry.addEntry(account, 500, 'debit');

    expect(journalEntry.entries).toHaveLength(1);
    expect(journalEntry.entries[0]).toEqual({
      account,
      amount: 500,
      type: 'debit',
    });
  });

  test('commit should apply transactions when debits and credits balance', () => {
    const cashAccount = new Account('Cash', 1000, true);
    const expenseAccount = new Account('Rent Expense', 0, true);
    const journalEntry = new JournalEntry('Rent Payment');

    journalEntry.addEntry(cashAccount, 500, 'credit');
    journalEntry.addEntry(expenseAccount, 500, 'debit');

    journalEntry.commit();

    expect(cashAccount.getBalance()).toBe(500);
    expect(expenseAccount.getBalance()).toBe(500);
  });

  test('commit should throw error when debits and credits do not balance', () => {
    const cashAccount = new Account('Cash', 1000, true);
    const expenseAccount = new Account('Rent Expense', 0, true);
    const journalEntry = new JournalEntry('Rent Payment');

    journalEntry.addEntry(cashAccount, 500, 'credit');
    journalEntry.addEntry(expenseAccount, 600, 'debit');

    expect(() => {
      journalEntry.commit();
    }).toThrow('Debits and credits must balance before committing a journal entry.');
  });
});