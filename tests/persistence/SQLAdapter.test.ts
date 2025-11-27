import { SQLAdapter } from '../../src/persistence/adapters/sql/SQLAdapter';
import knex from 'knex';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DB_FILE = path.join(__dirname, 'test.sqlite');

describe('SQLAdapter (SQLite)', () => {
    let adapter: SQLAdapter;
    let db: any;

    beforeAll(async () => {
        // Remove existing test db if any
        if (fs.existsSync(TEST_DB_FILE)) {
            fs.unlinkSync(TEST_DB_FILE);
        }

        // Setup SQLite DB using file
        db = knex({
            client: 'sqlite3',
            connection: {
                filename: TEST_DB_FILE
            },
            useNullAsDefault: true
        });

        // Create a test table
        await db.schema.createTable('users', (table: any) => {
            table.string('id').primary();
            table.string('name');
            table.string('role');
            table.integer('age');
        });

        // Initialize adapter with the same config
        adapter = new SQLAdapter({
            client: 'sqlite3',
            connection: {
                filename: TEST_DB_FILE
            },
            useNullAsDefault: true
        });
    });

    afterAll(async () => {
        await db.destroy();
        // Allow some time for file handle release
        await new Promise(resolve => setTimeout(resolve, 100));
        if (fs.existsSync(TEST_DB_FILE)) {
            fs.unlinkSync(TEST_DB_FILE);
        }
    });

    beforeEach(async () => {
        // Clear table before each test
        await db('users').truncate();
    });

    test('save should create new record', async () => {
        const id = await adapter.save('users', '1', { name: 'John', age: 30 });

        const result = await db('users').where('id', '1').first();
        expect(result).toEqual({ id: '1', name: 'John', age: 30, role: null });
        expect(id).toBe('1');
    });

    test('save should update existing record', async () => {
        await db('users').insert({ id: '1', name: 'John', age: 30 });

        const id = await adapter.save('users', '1', { name: 'Jane' });

        const result = await db('users').where('id', '1').first();
        expect(result).toEqual({ id: '1', name: 'Jane', age: 30, role: null });
        expect(id).toBe('1');
    });

    test('get should retrieve record', async () => {
        await db('users').insert({ id: '1', name: 'John', age: 30 });

        const result = await adapter.get('users', '1');
        expect(result).toEqual({ id: '1', name: 'John', age: 30, role: null });
    });

    test('get should return null if not found', async () => {
        const result = await adapter.get('users', '999');
        expect(result).toBeNull();
    });

    test('delete should remove record', async () => {
        await db('users').insert({ id: '1', name: 'John' });

        await adapter.delete('users', '1');

        const result = await db('users').where('id', '1').first();
        expect(result).toBeUndefined();
    });

    test('query should filter records', async () => {
        await db('users').insert([
            { id: '1', name: 'John', role: 'admin' },
            { id: '2', name: 'Jane', role: 'user' },
            { id: '3', name: 'Bob', role: 'admin' }
        ]);

        const results = await adapter.query('users', { role: 'admin' });
        expect(results).toHaveLength(2);
        expect(results.map((r: any) => r.name).sort()).toEqual(['Bob', 'John']);
    });

    test('deleteMany should remove matching records', async () => {
        await db('users').insert([
            { id: '1', name: 'John', role: 'admin' },
            { id: '2', name: 'Jane', role: 'user' },
            { id: '3', name: 'Bob', role: 'admin' }
        ]);

        const count = await adapter.deleteMany('users', { role: 'admin' });

        expect(count).toBe(2);
        const remaining = await db('users').select();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].name).toBe('Jane');
    });

    test('updateMany should update matching records', async () => {
        await db('users').insert([
            { id: '1', name: 'John', role: 'admin' },
            { id: '2', name: 'Jane', role: 'user' },
            { id: '3', name: 'Bob', role: 'admin' }
        ]);

        const count = await adapter.updateMany('users', { role: 'admin' }, { role: 'superadmin' });

        expect(count).toBe(2);
        const admins = await db('users').where('role', 'superadmin');
        expect(admins).toHaveLength(2);
        const user = await db('users').where('role', 'user').first();
        expect(user.name).toBe('Jane');
    });
});
