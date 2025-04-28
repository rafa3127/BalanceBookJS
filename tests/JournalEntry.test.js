import JournalEntry from '../src/classes/transactions/JournalEntry.js';
import Account from '../src/classes/accounts/Account.js';

describe('JournalEntry class', () => {
  // Initialization test
  test('should initialize with description and date', () => {
    const description = 'Test Journal Entry';
    const date = new Date('2023-01-01');
    
    const journalEntry = new JournalEntry(description, date);
    
    expect(journalEntry.description).toBe(description);
    expect(journalEntry.date).toEqual(date);
    expect(journalEntry.entries).toEqual([]);
  });

  // Initialization test with default date
  test('should initialize with current date when no date is provided', () => {
    const journalEntry = new JournalEntry('Test Entry');
    
    expect(journalEntry.date).toBeInstanceOf(Date);
    // Verificamos que la fecha sea cercana a la actual (en los últimos 10 segundos)
    const now = new Date();
    const differenceInMs = now - journalEntry.date;
    expect(differenceInMs).toBeLessThan(10000);
  });

  // Test for addEntry method
  test('addEntry should add a valid entry to the journal', () => {
    const account = new Account('Test Account', 1000, true);
    const journalEntry = new JournalEntry('Test Entry');
    
    journalEntry.addEntry(account, 500, 'debit');
    
    expect(journalEntry.entries).toHaveLength(1);
    expect(journalEntry.entries[0]).toEqual({
      account,
      amount: 500,
      type: 'debit'
    });
  });

  // Test to validate that addEntry rejects invalid accounts
  test('addEntry should throw an error for invalid accounts', () => {
    const journalEntry = new JournalEntry('Test Entry');
    
    expect(() => {
      journalEntry.addEntry(null, 500, 'debit');
    }).toThrow('Invalid account passed to JournalEntry.');
    
    expect(() => {
      journalEntry.addEntry({}, 500, 'debit');
    }).toThrow('Invalid account passed to JournalEntry.');
  });

  // Test for commit method when entries are balanced
  test('commit should apply transactions when debits and credits balance', () => {
    const cashAccount = new Account('Cash', 1000, true);
    const expenseAccount = new Account('Rent Expense', 0, true);
    const journalEntry = new JournalEntry('Rent Payment');
    
    journalEntry.addEntry(cashAccount, 500, 'credit');
    journalEntry.addEntry(expenseAccount, 500, 'debit');
    
    journalEntry.commit();
    
    expect(cashAccount.getBalance()).toBe(500); // 1000 - 500
    expect(expenseAccount.getBalance()).toBe(500); // 0 + 500
  });

  // Test for commit method when entries are not balanced
  test('commit should throw error when debits and credits do not balance', () => {
    const cashAccount = new Account('Cash', 1000, true);
    const expenseAccount = new Account('Rent Expense', 0, true);
    const journalEntry = new JournalEntry('Rent Payment');
    
    journalEntry.addEntry(cashAccount, 500, 'credit');
    journalEntry.addEntry(expenseAccount, 600, 'debit');
    
    expect(() => {
      journalEntry.commit();
    }).toThrow('Debits and credits must balance before committing a journal entry.');
    
    // Verify that no changes were applied
    expect(cashAccount.getBalance()).toBe(1000);
    expect(expenseAccount.getBalance()).toBe(0);
  });

  // Test for getDetails method
  test('getDetails should return formatted details of all entries', () => {
    const cashAccount = new Account('Cash', 1000, true);
    const expenseAccount = new Account('Rent Expense', 0, true);
    const description = 'Rent Payment';
    const date = new Date('2023-01-01');
    const journalEntry = new JournalEntry(description, date);
    
    journalEntry.addEntry(cashAccount, 500, 'credit');
    journalEntry.addEntry(expenseAccount, 500, 'debit');
    
    const details = journalEntry.getDetails();
    
    expect(details).toHaveLength(2);
    expect(details[0]).toEqual({
      accountName: 'Cash',
      amount: 500,
      type: 'credit',
      date,
      description
    });
    expect(details[1]).toEqual({
      accountName: 'Rent Expense',
      amount: 500,
      type: 'debit',
      date,
      description
    });
  });
});
