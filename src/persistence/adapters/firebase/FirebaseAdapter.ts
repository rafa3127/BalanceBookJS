import { IAdapter, IQueryFilters, IWhereCondition, QueryOperator } from '../../interfaces.ts';
import { FirebaseConfig } from './config.ts';

// Use dynamic import type for Firestore to avoid import issues
type Firestore = import('firebase-admin').firestore.Firestore;
type Query = import('firebase-admin').firestore.Query;
type QueryDocumentSnapshot = import('firebase-admin').firestore.QueryDocumentSnapshot;
type WhereFilterOp = import('firebase-admin').firestore.WhereFilterOp;
type OrderByDirection = import('firebase-admin').firestore.OrderByDirection;

export class FirebaseAdapter implements IAdapter {
    private db: Firestore;

    /**
     * Convert Firestore Timestamps to JavaScript Dates recursively
     */
    private convertTimestamps(data: any): any {
        if (data === null || data === undefined) {
            return data;
        }

        // Check if it's a Firestore Timestamp (has toDate method)
        if (data && typeof data.toDate === 'function') {
            return data.toDate();
        }

        // Handle arrays
        if (Array.isArray(data)) {
            return data.map(item => this.convertTimestamps(item));
        }

        // Handle objects
        if (typeof data === 'object') {
            const result: any = {};
            for (const key of Object.keys(data)) {
                result[key] = this.convertTimestamps(data[key]);
            }
            return result;
        }

        return data;
    }

    /**
     * Create a FirebaseAdapter
     * @param configOrFirestore - Either a FirebaseConfig object or an already initialized Firestore instance
     */
    constructor(configOrFirestore: FirebaseConfig | Firestore) {
        // Check if it's a Firestore instance (has collection method)
        if (configOrFirestore && typeof (configOrFirestore as any).collection === 'function') {
            this.db = configOrFirestore as Firestore;
        } else {
            // Legacy: initialize from config
            const config = configOrFirestore as FirebaseConfig;
            // Dynamic import to avoid module issues
            const admin = require('firebase-admin');
            const apps = admin.apps ?? [];
            if (!apps.length) {
                admin.initializeApp({
                    credential: config.credential,
                    projectId: config.projectId,
                    databaseURL: config.databaseURL,
                    storageBucket: config.storageBucket
                });
            }
            this.db = admin.firestore();
        }
    }

    async get<T = any>(collection: string, id: string): Promise<T | null> {
        const doc = await this.db.collection(collection).doc(id).get();
        if (!doc.exists) return null;
        const data = this.convertTimestamps(doc.data());
        return { id: doc.id, ...data } as T;
    }

    async save(collection: string, id: string | null, data: any): Promise<string> {
        const cleanData = this.sanitizeData(data);

        if (id) {
            await this.db.collection(collection).doc(id).set(cleanData, { merge: true });
            return id;
        } else {
            const docRef = await this.db.collection(collection).add(cleanData);
            return docRef.id;
        }
    }

    async delete(collection: string, id: string): Promise<void> {
        await this.db.collection(collection).doc(id).delete();
    }

    async query<T = any>(collection: string, filters?: IQueryFilters): Promise<T[]> {
        // Track which operators need in-memory filtering
        const inMemoryFilters: IWhereCondition[] = [];
        let hasInMemoryFilters = false;

        // Build base query with Firestore-native filters
        const buildBaseQuery = (): Query => {
            let query: Query = this.db.collection(collection);

            if (filters) {
                // Apply $where conditions (advanced filters)
                if (filters.$where && Array.isArray(filters.$where)) {
                    for (const condition of filters.$where) {
                        const firestoreOp = this.mapOperatorToFirestore(condition.operator);

                        if (firestoreOp) {
                            // Handle startsWith specially - Firebase uses >= and < for prefix matching
                            if (condition.operator === 'startsWith' && typeof condition.value === 'string') {
                                const startValue = condition.value;
                                const endValue = condition.value.slice(0, -1) +
                                    String.fromCharCode(condition.value.charCodeAt(condition.value.length - 1) + 1);
                                query = query.where(condition.field, '>=', startValue);
                                query = query.where(condition.field, '<', endValue);
                            } else {
                                query = query.where(condition.field, firestoreOp, condition.value);
                            }
                        } else {
                            // Operator not supported natively by Firestore, filter in memory
                            if (!inMemoryFilters.some(f => f.field === condition.field && f.operator === condition.operator)) {
                                inMemoryFilters.push(condition);
                            }
                            hasInMemoryFilters = true;
                        }
                    }
                }

                // Apply simple equality filters (backward compatible)
                // Exclude special keys starting with $
                const simpleFilters = Object.entries(filters).filter(
                    ([key]) => !key.startsWith('$')
                );
                for (const [key, value] of simpleFilters) {
                    query = query.where(key, '==', value);
                }

                // Apply $orderBy
                if (filters.$orderBy) {
                    const direction: OrderByDirection = filters.$orderBy.direction === 'desc' ? 'desc' : 'asc';
                    query = query.orderBy(filters.$orderBy.field, direction);
                }
            }

            return query;
        };

        const requestedLimit = filters?.$limit ?? 0;
        const requestedOffset = filters?.$offset ?? 0;

        // First call buildBaseQuery to populate inMemoryFilters and hasInMemoryFilters
        // (the detection happens inside buildBaseQuery)
        buildBaseQuery();

        // If no in-memory filters, use simple query with native limit
        if (!hasInMemoryFilters) {
            let query = buildBaseQuery();

            if (requestedLimit > 0) {
                query = query.limit(requestedLimit + requestedOffset);
            }

            const snapshot = await query.get();
            let results = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
                const data = this.convertTimestamps(doc.data());
                return { id: doc.id, ...data } as T;
            });

            // Apply $offset in memory (Firestore doesn't have native offset)
            if (requestedOffset > 0) {
                results = results.slice(requestedOffset);
            }

            // Apply limit after offset
            if (requestedLimit > 0) {
                results = results.slice(0, requestedLimit);
            }

            return results;
        }

        // With in-memory filters, use iterative pagination to ensure we get enough results
        const results: T[] = [];
        let lastDoc: QueryDocumentSnapshot | undefined = undefined;
        const batchSize = Math.max(100, (requestedLimit + requestedOffset) * 2); // Fetch in batches
        const maxIterations = 50; // Safety limit to prevent infinite loops
        let iterations = 0;
        let totalSkipped = 0;

        while (iterations < maxIterations) {
            iterations++;

            let query = buildBaseQuery();
            query = query.limit(batchSize);

            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }

            const snapshot = await query.get();

            if (snapshot.docs.length === 0) {
                // No more documents
                break;
            }

            // Apply in-memory filters to this batch
            for (const doc of snapshot.docs) {
                const data = this.convertTimestamps(doc.data());
                const item = { id: doc.id, ...data } as T;

                const passesFilter = inMemoryFilters.every(condition =>
                    this.evaluateConditionInMemory(item, condition)
                );

                if (passesFilter) {
                    // Handle offset
                    if (totalSkipped < requestedOffset) {
                        totalSkipped++;
                        continue;
                    }

                    results.push(item);

                    // Check if we have enough results
                    if (requestedLimit > 0 && results.length >= requestedLimit) {
                        return results;
                    }
                }
            }

            // Update cursor for next iteration
            lastDoc = snapshot.docs[snapshot.docs.length - 1];

            // If we got fewer docs than batch size, we've reached the end
            if (snapshot.docs.length < batchSize) {
                break;
            }
        }

        return results;
    }

    /**
     * Map our QueryOperator to Firestore WhereFilterOp
     * Returns null if the operator must be handled in memory
     */
    private mapOperatorToFirestore(operator: QueryOperator): WhereFilterOp | null {
        const mapping: Partial<Record<QueryOperator, WhereFilterOp>> = {
            '==': '==',
            '!=': '!=',
            '>': '>',
            '>=': '>=',
            '<': '<',
            '<=': '<=',
            'in': 'in',
            'not-in': 'not-in',
            'contains': 'array-contains',
            // 'startsWith' is handled specially with >= and <
        };

        return mapping[operator] ?? null;
    }

    /**
     * Evaluate a condition in memory for operators not supported by Firestore
     */
    private evaluateConditionInMemory(item: any, condition: IWhereCondition): boolean {
        const { field, operator, value } = condition;
        const itemValue = this.getNestedValue(item, field);

        switch (operator) {
            case 'endsWith':
                if (typeof itemValue !== 'string' || typeof value !== 'string') {
                    return false;
                }
                return itemValue.endsWith(value);

            case 'includes':
                if (typeof itemValue !== 'string' || typeof value !== 'string') {
                    return false;
                }
                return itemValue.includes(value);

            default:
                // For other operators, assume true (they were handled by Firestore)
                return true;
        }
    }

    /**
     * Get a nested value from an object using dot notation
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

    async deleteMany(collection: string, filters: IQueryFilters): Promise<number> {
        const docs = await this.query<{ id: string }>(collection, filters);
        if (docs.length === 0) return 0;

        const chunks = this.chunkArray(docs, 500);
        let deletedCount = 0;

        for (const chunk of chunks) {
            const batch = this.db.batch();
            chunk.forEach(doc => {
                const ref = this.db.collection(collection).doc(doc.id);
                batch.delete(ref);
            });
            await batch.commit();
            deletedCount += chunk.length;
        }

        return deletedCount;
    }

    async updateMany(collection: string, filters: IQueryFilters, data: any): Promise<number> {
        const docs = await this.query<{ id: string }>(collection, filters);
        if (docs.length === 0) return 0;

        const cleanData = this.sanitizeData(data);
        const chunks = this.chunkArray(docs, 500);
        let updatedCount = 0;

        for (const chunk of chunks) {
            const batch = this.db.batch();
            chunk.forEach(doc => {
                const ref = this.db.collection(collection).doc(doc.id);
                batch.update(ref, cleanData);
            });
            await batch.commit();
            updatedCount += chunk.length;
        }

        return updatedCount;
    }

    private sanitizeData(data: any): any {
        // Recursively remove undefined values but preserve Dates
        if (data === null || data === undefined) return null;
        if (data instanceof Date) return data;
        if (Array.isArray(data)) return data.map(item => this.sanitizeData(item)).filter(item => item !== undefined);
        if (typeof data === 'object') {
            const result: any = {};
            for (const key in data) {
                const value = this.sanitizeData(data[key]);
                if (value !== undefined) {
                    result[key] = value;
                }
            }
            return result;
        }
        return data;
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}
