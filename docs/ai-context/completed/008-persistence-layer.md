# Improvement 008: Persistence Layer with Plugin Architecture

## 🎯 AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature. This improvement adds a flexible persistence layer using a plugin architecture with adapters.

## 📋 Overview
**Priority**: High  
**Category**: Architecture / Infrastructure  
**Complexity**: High  
**Breaking Change**: No (opt-in feature)  
**Status**: Completed
**Developer**: @rafaelc3127  

### Brief Description
Implement a plugin-based persistence layer that allows BalanceBookJS objects to be saved, retrieved, and deleted from various data stores (Firebase, SQL, MongoDB, etc.) through a unified adapter interface. The system uses a factory pattern to generate persistable classes dynamically based on the chosen adapter.

> **Note**: This improvement covers the Core Infrastructure and Integration (Phases 1 & 2). Specific adapters (Firebase, SQL) and advanced optimizations are tracked in **Improvement 009: Persistence Adapters**.

## 🎯 Success Criteria
- [x] Define adapter interface with core operations (get, save, delete, query)
- [x] Implement factory that generates persistable classes from base classes
- [x] Maintain method chaining and fluent API
- [x] Support multiple storage backends through adapters
- [x] Keep core library storage-agnostic
- [x] Preserve backward compatibility
- [x] Enable seamless storage switching
- [x] Support async operations throughout
- [x] Include in-memory adapter for testing
- [x] Full TypeScript support with proper types

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

External Packages (Future):
├── @balancebook/firebase        # Firebase adapter
├── @balancebook/sql            # SQL adapter  
└── @balancebook/mongodb        # MongoDB adapter
```

### Usage Flow

```typescript
// 1. Choose and configure adapter (Memory for now)
const adapter = new MemoryAdapter();

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

### Phase 1: Core Infrastructure (Completed)

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

### Phase 2: Core Classes Integration (Completed)

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
import { MemoryAdapter } from 'balance-book-js/persistence/adapters';

// Setup
const adapter = new MemoryAdapter();
const factory = new Factory(adapter);
const { Account, JournalEntry } = factory.createClasses();

// Create and save account
const account = new Account('Checking', 1000, true);
await account.save();

// Create and save journal entry
const entry = new JournalEntry('Payment received');
entry.addEntry(account, 500, 'debit');
entry.commit();
await entry.save();

// Query data
const accounts = await Account.findAll();
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
