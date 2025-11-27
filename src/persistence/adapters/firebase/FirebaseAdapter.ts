import * as admin from 'firebase-admin';
import { IAdapter, IQueryFilters } from '../../interfaces';
import { FirebaseConfig } from './config';

export class FirebaseAdapter implements IAdapter {
    private db: admin.firestore.Firestore;

    constructor(config: FirebaseConfig) {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: config.credential,
                projectId: config.projectId,
                databaseURL: config.databaseURL,
                storageBucket: config.storageBucket
            });
        }
        this.db = admin.firestore();
    }

    async get<T = any>(collection: string, id: string): Promise<T | null> {
        const doc = await this.db.collection(collection).doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as T;
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
        let query: admin.firestore.Query = this.db.collection(collection);

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                query = query.where(key, '==', value);
            });
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
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
