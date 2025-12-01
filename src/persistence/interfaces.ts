/**
 * Interface for storage adapters (Memory, Firebase, SQL, etc.)
 */
export interface IAdapter {
    /**
     * Retrieve a single document by ID
     * @param collection The collection/table name
     * @param id The document ID
     */
    get<T = any>(collection: string, id: string): Promise<T | null>;

    /**
     * Save a document
     * @param collection The collection/table name
     * @param id The document ID (if null, a new ID should be generated)
     * @param data The data to save
     * @returns The ID of the saved document
     */
    save(collection: string, id: string | null, data: any): Promise<string>;

    /**
     * Delete a document
     * @param collection The collection/table name
     * @param id The document ID
     */
    delete(collection: string, id: string): Promise<void>;

    /**
     * Query documents
     * @param collection The collection/table name
     * @param filters Query filters
     */
    query<T = any>(collection: string, filters?: IQueryFilters): Promise<T[]>;

    /**
     * Delete multiple documents matching filters
     * @param collection The collection/table name
     * @param filters Query filters
     * @returns The number of documents deleted
     */
    deleteMany(collection: string, filters: IQueryFilters): Promise<number>;

    /**
     * Update multiple documents matching filters
     * @param collection The collection/table name
     * @param filters Query filters
     * @param data The data to update
     * @returns The number of documents updated
     */
    updateMany(collection: string, filters: IQueryFilters, data: any): Promise<number>;
}

/**
 * Supported comparison operators for queries
 * These operators are designed to be portable across different storage backends:
 * - Memory: Native JavaScript comparisons
 * - Firebase: Firestore query operators
 * - SQL: Translated to SQL WHERE clauses
 * - MongoDB: Translated to MongoDB query operators
 */
export type QueryOperator =
    | '=='      // Equality (all backends)
    | '!='      // Not equal (all backends)
    | '>'       // Greater than (all backends)
    | '>='      // Greater than or equal (all backends)
    | '<'       // Less than (all backends)
    | '<='      // Less than or equal (all backends)
    | 'in'      // Value in array (all backends)
    | 'not-in'  // Value not in array (all backends)
    | 'contains'      // Array contains value (Firebase: array-contains, SQL: JSON or JOIN, Mongo: $elemMatch)
    | 'startsWith'    // String starts with (Firebase: >= + <, SQL: LIKE 'x%', Mongo: $regex)
    | 'endsWith'      // String ends with (SQL: LIKE '%x', Mongo: $regex) - may require in-memory filter for Firebase
    | 'includes';     // String includes substring (SQL: LIKE '%x%', Mongo: $regex) - may require in-memory filter for Firebase

/**
 * A single filter condition
 */
export interface IWhereCondition {
    /** The field path to filter on (supports dot notation for nested fields) */
    field: string;
    /** The comparison operator */
    operator: QueryOperator;
    /** The value to compare against */
    value: any;
}

/**
 * Sort direction for query results
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort specification for query results
 */
export interface IOrderBy {
    /** The field path to sort by */
    field: string;
    /** Sort direction (ascending or descending) */
    direction: SortDirection;
}

/**
 * Advanced query filters for storage adapters
 *
 * @example Simple equality filter (backward compatible)
 * ```typescript
 * const filters = { name: 'Cash', type: 'ASSET' };
 * ```
 *
 * @example Advanced filters with operators
 * ```typescript
 * const filters = {
 *   $where: [
 *     { field: 'type', operator: '==', value: 'EXPENSE' },
 *     { field: 'balance.amount', operator: '>', value: 1000 },
 *     { field: 'date', operator: '>=', value: new Date('2024-01-01') }
 *   ],
 *   $orderBy: { field: 'date', direction: 'desc' },
 *   $limit: 50,
 *   $offset: 0
 * };
 * ```
 *
 * @example Filter journal entries by account and date range
 * ```typescript
 * const filters = {
 *   $where: [
 *     { field: 'entries.accountId', operator: 'contains', value: 'account-123' },
 *     { field: 'date', operator: '>=', value: startDate },
 *     { field: 'date', operator: '<=', value: endDate }
 *   ],
 *   $orderBy: { field: 'date', direction: 'desc' }
 * };
 * ```
 */
export interface IQueryFilters {
    /**
     * Advanced filter conditions using operators
     * Multiple conditions are combined with AND logic
     */
    $where?: IWhereCondition[];

    /** Sort specification for results */
    $orderBy?: IOrderBy;

    /** Maximum number of results to return */
    $limit?: number;

    /** Number of results to skip (for pagination) */
    $offset?: number;

    /**
     * Simple equality filters (backward compatible)
     * Any key not starting with $ is treated as a field === value filter
     */
    [key: string]: any;
}


/**
 * Interface for the static side of a persistable class
 */
export interface IPersistableStatic<T> {
    new(...args: any[]): T;
    findById(id: string): Promise<T | null>;
    findAll(filters?: IQueryFilters): Promise<T[]>;
    deleteMany(filters: IQueryFilters): Promise<number>;
    updateMany(filters: IQueryFilters, data: any): Promise<number>;
    collectionName: string;
}

/**
 * Interface for the instance side of a persistable class
 */
export interface IPersistable {
    id: string;
    save(): Promise<this>;
    delete(): Promise<void>;
}
