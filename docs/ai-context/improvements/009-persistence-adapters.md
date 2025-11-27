# Improvement 009: Persistence Adapters & Optimization

## 🎯 AI Assistant Instructions
This improvement builds upon the core persistence layer established in Improvement 008. It focuses on implementing specific storage adapters (Firebase, SQL), optimizing performance, and expanding the ecosystem.

## 📋 Overview
**Priority**: High
**Category**: Infrastructure / Ecosystem
**Complexity**: High
**Breaking Change**: No
**Status**: Planning
**Prerequisites**: Improvement 008 (Completed)

## 🎯 Success Criteria
- [ ] Create and publish `@balancebook/firebase` adapter
- [ ] Create and publish `@balancebook/sql` adapter
- [ ] Implement comprehensive performance testing and optimization
- [ ] Document migration paths for existing users
- [ ] Establish patterns for community-contributed adapters

## 🔄 Implementation Phases

### Phase 1: Firebase Adapter Package
#### Objectives
- Create Firebase/Firestore adapter
- Migrate existing FinanceSyncJS code
- Maintain backward compatibility
- Support real-time features

#### Tasks
1. **Package Setup**
   - Create @balancebook/firebase package
   - Configure peer dependencies
   - TypeScript configuration
   - Build pipeline

2. **Dependencies**
   - Add `firebase-admin` to main package.json
   - Configure build to handle optional dependencies if needed

3. **Adapter Implementation**
   - Implement adapter interface
   - Firestore integration
   - Real-time subscriptions
   - Batch operations

3. **Migration Support**
   - Compatibility with FinanceSyncJS
   - Data migration utilities
   - Documentation for existing users
   - Gradual migration path

4. **Testing**
   - Integration tests
   - Emulator setup
   - Performance testing
   - Error scenarios

### Phase 2: SQL Adapter Package
#### Objectives
- Create SQL database adapter
- Support multiple dialects
- Implement migrations system
- Enable complex queries

#### Tasks
1. **Package Setup**
   - Create @balancebook/sql package
   - Choose query builder/ORM
   - Multi-dialect support
   - Configuration system

2. **Adapter Implementation**
   - Implement adapter interface
   - Connection management
   - Transaction support
   - Query optimization

3. **Schema Management**
   - Auto-schema generation
   - Migration system
   - Index management
   - Relationships

4. **Advanced Features**
   - Complex queries
   - Batch operations
   - Joins and relations
   - Performance optimization

### Phase 3: Testing and Optimization
#### Objectives
- Ensure system reliability
- Optimize performance
- Improve developer experience
- Complete documentation

#### Tasks
1. **Comprehensive Testing**
   - Cross-adapter tests
   - Performance benchmarks
   - Load testing
   - Edge cases

2. **Performance Optimization**
   - Query optimization
   - Caching strategies
   - Lazy loading
   - Batch operations

3. **Developer Experience**
   - Better error messages
   - Debug mode
   - TypeScript refinements
   - IDE support

4. **Documentation**
   - Complete API reference
   - Tutorial series
   - Video guides
   - Code examples

### Phase 4: Additional Adapters (Future)
#### Potential Adapters
- **MongoDB Adapter**: NoSQL support
- **Redis Adapter**: Caching layer
- **REST API Adapter**: Remote storage
- **GraphQL Adapter**: GraphQL backends
- **IndexedDB Adapter**: Browser storage
- **S3 Adapter**: File storage

## 💡 Design Decisions
- **Internal Modules**: Adapters will be implemented as internal modules within `src/persistence/adapters/` to maintain simplicity and avoid monorepo complexity.
- **Unified Interface**: All adapters must strictly adhere to the `IAdapter` interface defined in the core.
- **Firestore Indexing**: Multi-field queries in Firestore require composite indices. Users must create these indices in the Firebase Console based on their query patterns.

## 🔧 Core Extension (Pre-Phase 1) - Completed
Before implementing the adapters, the core persistence layer was extended with bulk operations:

### Added to `IAdapter` interface:
- `deleteMany(collection, filters): Promise<number>`
- `updateMany(collection, filters, data): Promise<number>`

### Added to `PersistableMixin` (static methods):
- `deleteMany(filters): Promise<number>`
- `updateMany(filters, data): Promise<number>`

### Implementation in `MemoryAdapter`:
- Both methods reuse `query()` for filtering logic
- Returns count of affected documents

## ⚠️ Technical Debt & Future Considerations

### 1. Bulk Operations - No Instance Rehidration
**Issue**: `updateMany` and `deleteMany` do not update/invalidate in-memory instances.

**Current behavior**:
```typescript
const acc = await Account.findById('123'); // acc.name = 'Old'
await Account.updateMany({ id: '123' }, { name: 'New' });
console.log(acc.name); // Still 'Old' - desynchronized!
```

**Possible future solutions**:
- Add `updateManyAndReturn()` / `deleteManyAndReturn()` variants that return affected instances
- Implement an instance registry/cache with invalidation
- Document this as expected behavior (consistent with most ORMs)

**Decision**: Keep current implementation (returns `number`). This is the standard behavior in Prisma, TypeORM, etc. Add `*AndReturn` variants only if use cases emerge.

### 2. Test Coverage for Bulk Operations
**Current state**: Basic tests exist in `BulkOperations.test.ts`

**Recommended additions**:
- [ ] Empty filters behavior (`{}`) - should it affect all documents?
- [ ] Non-existent collection returns 0
- [ ] Filters matching nothing returns 0
- [ ] Multiple documents affected in single operation
- [ ] Concurrent bulk operations

### 3. Query Filters Limitations
**Current `IQueryFilters`**: Simple key-value equality matching only.

**Future considerations for adapters**:
- Comparison operators (`$gt`, `$lt`, `$in`, etc.)
- Logical operators (`$and`, `$or`)
- Nested field queries
- Each adapter may need to translate these to native query syntax

### 4. SQLAdapter - MySQL Compatibility
**Issue**: `.returning('id')` is not fully supported in MySQL.

**Current behavior**:
- PostgreSQL and SQLite: Work correctly with `.returning('id')`
- MySQL: May return `undefined` or `0` instead of the actual inserted ID

**Possible future solutions**:
- Detect dialect and use `lastInsertId` for MySQL
- Require ID to be provided before save for MySQL users
- Implement dialect-specific ID retrieval strategies

**Decision**: Document as known limitation. PostgreSQL and SQLite are fully supported. MySQL users should provide IDs explicitly.

### 5. SQLAdapter - Upsert Efficiency
**Issue**: `save()` with existing ID performs 2 queries (check existence + update/insert).

**Current behavior**:
```typescript
// Current implementation
const exists = await this.db(collection).where('id', id).first();
if (exists) {
    await this.db(collection).where('id', id).update(cleanData);
} else {
    await this.db(collection).insert({ ...cleanData, id });
}
```

**Possible future solutions**:
- Use `ON CONFLICT` (PostgreSQL) / `ON DUPLICATE KEY` (MySQL) for true upsert
- Implement dialect-specific upsert strategies
- Add `upsert()` method to adapter interface

**Decision**: Keep current implementation for cross-dialect compatibility. Performance impact is minimal for typical use cases.

### 6. SQLAdapter - Nested Objects Serialization
**Issue**: SQL databases don't support nested objects natively. Current `sanitizeData` handles arrays (JSON.stringify) but not nested objects.

**Current behavior**:
- Arrays: Serialized to JSON string
- Nested objects: Passed as-is (may fail depending on schema)
- Dates: Preserved (Knex handles conversion)

**Possible future solutions**:
- Auto-detect and JSON.stringify nested objects
- Provide configuration option for JSON columns
- Document that users should flatten objects or use JSON columns

**Decision**: Document as user responsibility. Users should design schemas appropriately or stringify nested data before save.
