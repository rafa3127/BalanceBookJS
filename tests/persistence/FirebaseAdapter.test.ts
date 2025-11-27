import { jest } from '@jest/globals';

// Define mocks before imports
const mockFirestoreInstance = {
    collection: jest.fn(),
    batch: jest.fn()
};
const mockFirestoreFn = jest.fn(() => mockFirestoreInstance);

const mockAdmin = {
    apps: [],
    initializeApp: jest.fn(),
    firestore: mockFirestoreFn,
    credential: {
        cert: jest.fn()
    }
};

// Mock firebase-admin using unstable_mockModule for ESM support
jest.unstable_mockModule('firebase-admin', () => ({
    __esModule: true,
    default: mockAdmin,
    ...mockAdmin
}));

// Dynamic imports must happen after mockModule
const { FirebaseAdapter } = await import('../../src/persistence/adapters/firebase/FirebaseAdapter');
const admin = await import('firebase-admin');

describe('FirebaseAdapter', () => {
    let adapter: any; // Type as any to avoid TS issues with dynamic import types for now
    let mockDb: any;
    let mockCollection: any;
    let mockDoc: any;
    let mockBatch: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup chainable mocks
        mockDoc = {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            id: 'test-id',
            exists: true,
            data: jest.fn(() => ({ name: 'Test' }))
        };

        mockCollection = {
            doc: jest.fn(() => mockDoc),
            add: jest.fn(),
            where: jest.fn(),
            get: jest.fn()
        };

        // Allow chaining for query builder
        mockCollection.where.mockReturnValue(mockCollection);

        mockBatch = {
            delete: jest.fn(),
            update: jest.fn(),
            commit: jest.fn()
        };

        // Reset the mock implementation for each test
        mockFirestoreInstance.collection.mockReturnValue(mockCollection);
        mockFirestoreInstance.batch.mockReturnValue(mockBatch);

        // Re-assign mockDb for tests to assert on
        mockDb = mockFirestoreInstance;

        adapter = new FirebaseAdapter({});
    });

    test('should initialize firebase app if not initialized', () => {
        expect(mockAdmin.initializeApp).toHaveBeenCalled();
    });

    test('get should retrieve document', async () => {
        mockDoc.get.mockResolvedValue(mockDoc);

        const result = await adapter.get('users', 'test-id');

        expect(mockDb.collection).toHaveBeenCalledWith('users');
        expect(mockCollection.doc).toHaveBeenCalledWith('test-id');
        expect(result).toEqual({ id: 'test-id', name: 'Test' });
    });

    test('get should return null if document does not exist', async () => {
        mockDoc.exists = false;
        mockDoc.get.mockResolvedValue(mockDoc);

        const result = await adapter.get('users', 'missing-id');

        expect(result).toBeNull();
    });

    test('save should create new document if id is null', async () => {
        const newDocRef = { id: 'new-id' };
        mockCollection.add.mockResolvedValue(newDocRef);

        const id = await adapter.save('users', null, { name: 'New' });

        expect(mockCollection.add).toHaveBeenCalledWith({ name: 'New' });
        expect(id).toBe('new-id');
    });

    test('save should update existing document if id is provided', async () => {
        const id = await adapter.save('users', 'existing-id', { name: 'Updated' });

        expect(mockCollection.doc).toHaveBeenCalledWith('existing-id');
        expect(mockDoc.set).toHaveBeenCalledWith({ name: 'Updated' }, { merge: true });
        expect(id).toBe('existing-id');
    });

    test('delete should delete document', async () => {
        await adapter.delete('users', 'test-id');

        expect(mockCollection.doc).toHaveBeenCalledWith('test-id');
        expect(mockDoc.delete).toHaveBeenCalled();
    });

    test('query should return matching documents', async () => {
        const mockSnapshot = {
            docs: [mockDoc]
        };
        mockCollection.get.mockResolvedValue(mockSnapshot);

        const results = await adapter.query('users', { role: 'admin' });

        expect(mockCollection.where).toHaveBeenCalledWith('role', '==', 'admin');
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({ id: 'test-id', name: 'Test' });
    });

    test('deleteMany should batch delete documents', async () => {
        // Mock query result
        const mockSnapshot = {
            docs: [mockDoc, { ...mockDoc, id: 'test-id-2' }]
        };
        mockCollection.get.mockResolvedValue(mockSnapshot);

        const count = await adapter.deleteMany('users', { role: 'inactive' });

        expect(mockDb.batch).toHaveBeenCalled();
        expect(mockBatch.delete).toHaveBeenCalledTimes(2);
        expect(mockBatch.commit).toHaveBeenCalled();
        expect(count).toBe(2);
    });

    test('updateMany should batch update documents', async () => {
        // Mock query result
        const mockSnapshot = {
            docs: [mockDoc]
        };
        mockCollection.get.mockResolvedValue(mockSnapshot);

        const count = await adapter.updateMany('users', { role: 'old' }, { role: 'new' });

        expect(mockDb.batch).toHaveBeenCalled();
        expect(mockBatch.update).toHaveBeenCalled();
        expect(mockBatch.commit).toHaveBeenCalled();
        expect(count).toBe(1);
    });
});
