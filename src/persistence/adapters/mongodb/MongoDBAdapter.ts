import { IAdapter, IQueryFilters, IWhereCondition } from '../../interfaces.ts';
import { MongoDBConfig } from './config.ts';

// MongoDB types - defined locally to avoid requiring mongodb at compile time
// The actual mongodb package is a peer dependency
interface MongoDb {
    collection(name: string): MongoCollection;
}

interface MongoCollection {
    findOne(filter: any): Promise<any>;
    find(filter: any): MongoCursor;
    insertOne(doc: any): Promise<any>;
    updateOne(filter: any, update: any, options?: any): Promise<any>;
    deleteOne(filter: any): Promise<any>;
    deleteMany(filter: any): Promise<{ deletedCount: number }>;
    updateMany(filter: any, update: any): Promise<{ modifiedCount: number }>;
}

interface MongoCursor {
    sort(spec: any): MongoCursor;
    skip(n: number): MongoCursor;
    limit(n: number): MongoCursor;
    toArray(): Promise<any[]>;
}

interface MongoClientType {
    connect(): Promise<void>;
    close(): Promise<void>;
    db(name: string): MongoDb;
}

/**
 * MongoDB storage adapter with native query support
 *
 * This adapter leverages MongoDB's native query capabilities to support
 * all IQueryFilters operators without requiring in-memory filtering.
 *
 * Key advantages over FirebaseAdapter:
 * - Native regex support for startsWith, endsWith, includes
 * - Native skip() and limit() for pagination
 * - No composite index requirements
 * - Native dot notation for nested fields
 *
 * @example Config-based initialization (adapter manages connection)
 * ```typescript
 * const adapter = await MongoDBAdapter.connect({
 *     uri: 'mongodb://localhost:27017',
 *     dbName: 'accounting'
 * });
 * ```
 *
 * @example Dependency injection (you manage connection)
 * ```typescript
 * const client = new MongoClient('mongodb://localhost:27017');
 * await client.connect();
 * const db = client.db('accounting');
 * const adapter = new MongoDBAdapter(db);
 * ```
 */
export class MongoDBAdapter implements IAdapter {
    private db: MongoDb;
    private client: MongoClientType | null = null;

    /**
     * Create a MongoDBAdapter with an existing database connection
     * For config-based initialization, use the static connect() method
     * @param db An already connected MongoDB Db instance
     */
    constructor(db: MongoDb) {
        this.db = db;
    }

    /**
     * Static factory method for config-based initialization
     * This method manages the MongoDB client connection
     * @param config MongoDB connection configuration
     * @returns A connected MongoDBAdapter instance
     */
    static async connect(config: MongoDBConfig): Promise<MongoDBAdapter> {
        // Dynamic import to avoid requiring mongodb at module load time
        // Using a variable to prevent TypeScript from trying to resolve the module
        const mongodbModule = 'mongodb';
        const { MongoClient } = await import(/* webpackIgnore: true */ mongodbModule);

        const client = new MongoClient(config.uri, config.options);
        await client.connect();
        const db = client.db(config.dbName);
        const adapter = new MongoDBAdapter(db as MongoDb);
        adapter.client = client as MongoClientType;
        return adapter;
    }

    /**
     * Disconnect from MongoDB
     * Only needed if the adapter was created via connect()
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
    }

    /**
     * Get a collection by name
     */
    private getCollection(name: string): MongoCollection {
        return this.db.collection(name);
    }

    /**
     * Retrieve a single document by ID
     */
    async get<T = any>(collection: string, id: string): Promise<T | null> {
        const result = await this.getCollection(collection).findOne({ _id: id as any });
        if (!result) return null;
        return this.transformFromMongo(result) as T;
    }

    /**
     * Save a document (insert or update)
     */
    async save(collection: string, id: string | null, data: any): Promise<string> {
        const col = this.getCollection(collection);
        const cleanData = this.sanitizeData(data);

        if (id) {
            // Upsert: update if exists, insert if not
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

    /**
     * Delete a document by ID
     */
    async delete(collection: string, id: string): Promise<void> {
        await this.getCollection(collection).deleteOne({ _id: id as any });
    }

    /**
     * Query documents with full IQueryFilters support
     * All filtering is done natively by MongoDB
     */
    async query<T = any>(collection: string, filters?: IQueryFilters): Promise<T[]> {
        const col = this.getCollection(collection);

        // Build MongoDB filter
        const mongoFilter = this.buildMongoFilter(filters);

        // Build query cursor
        let cursor = col.find(mongoFilter);

        // Apply sorting
        if (filters?.$orderBy) {
            const sortDirection = filters.$orderBy.direction === 'desc' ? -1 : 1;
            cursor = cursor.sort({ [filters.$orderBy.field]: sortDirection });
        }

        // Apply pagination - native MongoDB skip/limit
        if (filters?.$offset) {
            cursor = cursor.skip(filters.$offset);
        }

        if (filters?.$limit) {
            cursor = cursor.limit(filters.$limit);
        }

        const results = await cursor.toArray();
        return results.map(doc => this.transformFromMongo(doc)) as T[];
    }

    /**
     * Delete multiple documents matching filters
     */
    async deleteMany(collection: string, filters: IQueryFilters): Promise<number> {
        const mongoFilter = this.buildMongoFilter(filters);
        const result = await this.getCollection(collection).deleteMany(mongoFilter);
        return result.deletedCount;
    }

    /**
     * Update multiple documents matching filters
     */
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
    private buildMongoFilter(filters?: IQueryFilters): Record<string, any> {
        if (!filters) return {};

        const mongoFilter: any = {};

        // Process $where conditions (advanced filters)
        if (filters.$where && Array.isArray(filters.$where)) {
            for (const condition of filters.$where) {
                const mongoCondition = this.translateCondition(condition);

                // Merge conditions for the same field
                const fieldName = condition.field;
                if (mongoFilter[fieldName]) {
                    // If both are objects, merge them (e.g., { $gte: 10 } and { $lte: 100 })
                    if (typeof mongoFilter[fieldName] === 'object' && typeof mongoCondition[fieldName] === 'object') {
                        Object.assign(mongoFilter[fieldName], mongoCondition[fieldName]);
                    } else {
                        // Convert to $and if needed
                        if (!mongoFilter.$and) {
                            mongoFilter.$and = [];
                        }
                        mongoFilter.$and.push(mongoCondition);
                    }
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
                // MongoDB handles this natively - if field is an array, { field: value } matches if value is in array
                return { [field]: value };

            case 'startsWith':
                // Native regex - much more efficient than Firebase's >= < hack
                return { [field]: { $regex: `^${this.escapeRegex(value)}`, $options: '' } };

            case 'endsWith':
                // Native regex - Firebase can't do this natively
                return { [field]: { $regex: `${this.escapeRegex(value)}$`, $options: '' } };

            case 'includes':
                // Native regex - Firebase can't do this natively
                return { [field]: { $regex: this.escapeRegex(value), $options: '' } };

            default:
                throw new Error(`Unsupported operator: ${operator}`);
        }
    }

    /**
     * Escape special regex characters to prevent injection
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Transform MongoDB document to application format
     * Converts _id to id
     */
    private transformFromMongo(doc: any): any {
        if (!doc) return null;
        const { _id, ...rest } = doc;
        return { id: _id, ...rest };
    }

    /**
     * Sanitize data for MongoDB storage
     * Removes id field (stored as _id), handles nested objects and arrays
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
                // Don't duplicate id - it's stored as _id
                if (key !== 'id') {
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
     * Generate a unique ID using crypto.randomUUID
     */
    private generateId(): string {
        return crypto.randomUUID();
    }
}
