# Project Context: BalanceBookJS

## 🎯 AI Assistant Instructions
You are working on BalanceBookJS, a TypeScript/JavaScript library implementing double-entry bookkeeping principles. Read this document completely before proceeding with any tasks.

## 📚 Essential Reading Order
1. **This file** (00-project-context.md)
2. **Project README**: `/README.md`
3. **Contributing Guidelines**: `/CONTRIBUTING.md`
4. **Architecture Overview**: `/docs/ai-context/01-architecture-overview.md`

## 🏗️ Project Structure Overview

```
BalanceBookJS/
├── src/                          # Source code (TypeScript)
│   ├── index.ts                 # Main entry point and exports
│   ├── Constants.ts             # Project constants
│   ├── classes/                 # Core classes
│   │   ├── accounts/            # Account-related classes
│   │   │   ├── Account.ts       # Base account class (with Money integration)
│   │   │   ├── Asset.ts         # Asset account (debit positive)
│   │   │   ├── Liability.ts     # Liability account (credit positive)
│   │   │   ├── Equity.ts        # Equity account (credit positive)
│   │   │   ├── Income.ts        # Income account (credit positive)
│   │   │   └── Expense.ts       # Expense account (debit positive)
│   │   ├── transactions/        # Transaction-related classes
│   │   │   └── JournalEntry.ts  # Journal entry implementation
│   │   └── value-objects/       # Immutable value objects
│   │       ├── Money.ts         # Precision-safe money (BigInt)
│   │       ├── MoneyUtils.ts    # Money operations
│   │       └── CurrencyFactory.ts # Currency creation
│   ├── persistence/             # Persistence Layer (opt-in)
│   │   ├── interfaces.ts        # IAdapter, IQueryFilters interfaces
│   │   ├── Factory.ts           # Class factory for persistable classes
│   │   ├── PersistableMixin.ts  # Mixin adding save/delete/find methods
│   │   └── adapters/            # Storage adapters
│   │       ├── memory/          # MemoryAdapter (testing)
│   │       ├── firebase/        # FirebaseAdapter (Firestore)
│   │       └── sql/             # SQLAdapter (disabled in v2.3.0)
│   └── types/                   # TypeScript type definitions
├── lib/                         # Built/compiled output (ES Modules + CommonJS)
├── tests/                       # Test files (TypeScript)
├── docs/                        # Documentation
│   ├── ai-context/             # AI-specific documentation
│   └── migration_guides/       # Optional feature adoption guides
└── package.json                # Node.js configuration
```

## 🔧 Technical Stack
- **Language**: TypeScript (compiles to JavaScript)
- **Node Version**: LTS (>= 18.x recommended)
- **Module System**: ES Modules + CommonJS (dual build)
- **Testing**: Jest with ts-jest
- **Build Tool**: Pure TypeScript compilation (tsc) - no bundlers
- **Package Manager**: npm
- **Type Checking**: Strict mode enabled
- **Version**: 2.3.0

## 📦 Core Dependencies
- No runtime dependencies (pure TypeScript/JavaScript)
- Dev dependencies: TypeScript, Jest, ts-jest
- Optional peer dependencies: firebase-admin (for FirebaseAdapter), knex (for SQLAdapter)

## 🎨 Design Principles
1. **Double-Entry Bookkeeping**: Every transaction must balance (debits = credits)
2. **Object-Oriented Design**: Clear class hierarchy with inheritance
3. **No External Dependencies**: Keep the library lightweight (only dev/peer dependencies)
4. **Immutable Transactions**: Once committed, journal entries shouldn't change
5. **Type Safety**: Full TypeScript with strict mode enabled
6. **Backward Compatibility**: New features are opt-in, existing API preserved

## 📝 Commit Convention (IMPORTANT)
Follow Conventional Commits format strictly:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, perf, test, chore, build, ci

Example:
```
feat(journal-entry): add multi-currency support

Implement support for multi-currency transactions within journal entries.
```

## 🚀 Common Commands
```bash
# Install dependencies
npm install

# Run tests
npm test

# Build library (ES Modules + CommonJS)
npm run build

# Type check without building
npm run type-check

# Watch mode for development
npm run watch
```

## 📊 Accounting Domain Knowledge
Key concepts the AI should understand:
- **Debit/Credit Rules**:
  - Assets & Expenses: Debit increases, Credit decreases
  - Liabilities, Equity & Income: Credit increases, Debit decreases
- **Double-Entry**: Every transaction affects at least two accounts
- **Journal Entry**: Record of a complete transaction
- **Trial Balance**: Sum of all debits must equal sum of all credits

## ⚠️ Important Notes
1. The library uses `isDebitPositive` flag to determine account behavior
2. ✅ **RESOLVED**: Monetary precision handled via Money value object (BigInt internally)
3. When creating PRs, ensure commits follow the conventional format
4. The project is on GitHub at: `rafa3127/BalanceBookJS`
5. Money integration is backward compatible - accepts both numbers and Money objects

## 🎯 Current Project Goals
1. Maintain backwards compatibility with existing API
2. Improve type safety and error handling
3. Add comprehensive financial reporting capabilities
4. Ensure precision in monetary calculations
5. Keep the library lightweight and dependency-free

## 🔍 Where to Find Things
- **Account Logic**: `/src/classes/accounts/Account.ts` (with Money integration)
- **Transaction Logic**: `/src/classes/transactions/JournalEntry.ts` (accepts Money)
- **Money Implementation**: `/src/classes/value-objects/Money.ts`
- **Money Utilities**: `/src/classes/value-objects/MoneyUtils.ts`
- **Currency Factory**: `/src/classes/value-objects/CurrencyFactory.ts`
- **Persistence Layer**: `/src/persistence/` directory
- **Adapters**: `/src/persistence/adapters/` (memory, firebase, sql)
- **Type Definitions**: `/src/types/` directory (TypeScript)
- **Tests**: `/tests/` directory
- **Built Output**: `/lib/` directory
- **Improvement Plans**: `/docs/ai-context/improvements/`
- **Completed Improvements**: `/docs/ai-context/completed/`

## 🗄️ Persistence Layer (Opt-in Feature)
The library includes a flexible persistence layer using adapters:

### Available Adapters
| Adapter | Status | Use Case |
|---------|--------|----------|
| MemoryAdapter | ✅ Ready | Testing, development |
| FirebaseAdapter | ✅ Ready | Production with Firestore |
| SQLAdapter | ⚠️ Disabled (v2.3.0) | Pending relational schema redesign |
| MongoDBAdapter | 📋 Planned | Future release |

### Basic Usage
```typescript
import { Factory, MemoryAdapter } from 'balance-book-js/persistence';

const adapter = new MemoryAdapter();
const factory = new Factory(adapter);
const { Account, JournalEntry } = factory.createClasses();

// Now classes have persistence methods
const account = new Account('Cash', 1000, true);
await account.save();

const found = await Account.findById(account.id);
```

### Key Patterns
- **Factory Pattern**: Generates persistable classes from base classes
- **Mixin Pattern**: Adds `save()`, `delete()`, `findById()`, `findAll()` methods
- **Adapter Interface**: `IAdapter` with `get`, `save`, `delete`, `query`, `deleteMany`, `updateMany`

## 💡 Development Philosophy
- Prefer composition over deep inheritance where possible
- Keep methods pure when feasible
- Validate inputs early and fail fast with clear errors
- Document with JSDoc for better IDE support
- Write tests for all new features

## 🚦 Before Making Changes
1. Read the relevant improvement document if working on a specific feature
2. Check existing tests to understand current behavior
3. Ensure all tests pass before creating a PR
4. Follow the commit message convention strictly
5. Update documentation as needed

---
*This document should be read by AI assistants at the start of every session.*
