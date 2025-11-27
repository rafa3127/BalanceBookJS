import { MemoryAdapter } from '../../src/persistence/adapters/MemoryAdapter';
import { Factory } from '../../src/persistence/Factory';
import Account from '../../src/classes/accounts/Account';

describe('Bulk Operations', () => {
    let adapter: MemoryAdapter;
    let factory: Factory;
    let PersistableAccount: any;

    beforeEach(() => {
        adapter = new MemoryAdapter();
        factory = new Factory(adapter);
        const classes = factory.createClasses();
        PersistableAccount = classes.Account;
    });

    test('deleteMany should remove matching documents', async () => {
        // Create 3 accounts
        const acc1 = new PersistableAccount('Acc1', 100);
        const acc2 = new PersistableAccount('Acc2', 200);
        const acc3 = new PersistableAccount('Acc3', 300);

        await acc1.save();
        await acc2.save();
        await acc3.save();

        // Delete account with name 'Acc2'
        const deletedCount = await PersistableAccount.deleteMany({ name: 'Acc2' });

        expect(deletedCount).toBe(1);

        const all = await PersistableAccount.findAll();
        expect(all.length).toBe(2);
        expect(all.find((a: any) => a.name === 'Acc2')).toBeUndefined();
    });

    test('updateMany should update matching documents', async () => {
        // Create 3 accounts
        const acc1 = new PersistableAccount('Acc1', 100);
        const acc2 = new PersistableAccount('Acc2', 100);
        const acc3 = new PersistableAccount('Acc3', 300);

        await acc1.save();
        await acc2.save();
        await acc3.save();

        // Update accounts with name 'Acc1' or 'Acc2' (simulated by separate updates or just one common field)
        // Since MemoryAdapter query is simple AND, let's use a common field if possible.
        // Account doesn't have many common fields we can easily query that distinguish these two from acc3 easily without complex logic.
        // Let's just update 'Acc1'.

        const updatedCount = await PersistableAccount.updateMany({ name: 'Acc1' }, { name: 'UpdatedAcc1' });

        expect(updatedCount).toBe(1);

        const all = await PersistableAccount.findAll();
        const updated = all.find((a: any) => a.name === 'UpdatedAcc1');
        expect(updated).toBeDefined();
        expect(updated.id).toBe(acc1.id);
    });
});
