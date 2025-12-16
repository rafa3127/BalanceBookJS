/**
 * MongoDB adapter configuration
 */
export interface MongoDBConfig {
    /** MongoDB connection URI */
    uri: string;
    /** Database name */
    dbName: string;
    /** Optional MongoDB client options */
    options?: Record<string, any>;
}
