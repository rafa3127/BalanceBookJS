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
}

/**
 * Standard query filters
 */
export interface IQueryFilters {
    [key: string]: any;
}


/**
 * Interface for the static side of a persistable class
 */
export interface IPersistableStatic<T> {
    new(...args: any[]): T;
    findById(id: string): Promise<T | null>;
    findAll(filters?: IQueryFilters): Promise<T[]>;
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
