import { MemoryAdapter } from '../../src/persistence/adapters/MemoryAdapter';
import { IQueryFilters } from '../../src/persistence/interfaces';

describe('MemoryAdapter', () => {
    let adapter: MemoryAdapter;

    beforeEach(() => {
        adapter = new MemoryAdapter();
    });

    test('should save and retrieve data', async () => {
        const data = { name: 'Test Item' };
        const id = await adapter.save('items', null, data);

        expect(id).toBeDefined();

        const retrieved = await adapter.get('items', id);
        expect(retrieved).toEqual({ ...data, id });
    });

    test('should save with specific ID', async () => {
        const id = 'custom-id';
        const data = { name: 'Test Item' };
        await adapter.save('items', id, data);

        const retrieved = await adapter.get('items', id);
        expect(retrieved).toEqual({ ...data, id });
    });

    test('should return null for non-existent item', async () => {
        const retrieved = await adapter.get('items', 'non-existent');
        expect(retrieved).toBeNull();
    });

    test('should delete item', async () => {
        const id = await adapter.save('items', null, { name: 'To Delete' });
        await adapter.delete('items', id);

        const retrieved = await adapter.get('items', id);
        expect(retrieved).toBeNull();
    });

    test('should query items with simple filters (backward compatible)', async () => {
        await adapter.save('users', null, { name: 'Alice', role: 'admin' });
        await adapter.save('users', null, { name: 'Bob', role: 'user' });
        await adapter.save('users', null, { name: 'Charlie', role: 'user' });

        const admins = await adapter.query('users', { role: 'admin' });
        expect(admins).toHaveLength(1);
        expect(admins[0].name).toBe('Alice');

        const users = await adapter.query('users', { role: 'user' });
        expect(users).toHaveLength(2);
    });
});

describe('MemoryAdapter - Advanced Filters', () => {
    let adapter: MemoryAdapter;

    beforeEach(async () => {
        adapter = new MemoryAdapter();

        // Setup test data
        await adapter.save('accounts', 'acc-1', {
            name: 'Cash',
            type: 'ASSET',
            balance: { amount: 1000, currency: 'USD' }
        });
        await adapter.save('accounts', 'acc-2', {
            name: 'Bank Account',
            type: 'ASSET',
            balance: { amount: 5000, currency: 'USD' }
        });
        await adapter.save('accounts', 'acc-3', {
            name: 'Rent Expense',
            type: 'EXPENSE',
            balance: { amount: 500, currency: 'USD' }
        });
        await adapter.save('accounts', 'acc-4', {
            name: 'Sales Revenue',
            type: 'INCOME',
            balance: { amount: 3000, currency: 'USD' }
        });

        // Journal entries with dates
        await adapter.save('journal_entries', 'je-1', {
            description: 'Rent payment',
            date: new Date('2024-01-15'),
            entries: [{ accountId: 'acc-3' }, { accountId: 'acc-1' }]
        });
        await adapter.save('journal_entries', 'je-2', {
            description: 'Sales transaction',
            date: new Date('2024-02-20'),
            entries: [{ accountId: 'acc-1' }, { accountId: 'acc-4' }]
        });
        await adapter.save('journal_entries', 'je-3', {
            description: 'Bank transfer',
            date: new Date('2024-03-10'),
            entries: [{ accountId: 'acc-2' }, { accountId: 'acc-1' }]
        });
    });

    describe('Comparison operators', () => {
        test('$where with == operator', async () => {
            const filters: IQueryFilters = {
                $where: [{ field: 'type', operator: '==', value: 'ASSET' }]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(2);
            expect(results.every(r => r.type === 'ASSET')).toBe(true);
        });

        test('$where with != operator', async () => {
            const filters: IQueryFilters = {
                $where: [{ field: 'type', operator: '!=', value: 'ASSET' }]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(2);
            expect(results.every(r => r.type !== 'ASSET')).toBe(true);
        });

        test('$where with > operator', async () => {
            const filters: IQueryFilters = {
                $where: [{ field: 'balance.amount', operator: '>', value: 1000 }]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(2);
            expect(results.every(r => r.balance.amount > 1000)).toBe(true);
        });

        test('$where with >= operator', async () => {
            const filters: IQueryFilters = {
                $where: [{ field: 'balance.amount', operator: '>=', value: 1000 }]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(3);
        });

        test('$where with < operator', async () => {
            const filters: IQueryFilters = {
                $where: [{ field: 'balance.amount', operator: '<', value: 1000 }]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Rent Expense');
        });

        test('$where with <= operator', async () => {
            const filters: IQueryFilters = {
                $where: [{ field: 'balance.amount', operator: '<=', value: 1000 }]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(2);
        });
    });

    describe('Array operators', () => {
        test('$where with in operator', async () => {
            const filters: IQueryFilters = {
                $where: [{ field: 'type', operator: 'in', value: ['ASSET', 'INCOME'] }]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(3);
        });

        test('$where with not-in operator', async () => {
            const filters: IQueryFilters = {
                $where: [{ field: 'type', operator: 'not-in', value: ['ASSET', 'INCOME'] }]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(1);
            expect(results[0].type).toBe('EXPENSE');
        });
    });

    describe('String operators', () => {
        test('$where with startsWith operator', async () => {
            const filters: IQueryFilters = {
                $where: [{ field: 'name', operator: 'startsWith', value: 'Bank' }]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Bank Account');
        });

        test('$where with endsWith operator', async () => {
            const filters: IQueryFilters = {
                $where: [{ field: 'name', operator: 'endsWith', value: 'Expense' }]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Rent Expense');
        });

        test('$where with includes operator', async () => {
            const filters: IQueryFilters = {
                $where: [{ field: 'name', operator: 'includes', value: 'Account' }]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Bank Account');
        });
    });

    describe('Date range queries', () => {
        test('$where with date range', async () => {
            const filters: IQueryFilters = {
                $where: [
                    { field: 'date', operator: '>=', value: new Date('2024-02-01') },
                    { field: 'date', operator: '<=', value: new Date('2024-02-28') }
                ]
            };
            const results = await adapter.query('journal_entries', filters);
            expect(results).toHaveLength(1);
            expect(results[0].description).toBe('Sales transaction');
        });
    });

    describe('Sorting and pagination', () => {
        test('$orderBy ascending', async () => {
            const filters: IQueryFilters = {
                $orderBy: { field: 'balance.amount', direction: 'asc' }
            };
            const results = await adapter.query('accounts', filters);
            expect(results[0].balance.amount).toBe(500);
            expect(results[results.length - 1].balance.amount).toBe(5000);
        });

        test('$orderBy descending', async () => {
            const filters: IQueryFilters = {
                $orderBy: { field: 'balance.amount', direction: 'desc' }
            };
            const results = await adapter.query('accounts', filters);
            expect(results[0].balance.amount).toBe(5000);
            expect(results[results.length - 1].balance.amount).toBe(500);
        });

        test('$limit', async () => {
            const filters: IQueryFilters = {
                $orderBy: { field: 'balance.amount', direction: 'desc' },
                $limit: 2
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(2);
            expect(results[0].balance.amount).toBe(5000);
            expect(results[1].balance.amount).toBe(3000);
        });

        test('$offset', async () => {
            const filters: IQueryFilters = {
                $orderBy: { field: 'balance.amount', direction: 'desc' },
                $offset: 1
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(3);
            expect(results[0].balance.amount).toBe(3000);
        });

        test('$limit and $offset combined', async () => {
            const filters: IQueryFilters = {
                $orderBy: { field: 'balance.amount', direction: 'desc' },
                $offset: 1,
                $limit: 2
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(2);
            expect(results[0].balance.amount).toBe(3000);
            expect(results[1].balance.amount).toBe(1000);
        });
    });

    describe('Combined filters', () => {
        test('$where with simple filters combined', async () => {
            const filters: IQueryFilters = {
                type: 'ASSET',
                $where: [{ field: 'balance.amount', operator: '>', value: 2000 }]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Bank Account');
        });

        test('multiple $where conditions (AND logic)', async () => {
            const filters: IQueryFilters = {
                $where: [
                    { field: 'type', operator: '==', value: 'ASSET' },
                    { field: 'balance.amount', operator: '>=', value: 5000 }
                ]
            };
            const results = await adapter.query('accounts', filters);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Bank Account');
        });
    });
});
