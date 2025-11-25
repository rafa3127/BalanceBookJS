import { IAdapter, IQueryFilters } from '../interfaces';
import { randomUUID } from 'crypto';

/**
 * In-memory storage adapter for testing and development
 */
export class MemoryAdapter implements IAdapter {
    private storage: Map<string, Map<string, any>> = new Map();

    async get<T = any>(collection: string, id: string): Promise<T | null> {
        const collectionMap = this.storage.get(collection);
        if (!collectionMap) return null;
        return collectionMap.get(id) || null;
    }

    async save(collection: string, id: string | null, data: any): Promise<string> {
        if (!this.storage.has(collection)) {
            this.storage.set(collection, new Map());
        }

        const collectionMap = this.storage.get(collection)!;
        const docId = id || this.generateId();

        // Ensure ID is in the data
        const docData = { ...data, id: docId };
        collectionMap.set(docId, docData);

        return docId;
    }

    async delete(collection: string, id: string): Promise<void> {
        const collectionMap = this.storage.get(collection);
        if (collectionMap) {
            collectionMap.delete(id);
        }
    }

    async query<T = any>(collection: string, filters?: IQueryFilters): Promise<T[]> {
        const collectionMap = this.storage.get(collection);
        if (!collectionMap) return [];

        let results = Array.from(collectionMap.values());

        if (filters) {
            results = results.filter(item => {
                return Object.entries(filters).every(([key, value]) => {
                    return item[key] === value;
                });
            });
        }

        return results as T[];
    }

    private generateId(): string {
        return randomUUID();
    }

    /**
     * Helper to clear storage (useful for tests)
     */
    clear(): void {
        this.storage.clear();
    }
}
