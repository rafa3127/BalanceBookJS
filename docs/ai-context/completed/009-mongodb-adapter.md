# Improvement: MongoDB Adapter

## AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature. This adapter provides native MongoDB support with full `IQueryFilters` compatibility without requiring in-memory filtering.

## Overview
**Priority**: Medium
**Category**: Feature
**Complexity**: Medium
**Breaking Change**: No (additive feature)
**Status**: Completed (v2.4.0)

### Brief Description
Implement a MongoDBAdapter that leverages MongoDB's native query capabilities to support all `IQueryFilters` operators without in-memory filtering. MongoDB's regex support, dot notation, and flexible querying make it an ideal match for the `IQueryFilters` interface.

### Why MongoDB?
MongoDB natively supports all operators defined in `IQueryFilters`:

| IQueryFilters | MongoDB | Notes |
|---------------|---------|-------|
| `==` | `$eq` | Native |
| `!=` | `$ne` | Native |
| `>`, `>=`, `<`, `<=` | `$gt`, `$gte`, `$lt`, `$lte` | Native |
| `in` | `$in` | Native |
| `not-in` | `$nin` | Native |
| `contains` | `$elemMatch` / direct query | Native for arrays |
| `startsWith` | `$regex: /^value/` | Native |
| `endsWith` | `$regex: /value$/` | Native (Firestore can't do this) |
| `includes` | `$regex: /value/` | Native (Firestore can't do this) |

**Key advantages over Firestore:**
- No in-memory filtering needed for `endsWith` and `includes`
- No iterative pagination workarounds
- No composite index requirements
- Native dot notation support
- Native `skip()` and `limit()`

## Success Criteria
- [x] Full `IQueryFilters` support with native MongoDB queries
- [x] All operators translated to MongoDB query operators
- [x] Dot notation support for nested fields
- [x] Sorting with `$orderBy`
- [x] Pagination with `$limit` and `$offset` (skip)
- [x] CRUD operations (get, save, delete, query)
- [x] Bulk operations (deleteMany, updateMany)
- [x] Support for MongoDB driver (Mongoose not needed - lighter weight)
- [x] Dependency injection pattern (pass existing client/connection)

## Technical Design

### Dependencies
```json
{
  "peerDependencies": {
    "mongodb": "^6.0.0"
  }
}
```

### Adapter Implementation

```typescript
import { IAdapter, IQueryFilters, IWhereCondition, QueryOperator } from '../../interfaces.ts';
import { MongoClient, Db, Collection, Filter, Sort } from 'mongodb';

export interface MongoDBConfig {
    uri: string;
    dbName: string;
    options?: any;
}

export class MongoDBAdapter implements IAdapter {
    private db: Db;
    private client: MongoClient | null = null;

    /**
     * Create a MongoDBAdapter
     * @param configOrDb - Either a MongoDBConfig object or an already connected Db instance
     */
    constructor(configOrDb: MongoDBConfig | Db) {
        if ('collection' in configOrDb && typeof configOrDb.collection === 'function') {
            // Dependency injection: already connected Db instance
            this.db = configOrDb as Db;
        } else {
            // Will connect lazily or require explicit connect() call
            throw new Error('For config-based initialization, use MongoDBAdapter.connect()');
        }
    }

    /**
     * Static factory method for config-based initialization
     */
    static async connect(config: MongoDBConfig): Promise<MongoDBAdapter> {
        const client = new MongoClient(config.uri, config.options);
        await client.connect();
        const db = client.db(config.dbName);
        const adapter = new MongoDBAdapter(db);
        adapter.client = client;
        return adapter;
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
        }
    }

    private getCollection(name: string): Collection {
        return this.db.collection(name);
    }

    async get<T = any>(collection: string, id: string): Promise<T | null> {
        const result = await this.getCollection(collection).findOne({ _id: id as any });
        if (!result) return null;
        return this.transformFromMongo(result) as T;
    }

    async save(collection: string, id: string | null, data: any): Promise<string> {
        const col = this.getCollection(collection);
        const cleanData = this.sanitizeData(data);

        if (id) {
            await col.updateOne(
                { _id: id as any },
                { $set: cleanData },
                { upsert: true }
            );
            return id;
        } else {
            // Generate ID if not provided
            const newId = data.id || this.generateId();
            await col.insertOne({ _id: newId as any, ...cleanData });
            return newId;
        }
    }

    async delete(collection: string, id: string): Promise<void> {
        await this.getCollection(collection).deleteOne({ _id: id as any });
    }

    async query<T = any>(collection: string, filters?: IQueryFilters): Promise<T[]> {
        const col = this.getCollection(collection);

        // Build MongoDB filter
        const mongoFilter = this.buildMongoFilter(filters);

        // Build query
        let cursor = col.find(mongoFilter);

        // Apply sorting
        if (filters?.$orderBy) {
            const sortDirection = filters.$orderBy.direction === 'desc' ? -1 : 1;
            cursor = cursor.sort({ [filters.$orderBy.field]: sortDirection } as Sort);
        }

        // Apply pagination
        if (filters?.$offset) {
            cursor = cursor.skip(filters.$offset);
        }

        if (filters?.$limit) {
            cursor = cursor.limit(filters.$limit);
        }

        const results = await cursor.toArray();
        return results.map(doc => this.transformFromMongo(doc)) as T[];
    }

    async deleteMany(collection: string, filters: IQueryFilters): Promise<number> {
        const mongoFilter = this.buildMongoFilter(filters);
        const result = await this.getCollection(collection).deleteMany(mongoFilter);
        return result.deletedCount;
    }

    async updateMany(collection: string, filters: IQueryFilters, data: any): Promise<number> {
        const mongoFilter = this.buildMongoFilter(filters);
        const cleanData = this.sanitizeData(data);
        const result = await this.getCollection(collection).updateMany(
            mongoFilter,
            { $set: cleanData }
        );
        return result.modifiedCount;
    }

    /**
     * Build MongoDB filter from IQueryFilters
     */
    private buildMongoFilter(filters?: IQueryFilters): Filter<any> {
        if (!filters) return {};

        const mongoFilter: any = {};

        // Process $where conditions
        if (filters.$where && Array.isArray(filters.$where)) {
            for (const condition of filters.$where) {
                const mongoCondition = this.translateCondition(condition);

                // Merge conditions for the same field
                if (mongoFilter[condition.field]) {
                    Object.assign(mongoFilter[condition.field], mongoCondition[condition.field]);
                } else {
                    Object.assign(mongoFilter, mongoCondition);
                }
            }
        }

        // Process simple equality filters (backward compatible)
        const simpleFilters = Object.entries(filters).filter(
            ([key]) => !key.startsWith('$')
        );
        for (const [key, value] of simpleFilters) {
            mongoFilter[key] = value;
        }

        return mongoFilter;
    }

    /**
     * Translate IWhereCondition to MongoDB query operator
     */
    private translateCondition(condition: IWhereCondition): any {
        const { field, operator, value } = condition;

        switch (operator) {
            case '==':
                return { [field]: { $eq: value } };

            case '!=':
                return { [field]: { $ne: value } };

            case '>':
                return { [field]: { $gt: value } };

            case '>=':
                return { [field]: { $gte: value } };

            case '<':
                return { [field]: { $lt: value } };

            case '<=':
                return { [field]: { $lte: value } };

            case 'in':
                return { [field]: { $in: value } };

            case 'not-in':
                return { [field]: { $nin: value } };

            case 'contains':
                // For arrays: check if array contains value
                return { [field]: value };

            case 'startsWith':
                return { [field]: { $regex: `^${this.escapeRegex(value)}`, $options: '' } };

            case 'endsWith':
                return { [field]: { $regex: `${this.escapeRegex(value)}$`, $options: '' } };

            case 'includes':
                return { [field]: { $regex: this.escapeRegex(value), $options: '' } };

            default:
                throw new Error(`Unsupported operator: ${operator}`);
        }
    }

    /**
     * Escape special regex characters
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Transform MongoDB document to application format
     */
    private transformFromMongo(doc: any): any {
        if (!doc) return null;
        const { _id, ...rest } = doc;
        return { id: _id, ...rest };
    }

    /**
     * Sanitize data for MongoDB
     */
    private sanitizeData(data: any): any {
        if (data === undefined) return null;
        if (data === null) return null;

        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeData(item));
        }

        if (data instanceof Date) {
            return data;
        }

        if (typeof data === 'object') {
            const result: any = {};
            for (const key in data) {
                if (key !== 'id') { // Don't duplicate id
                    const value = this.sanitizeData(data[key]);
                    if (value !== undefined) {
                        result[key] = value;
                    }
                }
            }
            return result;
        }

        return data;
    }

    /**
     * Generate a unique ID
     */
    private generateId(): string {
        return new ObjectId().toString();
    }
}
```

### Usage Examples

```typescript
import { Factory, MongoDBAdapter } from 'balance-book-js/persistence';
import { MongoClient } from 'mongodb';

// Option 1: Config-based (adapter manages connection)
const adapter = await MongoDBAdapter.connect({
    uri: 'mongodb://localhost:27017',
    dbName: 'accounting'
});

// Option 2: Dependency injection (you manage connection)
const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const db = client.db('accounting');
const adapter = new MongoDBAdapter(db);

// Create factory and classes
const factory = new Factory(adapter);
const { Account, Asset, JournalEntry } = factory.createClasses();

// Use with full IQueryFilters support - ALL NATIVE, NO IN-MEMORY FILTERING
const results = await Account.findAll({
    $where: [
        { field: 'type', operator: '==', value: 'ASSET' },
        { field: 'name', operator: 'includes', value: 'Cash' },  // Native regex!
        { field: 'name', operator: 'endsWith', value: 'Account' }, // Native regex!
        { field: 'balance.amount', operator: '>=', value: 1000 }
    ],
    $orderBy: { field: 'name', direction: 'asc' },
    $limit: 10,
    $offset: 20
});

// Find transactions by account (native array query)
const transactions = await JournalEntry.findAll({
    $where: [
        { field: 'entries.accountId', operator: 'contains', value: 'account-123' }
    ]
});

// Clean up
await adapter.disconnect();
```

## Implementation Steps

### Phase 1: Core Implementation
1. [x] Create `src/persistence/adapters/mongodb/MongoDBAdapter.ts`
2. [x] Create `src/persistence/adapters/mongodb/config.ts`
3. [x] Implement CRUD operations (get, save, delete)
4. [x] Implement query with full IQueryFilters translation
5. [x] Implement bulk operations (deleteMany, updateMany)

### Phase 2: Testing
6. [x] Unit tests with mongodb-memory-server
7. [x] Test all IQueryFilters operators
8. [x] Test dot notation for nested fields
9. [x] Test pagination (skip/limit)
10. [x] Test sorting
11. [ ] Integration tests with real MongoDB (manual testing recommended)

### Phase 3: Documentation & Export
12. [x] Add to persistence/index.ts exports
13. [x] Update README.md with MongoDB examples
14. [x] Add to adapter comparison documentation

## Test Cases

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('MongoDBAdapter', () => {
    let mongoServer: MongoMemoryServer;
    let adapter: MongoDBAdapter;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        adapter = await MongoDBAdapter.connect({
            uri: mongoServer.getUri(),
            dbName: 'test'
        });
    });

    afterAll(async () => {
        await adapter.disconnect();
        await mongoServer.stop();
    });

    describe('IQueryFilters operators', () => {
        it('should handle startsWith with regex', async () => {
            // Setup test data
            await adapter.save('accounts', '1', { name: 'Cash on Hand', type: 'ASSET' });
            await adapter.save('accounts', '2', { name: 'Cash in Bank', type: 'ASSET' });
            await adapter.save('accounts', '3', { name: 'Petty Cash', type: 'ASSET' });

            const results = await adapter.query('accounts', {
                $where: [{ field: 'name', operator: 'startsWith', value: 'Cash' }]
            });

            expect(results).toHaveLength(2);
            expect(results.map(r => r.name)).toContain('Cash on Hand');
            expect(results.map(r => r.name)).toContain('Cash in Bank');
        });

        it('should handle endsWith with regex', async () => {
            const results = await adapter.query('accounts', {
                $where: [{ field: 'name', operator: 'endsWith', value: 'Cash' }]
            });

            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Petty Cash');
        });

        it('should handle includes with regex', async () => {
            const results = await adapter.query('accounts', {
                $where: [{ field: 'name', operator: 'includes', value: 'Cash' }]
            });

            expect(results).toHaveLength(3); // All contain "Cash"
        });

        it('should handle dot notation for nested fields', async () => {
            await adapter.save('accounts', '4', {
                name: 'Savings',
                type: 'ASSET',
                balance: { amount: 5000, currency: 'USD' }
            });

            const results = await adapter.query('accounts', {
                $where: [{ field: 'balance.amount', operator: '>=', value: 1000 }]
            });

            expect(results.some(r => r.name === 'Savings')).toBe(true);
        });

        it('should handle array contains for entries', async () => {
            await adapter.save('journal_entries', 'je1', {
                description: 'Test entry',
                entries: [
                    { accountId: 'acc-1', amount: 100, type: 'debit' },
                    { accountId: 'acc-2', amount: 100, type: 'credit' }
                ]
            });

            const results = await adapter.query('journal_entries', {
                $where: [{ field: 'entries.accountId', operator: 'contains', value: 'acc-1' }]
            });

            expect(results).toHaveLength(1);
        });
    });

    describe('Pagination', () => {
        it('should handle skip and limit natively', async () => {
            // Create 20 accounts
            for (let i = 0; i < 20; i++) {
                await adapter.save('accounts', `acc-${i}`, { name: `Account ${i}` });
            }

            const results = await adapter.query('accounts', {
                $orderBy: { field: 'name', direction: 'asc' },
                $offset: 5,
                $limit: 10
            });

            expect(results).toHaveLength(10);
        });
    });
});
```

## Comparison with Other Adapters

| Feature | MemoryAdapter | FirebaseAdapter | MongoDBAdapter | SQLAdapter |
|---------|---------------|-----------------|----------------|------------|
| `startsWith` | ✅ In-memory | ⚠️ >= < hack | ✅ Native regex | ✅ LIKE |
| `endsWith` | ✅ In-memory | ❌ In-memory | ✅ Native regex | ✅ LIKE |
| `includes` | ✅ In-memory | ❌ In-memory | ✅ Native regex | ✅ LIKE |
| Dot notation | ✅ Implemented | ✅ Native | ✅ Native | ⚠️ Column mapping |
| Skip/Offset | ✅ In-memory | ⚠️ In-memory | ✅ Native | ✅ Native |
| Composite indexes | N/A | Required | Optional | Required |
| Transactions | N/A | ✅ Batches | ✅ Sessions | ✅ Native |

## Notes

- MongoDB is ideal for MVPs and applications that prioritize query flexibility
- For strict financial compliance, consider SQLAdapter with relational schema
- The adapter uses mongodb driver directly (not Mongoose) for lighter weight
- Supports both connection management and dependency injection patterns

## Related Improvements
- 008-sql-adapter-relational-schema.md - Alternative for strict ACID requirements
