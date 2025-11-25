import { MemoryAdapter } from '../../src/persistence/adapters/MemoryAdapter';

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

    test('should query items', async () => {
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
