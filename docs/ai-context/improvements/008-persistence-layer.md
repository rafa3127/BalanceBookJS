# Improvement 008: Persistence Layer with Plugin Architecture

## 🎯 AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature. This improvement adds a flexible persistence layer using a plugin architecture with adapters.

## 📋 Overview
**Priority**: High  
**Category**: Architecture / Infrastructure  
**Complexity**: High  
**Breaking Change**: No (opt-in feature)  
**Status**: Planning  
**Developer**: @rafaelc3127  

### Brief Description
Implement a plugin-based persistence layer that allows BalanceBookJS objects to be saved, retrieved, and deleted from various data stores (Firebase, SQL, MongoDB, etc.) through a unified adapter interface. The system uses a factory pattern to generate persistable classes dynamically based on the chosen adapter.

## 🎯 Success Criteria
- [ ] Define adapter interface with core operations (get, save, delete, query)
- [ ] Implement factory that generates persistable classes from base classes
- [ ] Maintain method chaining and fluent API
- [ ] Support multiple storage backends through adapters
- [ ] Keep core library storage-agnostic
- [ ] Preserve backward compatibility
- [ ] Enable seamless storage switching
- [ ] Support async operations throughout
- [ ] Include in-memory adapter for testing
- [ ] Full TypeScript support with proper types

## 📐 Technical Design

### Core Concepts

#### 1. Adapter Interface
The adapter provides a minimal contract for storage operations:
```typescript
interface IAdapter {
  get(collection: string, id: string): Promise<any>;
  save(collection: string, id: string | null, data: any): Promise<string>;
  delete(collection: string, id: string): Promise<void>;
  query(collection: string, filters: any): Promise<any[]>;
}
```

#### 2. Factory Pattern
A factory receives an adapter and generates persistable versions of all classes:
```typescript
const factory = new Factory(adapter);
const { Account, JournalEntry } = factory.createClasses();
```

#### 3. Mixin Pattern
Mixins add persistence capabilities while preserving inheritance:
```typescript
// Generated class extends original + adds persistence
class GeneratedAccount extends Mixin(Account) {
  async save(): Promise<this>;
  async delete(): Promise<this>;
  static async findById(id: string): Promise<Account>;
}
```

### Architecture Overview

```
BalanceBookJS/
├── src/
│   ├── core/                    # Existing business logic
│   └── persistence/
│       ├── interfaces/          # Contracts and types
│       ├── factory/             # Class generation logic
│       └── adapters/
│           └── memory/          # Built-in memory adapter

External Packages:
├── @balancebook/firebase        # Firebase adapter
├── @balancebook/sql            # SQL adapter  
└── @balancebook/mongodb        # MongoDB adapter
```

### Usage Flow

```typescript
// 1. Choose and configure adapter
const adapter = new FirebaseAdapter(config);

// 2. Create factory with adapter
const factory = new Factory(adapter);

// 3. Generate persistable classes
const { Account, Asset, JournalEntry } = factory.createClasses();

// 4. Use with natural chaining
const entry = await new JournalEntry('Payment')
  .addEntry(account1, 100, 'debit')
  .addEntry(account2, 100, 'credit')
  .commit()
  .save();  // Saves using configured adapter

// 5. Query data
const accounts = await Account.findAll({ userId: '123' });
```

## 🔄 Implementation Phases

### Phase 1: Core Infrastructure

#### Objectives
- Establish persistence system foundation
- Define contracts and interfaces
- Implement factory pattern
- Create memory adapter for testing

#### Tasks
1. **Define Core Interfaces**
   - Adapter interface for storage operations
   - Serializable interface for objects
   - Options interfaces for configuration
   - Type definitions for filters and queries

2. **Implement Factory System**
   - Factory class that accepts adapters
   - Method to generate all persistent classes
   - Method to generate individual classes
   - Configuration options support

3. **Create Mixin Base**
   - Generic mixin implementation
   - Core methods (save, delete)
   - Static methods (findById, findAll)
   - Method chaining preservation

4. **Memory Adapter**
   - In-memory storage implementation
   - ID generation
   - Basic query support
   - Testing utilities

5. **Unit Tests**
   - Factory functionality
   - Mixin behavior
   - Adapter contract
   - Type safety

#### Deliverables
- `/src/persistence/interfaces/`
- `/src/persistence/factory/`
- `/src/persistence/adapters/memory/`
- Comprehensive test suite

---

### Phase 2: Core Classes Integration

#### Objectives
- Prepare BalanceBookJS classes for persistence
- Add serialization/deserialization
- Define class-specific behaviors
- Maintain API compatibility

#### Tasks
1. **Add Serialization**
   - Implement serialize() methods
   - Define deserialization logic
   - Handle Money objects
   - Support nested objects

2. **Factory Configuration**
   - Define collections for each class
   - Configure serializers
   - Add class-specific methods
   - Setup relationships

3. **Enhanced Methods**
   - commitAndSave() for JournalEntry
   - loadAccounts() for lazy loading
   - Validation hooks
   - Event callbacks

4. **Documentation**
   - Usage examples
   - API documentation
   - Migration guide
   - Best practices

#### Deliverables
- Updated core classes
- Factory configurations
- Usage examples
- Documentation

---

### Phase 3: Firebase Adapter Package

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

2. **Adapter Implementation**
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

#### Deliverables
- Published @balancebook/firebase package
- Migration documentation
- Test suite
- Examples

---

### Phase 4: SQL Adapter Package

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

#### Deliverables
- Published @balancebook/sql package
- Migration CLI tool
- Documentation
- Examples

---

### Phase 5: Testing and Optimization

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

#### Deliverables
- Complete test coverage
- Performance report
- Enhanced documentation
- Developer tools

---

### Phase 6: Additional Adapters (Future)

#### Potential Adapters
- **MongoDB Adapter**: NoSQL support
- **Redis Adapter**: Caching layer
- **REST API Adapter**: Remote storage
- **GraphQL Adapter**: GraphQL backends
- **IndexedDB Adapter**: Browser storage
- **S3 Adapter**: File storage

Each adapter would follow the same pattern and implement the core adapter interface.

## 💡 Design Decisions

### Why Factory Pattern?
- Single configuration point
- Consistent class generation
- Easy adapter switching
- Reduces boilerplate

### Why Mixin Pattern?
- Preserves inheritance chain
- Maintains instanceof checks
- Allows method overriding
- TypeScript friendly

### Why Separate Packages?
- Keeps core lightweight
- Optional dependencies
- Independent versioning
- Community contributions

### Why Adapter Interface?
- Storage agnostic
- Consistent API
- Easy testing
- Extensibility

## 🎯 Usage Examples

### Basic Usage
```typescript
import { Factory } from 'balance-book-js/persistence';
import { FirebaseAdapter } from '@balancebook/firebase';

// Setup
const adapter = new FirebaseAdapter(firebaseConfig);
const factory = new Factory(adapter);
const { Account, JournalEntry } = factory.createClasses();

// Create and save account
const account = new Account({
  name: 'Checking',
  initialBalance: 1000,
  userId: 'user-123'
});
await account.save();

// Create and save journal entry
const entry = new JournalEntry('Payment received')
  .addEntry(account, 500, 'debit')
  .addEntry(revenueAccount, 500, 'credit')
  .commit();
await entry.save();

// Query data
const userAccounts = await Account.findAll({ userId: 'user-123' });
const recentEntries = await JournalEntry.findAll({ 
  date: { $gte: new Date('2025-01-01') }
});
```

### Switching Adapters
```typescript
// Development with memory adapter
const devFactory = new Factory(new MemoryAdapter());

// Production with SQL
const prodFactory = new Factory(new SqlAdapter(dbConfig));

// Same code works with both!
const { Account } = devFactory.createClasses(); // or prodFactory
const account = new Account({ name: 'Cash', initialBalance: 1000 });
await account.save();
```

### Method Chaining
```typescript
// Fluent API preserved
const entry = await new JournalEntry('Complex transaction')
  .withDate(new Date())
  .withDescription('Monthly closing')
  .addEntry(expense1, 100, 'debit')
  .addEntry(expense2, 200, 'debit')
  .addEntry(cash, 300, 'credit')
  .validate()
  .commit()
  .save();

// Class-specific methods
await entry
  .loadAccounts()        // Load related accounts
  .updateAmounts()       // Recalculate
  .commitAndSave();     // Commit + save
```

### Custom Adapters
```typescript
class CustomAdapter implements IAdapter {
  async get(collection: string, id: string): Promise<any> {
    // Custom implementation
  }
  
  async save(collection: string, id: string | null, data: any): Promise<string> {
    // Custom implementation
  }
  
  async delete(collection: string, id: string): Promise<void> {
    // Custom implementation
  }
  
  async query(collection: string, filters: any): Promise<any[]> {
    // Custom implementation
  }
}

// Use like any other adapter
const factory = new Factory(new CustomAdapter());
```

## ⚠️ Important Considerations

### Data Consistency
- Implement transaction support in adapters
- Handle concurrent modifications
- Consider optimistic locking
- Validate before save

### Performance
- Lazy loading for relationships
- Batch operations when possible
- Implement caching strategies
- Monitor query performance

### Security
- Validate user permissions
- Sanitize inputs
- Encrypt sensitive data
- Audit trail for changes

### Migration
- Provide migration tools
- Support gradual adoption
- Maintain backward compatibility
- Document breaking changes

## 📊 Success Metrics

- Zero breaking changes to existing code
- Support for 3+ storage backends
- 100% type safety with TypeScript
- < 100ms average save operation
- < 50ms average query operation
- 90%+ test coverage
- Successful migration from FinanceSyncJS

## 🔄 Migration Path

### From Non-Persistent Code
```typescript
// Before (no persistence)
const account = new Account('Savings', 1000, true);
account.debit(500);

// After (with persistence)
const factory = new Factory(adapter);
const { Account } = factory.createClasses();
const account = new Account('Savings', 1000, true);
account.debit(500);
await account.save(); // Only addition needed
```

### From FinanceSyncJS
```typescript
// FinanceSyncJS (current)
import { Account } from 'financesyncjs';
const account = new Account({ name: 'Cash', initialBalance: 1000 });
await account.save();

// New system (minimal changes)
import { Factory } from 'balance-book-js/persistence';
import { FirebaseAdapter } from '@balancebook/firebase';

const factory = new Factory(new FirebaseAdapter(config));
const { Account } = factory.createClasses();
const account = new Account({ name: 'Cash', initialBalance: 1000 });
await account.save(); // Same API!
```

## 🎉 Expected Impact

- **Flexibility**: Use any storage backend
- **Simplicity**: Single API for all storage types
- **Testability**: Easy testing with memory adapter
- **Scalability**: From local development to enterprise
- **Community**: Enable third-party adapters
- **Future-proof**: Easy to add new storage types

---
*This improvement establishes the foundation for data persistence in BalanceBookJS while maintaining the library's simplicity and flexibility.*
