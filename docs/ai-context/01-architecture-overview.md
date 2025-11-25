# Architecture Overview: BalanceBookJS

## 🎯 AI Assistant Instructions
This document describes the current architecture and patterns used in BalanceBookJS. Read this after `00-project-context.md` to understand the codebase structure before implementing changes.

## 🏛️ Current Architecture

### Design Patterns in Use

#### 1. **Classical Inheritance Pattern**
```javascript
// Base class
Account
  ├── Asset (isDebitPositive = true)
  ├── Liability (isDebitPositive = false)
  ├── Equity (isDebitPositive = false)
  ├── Income (isDebitPositive = false)
  └── Expense (isDebitPositive = true)
```

**Key Implementation**:
- Base `Account` class handles all debit/credit logic
- Subclasses only configure the `isDebitPositive` flag
- No method overriding in subclasses currently

#### 2. **Strategy Pattern (Implicit)**
The `isDebitPositive` flag acts as a strategy for determining balance calculation:
```javascript
debit(amount) {
    this.balance += this.isDebitPositive ? amount : -amount;
}
```

#### 3. **Command Pattern**
`JournalEntry` encapsulates a complete transaction:
- Stores transaction details before execution
- Validates balance before committing
- Applies all changes atomically

#### 4. **Adapter Pattern**
Used in the Persistence Layer to support multiple storage backends:
```typescript
interface IAdapter {
    save(collection, id, data): Promise<string>;
    get(collection, id): Promise<any>;
}
// Implementations: MemoryAdapter, FirebaseAdapter, SqlAdapter
```

#### 5. **Abstract Factory Pattern**
Used to generate persistable classes bound to a specific adapter:
```typescript
const factory = new Factory(adapter);
const { Account } = factory.createClasses();
```

#### 6. **Mixin Pattern**
Used to inject persistence capabilities into domain classes without inheritance:
```typescript
// PersistableMixin adds .save(), .findById() to Account
const PersistableAccount = PersistableMixin(Account, adapter, 'accounts');
```

### Module Organization

```
src/
├── index.js                    # Public API exports
├── types/                      # TypeScript type definitions
│   ├── account.types.ts       # Account interfaces
│   ├── money.types.ts         # Money & currency types
│   └── transaction.types.ts   # Transaction interfaces
├── classes/
│   ├── accounts/              # Account domain
│   │   ├── Account.ts         # Base with Money integration
│   │   └── [Account subclasses]
│   ├── transactions/          # Transaction domain
│   │   └── JournalEntry.ts   # Supports Money
│   └── value-objects/         # Immutable value objects
│       ├── Money.ts           # Precision-safe money
│       ├── MoneyUtils.ts      # Money operations
│       ├── MoneyUtils.ts      # Money operations
│       └── CurrencyFactory.ts # Currency creation
├── persistence/               # Persistence Layer
│   ├── adapters/              # Storage adapters
│   ├── interfaces.ts          # Core interfaces
│   ├── Factory.ts             # Class factory
│   └── PersistableMixin.ts    # Persistence logic
└── Constants.ts               # Shared constants

docs/
├── ai-context/                # AI agent documentation
│   ├── improvements/          # Feature specifications
│   └── completed/             # Completed features
└── migration_guides/          # Optional adoption guides
    └── XXX_*.md              # Named by feature number
```

**Design Decisions**: 
- Separate accounts from transactions to maintain single responsibility
- Value objects isolated for reusability
- TypeScript types centralized for consistency
- Money integrated transparently (backward compatible)
- Migration guides separated from feature specs (adoption vs implementation)

## 🔄 Data Flow

### Transaction Lifecycle
1. **Creation**: `new JournalEntry(description, date)`
2. **Building**: `addEntry(account, amount, type)` - multiple times
3. **Validation**: Internal check that debits = credits
4. **Commit**: `commit()` - applies to all accounts
5. **Query**: `getDetails()` - retrieve transaction info

### Account State Management
- **Mutable State**: Account balances are directly modified
- **No History**: Accounts don't track their transaction history
- **No Rollback**: No built-in undo mechanism

## 📏 Code Standards

### Naming Conventions
- **Classes**: PascalCase (`JournalEntry`, `Account`)
- **Methods**: camelCase (`getBalance`, `addEntry`)
- **Files**: PascalCase matching class name (`Account.js`)
- **Directories**: lowercase (`accounts`, `transactions`)

### Documentation Standards
```javascript
/**
 * Brief description of the method.
 * @param {Type} paramName - Parameter description.
 * @return {Type} Return description.
 */
```

### Error Handling
Current approach:
- Throw `Error` objects with descriptive messages
- Validate in methods before state changes
- No custom error classes yet

## 🔌 Extension Points

### Current Extension Mechanisms
1. **Inheritance**: Create new account types by extending `Account`
2. **Composition**: Build complex transactions with multiple `JournalEntry` objects

### Limitations to Address
1. **No Plugins/Middleware**: No hook system for extending behavior
2. **No Events**: No event emission for state changes
3. **No Interceptors**: Can't intercept debit/credit operations

## 🗄️ State Management

### Current State
- **Local State**: Each account maintains its own balance
- **No Global State**: No centralized ledger or store
- **Local State**: Each account maintains its own balance
- **No Global State**: No centralized ledger or store
- **Persistence**: Supported via `persistence` module (opt-in)

### Missing Concepts
- General Ledger (central record)
- Chart of Accounts (account registry)
- Accounting Periods
- Transaction History/Audit Trail

## 🧪 Testing Strategy

### Current Coverage
- Basic unit tests for core functionality
- Test files follow pattern: `[ClassName].test.js`

### Testing Patterns
```javascript
describe('ClassName', () => {
    describe('methodName', () => {
        it('should behavior description', () => {
            // Arrange
            // Act
            // Assert
        });
    });
});
```

## 🚫 Anti-Patterns to Avoid

1. **Deep Inheritance Chains**: Keep hierarchy shallow
2. **God Objects**: Avoid putting too much logic in one class
3. **Tight Coupling**: Maintain loose coupling between modules
4. **Global State**: Avoid global variables or singletons
5. **String-Based Types**: Move away from 'debit'/'credit' strings
6. **Floating-Point Arithmetic for Money**: ✅ RESOLVED - Use Money value object
7. **Currency Mixing**: ✅ PREVENTED - Money validates currency consistency

## 🔮 Future Architecture Considerations

### Proposed Improvements
1. **Repository Pattern**: For persistence layer
2. **Event Sourcing**: For complete audit trail
3. **CQRS**: Separate read/write models
4. **Dependency Injection**: For better testability
5. **Plugin Architecture**: For extensibility

### Migration Path
When implementing improvements:
1. Maintain backward compatibility
2. Deprecate old methods gradually
3. Provide migration guides
4. Version major changes properly

## 📐 Architectural Principles

### SOLID Principles Application
- **S**ingle Responsibility: Each class has one reason to change
- **O**pen/Closed: Open for extension (inheritance), closed for modification
- **L**iskov Substitution: Subclasses can replace base class
- **I**nterface Segregation: Not yet applicable (no interfaces)
- **D**ependency Inversion: Not yet implemented

### Domain-Driven Design
- **Entities**: Account (has identity via name)
- **Value Objects**: 
  - Money (immutable, precision-safe monetary values)
  - AccountNumber (future)
- **Aggregates**: JournalEntry aggregates entries
- **Domain Services**: MoneyUtils (distribution, calculations)
- **Factory Pattern**: CurrencyFactory (dynamic currency creation)

## 🎨 Code Style Rules

### JavaScript Specific
```javascript
// Use ES6+ features
import Account from './Account.js';  // ES modules
export default Account;               // Default exports

// Prefer const/let over var
const account = new Account();

// Use arrow functions for callbacks
entries.filter(e => e.type === 'debit');

// Destructuring when appropriate
const { name, balance } = account;
```

### Method Structure
```javascript
methodName(param1, param2) {
    // 1. Validation
    if (!param1) throw new Error('...');
    
    // 2. Business logic
    const result = this.calculate(param1);
    
    // 3. State mutation (if needed)
    this.state = result;
    
    // 4. Return value
    return result;
}
```

## 🔍 Code Review Checklist

Before submitting PRs, ensure:
- [ ] Follows existing patterns
- [ ] Includes JSDoc comments
- [ ] Has corresponding tests
- [ ] No breaking changes (or documented)
- [ ] Follows commit conventions
- [ ] Updates relevant documentation

---
*This document provides architectural context for AI assistants working on the project.*
