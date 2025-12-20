import { Factory } from '../../src/persistence/Factory';
import { MemoryAdapter } from '../../src/persistence/adapters/MemoryAdapter';
import Account from '../../src/classes/accounts/Account';

describe('Persistence Factory', () => {
    let adapter: MemoryAdapter;
    let factory: Factory;

    beforeEach(() => {
        adapter = new MemoryAdapter();
        factory = new Factory(adapter);
    });

    test('should create persistable classes', () => {
        const { Account: PersistableAccount } = factory.createClasses();
        expect(PersistableAccount).toBeDefined();
        expect(PersistableAccount.collectionName).toBe('accounts');
    });

    test('should save and retrieve persistable instances', async () => {
        const { Account: PersistableAccount } = factory.createClasses();

        const account = new PersistableAccount({ name: 'Test Account', balance: 1000, isDebitPositive: true });
        await account.save();

        expect(account.id).toBeDefined();

        const retrieved = await PersistableAccount.findById(account.id);
        expect(retrieved).toBeDefined();
        expect(retrieved!.id).toBe(account.id);
        // Note: We haven't implemented serialization yet, so properties might not be fully hydrated
        // depending on how the base class works. But the ID should match.
    });

    test('should find all instances', async () => {
        const { Account: PersistableAccount } = factory.createClasses();

        const acc1 = new PersistableAccount({ name: 'Acc 1', balance: 100, isDebitPositive: true });
        const acc2 = new PersistableAccount({ name: 'Acc 2', balance: 200, isDebitPositive: true });

        await acc1.save();
        await acc2.save();

        const all = await PersistableAccount.findAll();
        expect(all).toHaveLength(2);
    });

    test('should preserve extra fields through persistence', async () => {
        const { Account: PersistableAccount } = factory.createClasses();

        const account = new PersistableAccount({
            name: 'Test Account',
            balance: 1000,
            isDebitPositive: true,
            department: 'Sales',
            costCenter: 'CC-100'
        });
        await account.save();

        const retrieved = await PersistableAccount.findById(account.id);
        expect(retrieved).toBeDefined();
        expect((retrieved as any).department).toBe('Sales');
        expect((retrieved as any).costCenter).toBe('CC-100');
    });
});
