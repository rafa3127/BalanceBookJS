import { Factory } from '../../src/persistence/Factory';
import { MemoryAdapter } from '../../src/persistence/adapters/MemoryAdapter';
import Account from '../../src/classes/accounts/Account';
import JournalEntry from '../../src/classes/transactions/JournalEntry';
import { ENTRY_TYPES } from '../../src/Constants';

describe('Persistence Integration', () => {
    let adapter: MemoryAdapter;
    let factory: Factory;
    let PersistableAccount: any;
    let PersistableJournalEntry: any;

    beforeEach(() => {
        adapter = new MemoryAdapter();
        factory = new Factory(adapter);
        const classes = factory.createClasses();
        PersistableAccount = classes.Account;
        PersistableJournalEntry = classes.JournalEntry;
    });

    test('should save and retrieve accounts with Money', async () => {
        const account = new PersistableAccount({ name: 'Savings', balance: 1000, isDebitPositive: true });
        await account.save();

        const retrieved = await PersistableAccount.findById(account.id);
        expect(retrieved).toBeDefined();
        expect(retrieved.name).toBe('Savings');
        expect(retrieved.getBalance()).toBe(1000);
        expect(retrieved.isDebitPositive).toBe(true);
    });

    test('should save and retrieve journal entries with account references', async () => {
        // Create and save accounts
        const debitAccount = new PersistableAccount({ name: 'Cash', balance: 1000, isDebitPositive: true });
        const creditAccount = new PersistableAccount({ name: 'Revenue', balance: 0, isDebitPositive: false });

        await debitAccount.save();
        await creditAccount.save();

        // Create journal entry
        const entry = new PersistableJournalEntry({ description: 'Sales', date: new Date() });
        entry.addEntry(debitAccount, 500, ENTRY_TYPES.DEBIT);
        entry.addEntry(creditAccount, 500, ENTRY_TYPES.CREDIT);
        entry.commit();

        // Save entry
        await entry.save();

        // Retrieve entry
        const retrievedEntry = await PersistableJournalEntry.findById(entry.id);
        expect(retrievedEntry).toBeDefined();
        expect(retrievedEntry.description).toBe('Sales');
        expect(retrievedEntry.committed).toBe(true);

        // Verify entries are hydrated
        const entries = retrievedEntry.getEntries();
        expect(entries).toHaveLength(2);
        expect(entries[0].account.id).toBe(debitAccount.id);
        const amount1 = entries[0].amount;
        const val1 = typeof amount1 === 'number' ? amount1 : amount1.toNumber();
        expect(val1).toBe(500);
        expect(entries[0].type).toBe(ENTRY_TYPES.DEBIT);

        expect(entries[1].account.id).toBe(creditAccount.id);
    });

    test('should preserve extra fields on journal entries through persistence', async () => {
        // Create and save accounts
        const cash = new PersistableAccount({ name: 'Cash', balance: 1000, isDebitPositive: true });
        const expense = new PersistableAccount({ name: 'Expense', balance: 0, isDebitPositive: true });

        await cash.save();
        await expense.save();

        // Create journal entry with extra fields
        const entry = new PersistableJournalEntry({
            description: 'Office Supplies',
            date: new Date(),
            department: 'Operations',
            approvedBy: 'Jane Doe'
        });
        entry.addEntry(expense, 100, ENTRY_TYPES.DEBIT);
        entry.addEntry(cash, 100, ENTRY_TYPES.CREDIT);
        entry.commit();

        await entry.save();

        const retrieved = await PersistableJournalEntry.findById(entry.id);
        expect(retrieved).toBeDefined();
        expect(retrieved.department).toBe('Operations');
        expect(retrieved.approvedBy).toBe('Jane Doe');
    });
});
