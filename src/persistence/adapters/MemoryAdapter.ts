import { IAdapter, IQueryFilters, IWhereCondition, QueryOperator } from '../interfaces.ts';
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

    async deleteMany(collection: string, filters: IQueryFilters): Promise<number> {
        const collectionMap = this.storage.get(collection);
        if (!collectionMap) return 0;

        const itemsToDelete = await this.query(collection, filters);
        let count = 0;

        for (const item of itemsToDelete) {
            if (item.id) {
                collectionMap.delete(item.id);
                count++;
            }
        }

        return count;
    }

    async updateMany(collection: string, filters: IQueryFilters, data: any): Promise<number> {
        const collectionMap = this.storage.get(collection);
        if (!collectionMap) return 0;

        const itemsToUpdate = await this.query(collection, filters);
        let count = 0;

        for (const item of itemsToUpdate) {
            if (item.id) {
                const updatedItem = { ...item, ...data, id: item.id };
                collectionMap.set(item.id, updatedItem);
                count++;
            }
        }

        return count;
    }

    async query<T = any>(collection: string, filters?: IQueryFilters): Promise<T[]> {
        const collectionMap = this.storage.get(collection);
        if (!collectionMap) return [];

        let results = Array.from(collectionMap.values());

        if (filters) {
            // Apply $where conditions (advanced filters)
            if (filters.$where && Array.isArray(filters.$where)) {
                results = results.filter(item => {
                    return filters.$where!.every(condition =>
                        this.evaluateCondition(item, condition)
                    );
                });
            }

            // Apply simple equality filters (backward compatible)
            // Exclude special keys starting with $
            const simpleFilters = Object.entries(filters).filter(
                ([key]) => !key.startsWith('$')
            );
            if (simpleFilters.length > 0) {
                results = results.filter(item => {
                    return simpleFilters.every(([key, value]) => {
                        return this.getNestedValue(item, key) === value;
                    });
                });
            }

            // Apply $orderBy
            if (filters.$orderBy) {
                const { field, direction } = filters.$orderBy;
                results.sort((a, b) => {
                    const aVal = this.getNestedValue(a, field);
                    const bVal = this.getNestedValue(b, field);

                    if (aVal === bVal) return 0;
                    if (aVal === null || aVal === undefined) return 1;
                    if (bVal === null || bVal === undefined) return -1;

                    const comparison = aVal < bVal ? -1 : 1;
                    return direction === 'desc' ? -comparison : comparison;
                });
            }

            // Apply $offset
            if (filters.$offset && filters.$offset > 0) {
                results = results.slice(filters.$offset);
            }

            // Apply $limit
            if (filters.$limit && filters.$limit > 0) {
                results = results.slice(0, filters.$limit);
            }
        }

        return results as T[];
    }

    /**
     * Get a nested value from an object using dot notation
     * @param obj The object to get the value from
     * @param path The path to the value (e.g., 'balance.amount' or 'entries.accountId')
     */
    private getNestedValue(obj: any, path: string): any {
        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[part];
        }

        return current;
    }

    /**
     * Evaluate a single filter condition against an item
     */
    private evaluateCondition(item: any, condition: IWhereCondition): boolean {
        const { field, operator, value } = condition;
        const itemValue = this.getNestedValue(item, field);

        return this.compareValues(itemValue, operator, value);
    }

    /**
     * Compare values using the specified operator
     */
    private compareValues(itemValue: any, operator: QueryOperator, filterValue: any): boolean {
        switch (operator) {
            case '==':
                return itemValue === filterValue;

            case '!=':
                return itemValue !== filterValue;

            case '>':
                return itemValue > filterValue;

            case '>=':
                return itemValue >= filterValue;

            case '<':
                return itemValue < filterValue;

            case '<=':
                return itemValue <= filterValue;

            case 'in':
                if (!Array.isArray(filterValue)) return false;
                return filterValue.includes(itemValue);

            case 'not-in':
                if (!Array.isArray(filterValue)) return true;
                return !filterValue.includes(itemValue);

            case 'contains':
                // Array contains value
                if (Array.isArray(itemValue)) {
                    return itemValue.includes(filterValue);
                }
                return false;

            case 'startsWith':
                if (typeof itemValue !== 'string' || typeof filterValue !== 'string') {
                    return false;
                }
                return itemValue.startsWith(filterValue);

            case 'endsWith':
                if (typeof itemValue !== 'string' || typeof filterValue !== 'string') {
                    return false;
                }
                return itemValue.endsWith(filterValue);

            case 'includes':
                if (typeof itemValue !== 'string' || typeof filterValue !== 'string') {
                    return false;
                }
                return itemValue.includes(filterValue);

            default:
                // Unknown operator, return false for safety
                return false;
        }
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
