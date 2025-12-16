# 🤖 AI Agent Navigation Guide - BalanceBookJS

## Quick Start for AI Assistants

Welcome! You are working on **BalanceBookJS**, a TypeScript/JavaScript library implementing double-entry bookkeeping principles. This guide will help you navigate the project and understand where to find the information you need.

## 📍 Navigation Map

### 1️⃣ **FIRST STOP - Project Context**
```
📁 /docs/ai-context/
├── 📄 00-project-context.md         # START HERE - Essential project information
├── 📄 01-architecture-overview.md   # Current architecture and patterns
└── 📄 README.md                     # How to use this documentation system
```

**Always read these files first in any new session.**

### 2️⃣ **Source Code**
```
📁 /src/
├── 📄 index.ts                     # Main exports
├── 📁 classes/
│   ├── 📁 accounts/                 # Account classes (Account, Asset, Liability, etc.)
│   ├── 📁 transactions/             # Transaction classes (JournalEntry)
│   └── 📁 value-objects/            # Money, MoneyUtils, CurrencyFactory
├── 📁 persistence/                  # Persistence Layer (opt-in)
│   ├── 📄 interfaces.ts            # IAdapter, IQueryFilters
│   ├── 📄 Factory.ts               # Generates persistable classes
│   ├── 📄 PersistableMixin.ts      # Adds save/delete/find methods
│   └── 📁 adapters/                 # MemoryAdapter, FirebaseAdapter, SQLAdapter
├── 📁 types/                        # TypeScript type definitions
│   ├── 📄 account.types.ts         # Account interfaces
│   ├── 📄 transaction.types.ts     # Transaction interfaces
│   └── 📄 index.ts                 # Type exports
└── 📄 Constants.ts                 # Project constants and enums
```

### 3️⃣ **Improvements & Features**
```
📁 /docs/ai-context/
├── 📁 improvements/                 # Pending improvements
│   ├── 📄 _template.md             # Template for new improvements
│   ├── 📄 003-general-ledger.md
│   ├── 📄 004-financial-reports.md
│   ├── 📄 005-multi-currency.md
│   ├── 📄 006-accounting-periods.md
│   ├── 📄 007-validation-business-rules.md
│   ├── 📄 008-sql-adapter-relational-schema.md  # SQLAdapter redesign
│   └── 📄 009-mongodb-adapter.md                # MongoDB support
├── 📁 completed/                    # Completed improvements
│   ├── 📄 001-typescript-migration.md ✅
│   ├── 📄 002-money-value-object.md ✅
│   ├── 📄 008-persistence-layer.md ✅
│   └── 📄 009-persistence-adapters.md ✅
└── 📄 improvement-ideas-backlog.md # 100+ undeveloped ideas
```

### 3.5️⃣ **Migration & Adoption Guides**
```
📁 /docs/migration_guides/           # Guides for adopting new features
├── 📄 002_MONEY_OBJECTS_ADOPTION_GUIDES.md  # How to adopt Money (optional)
└── 📄 README.md                    # Index of migration guides
```
**Note**: These guides are for OPTIONAL feature adoption. We maintain backward compatibility, so migrations are never forced.

### 4️⃣ **Project Configuration**
```
📄 package.json                      # Dependencies and scripts
📄 tsconfig.json                     # TypeScript configuration
📄 tsconfig.cjs.json                # TypeScript config for CommonJS build
📄 README.md                         # User-facing documentation
📄 CONTRIBUTING.md                  # Contributing guidelines
📄 LICENSE                           # ISC License
```

### 5️⃣ **Tests**
```
📁 /tests/                           # Test files (TypeScript)
├── 📄 Account.test.ts              # Account class tests
├── 📄 AccountSubclasses.test.ts   # Asset, Liability, etc. tests
├── 📄 JournalEntry.test.ts        # JournalEntry tests
└── 📁 persistence/                  # Persistence layer tests
    ├── 📄 Factory.test.ts
    ├── 📄 MemoryAdapter.test.ts
    └── 📄 BulkOperations.test.ts
```

## 🎯 Common Tasks & Where to Go

### "I need to understand the project"
1. Read `/docs/ai-context/00-project-context.md`
2. Read `/docs/ai-context/01-architecture-overview.md`
3. Review `/README.md` for user documentation

### "I need to implement a new feature"
1. Check `/docs/ai-context/improvements/` for existing specs
2. Check `/docs/ai-context/improvement-ideas-backlog.md` for ideas
3. Use `/docs/ai-context/improvements/_template.md` to create new specs

### "I need to create adoption/migration guides"
1. Place guides in `/docs/migration_guides/`
2. Name format: `XXX_FEATURE_NAME_ADOPTION_GUIDES.md` (XXX = improvement number)
3. Focus on optional adoption, not forced migration
4. Include gradual adoption strategies

### "I need to understand the current code"
1. Start with `/src/index.ts` for exports
2. Review `/src/types/` for TypeScript interfaces
3. Review `/src/classes/accounts/Account.ts` for base logic
4. Review `/src/classes/transactions/JournalEntry.ts` for transactions
5. Review `/src/persistence/` for persistence layer

### "I need to work with persistence"
1. Read `/docs/ai-context/completed/008-persistence-layer.md` for architecture
2. Read `/docs/ai-context/completed/009-persistence-adapters.md` for adapters
3. Review `/src/persistence/interfaces.ts` for `IAdapter` interface
4. Check adapter status: MemoryAdapter ✅, FirebaseAdapter ✅, SQLAdapter ⚠️ (disabled)

### "I need to create a Pull Request"
1. Read `/CONTRIBUTING.md` for commit conventions
2. Follow Conventional Commits format: `type(scope): description`
3. Types: feat, fix, docs, style, refactor, perf, test, chore

## 💡 Important Context

### Key Design Principles
- **Double-Entry Bookkeeping**: Every transaction must balance (debits = credits)
- **Object-Oriented**: Clear class hierarchy with inheritance
- **No External Dependencies**: Keep the library lightweight (only dev dependencies)
- **Type Safety**: Full TypeScript with strict mode enabled
- **Dual Module Support**: ES Modules and CommonJS compatibility

### Account Types & Behavior
- **Assets & Expenses**: Debit increases, Credit decreases (`isDebitPositive = true`)
- **Liabilities, Equity & Income**: Credit increases, Debit decreases (`isDebitPositive = false`)

### Current Technical Stack
- **Language**: TypeScript (compiles to JavaScript)
- **Testing**: Jest with ts-jest
- **Build**: Pure TypeScript compilation (no bundlers)
- **Module Types**: ES Modules + CommonJS (dual build)
- **Node**: LTS (>= 18.x)
- **Type Checking**: Strict mode enabled

## 🚀 Quick Command Reference

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

## 📋 Working with Improvements

### To develop a new improvement from the backlog:
1. Read `/docs/ai-context/improvement-ideas-backlog.md`
2. Choose an idea number
3. **ASK THE DEVELOPER** for specific requirements
4. Create a new file in `/docs/ai-context/improvements/XXX-feature-name.md`
5. Use the template and be thorough

### To implement an existing improvement:
1. Read the specific improvement file
2. Follow its implementation steps
3. Create tests as specified
4. Submit PR with proper commit messages

## ⚠️ Critical Notes

1. **Always validate**: The library enforces double-entry principles
2. **Maintain compatibility**: Don't break existing API without documentation
3. **Ask questions**: When developing improvements, always ask for requirements first
4. **Type Safety**: All new code must be properly typed (no `any` unless absolutely necessary)
5. **Negative Amounts**: Currently prohibited - all amounts must be positive

## 🔄 Session Initialization Prompt

For new chat sessions, the developer might say:
```
"I'm working on BalanceBookJS at /path/to/project.
Read the AI agent guide at /AI_AGENT_README.md
Then read /docs/ai-context/00-project-context.md
and /docs/ai-context/01-architecture-overview.md"
```

## 📚 Documentation Philosophy

This project uses **prompt-oriented documentation**:
- Documents are written as instructions for AI agents
- Each improvement is self-contained with all context
- The backlog contains ideas that need developer input before specification
- Always prioritize asking questions over making assumptions

## 🎯 Your Role as an AI Assistant

1. **Understand first**: Always read the context documents
2. **Ask questions**: Don't assume requirements
3. **Follow patterns**: Maintain consistency with existing code
4. **Document thoroughly**: Future AI agents will read your work
5. **Test everything**: Include comprehensive test cases

## 🎉 Recent Updates

### Persistence Layer (v2.3.0 - 2025)
- ✅ Factory pattern for generating persistable classes
- ✅ Mixin pattern for adding save/delete/find methods
- ✅ MemoryAdapter for testing
- ✅ FirebaseAdapter for Firestore production use
- ✅ Bulk operations: `deleteMany()`, `updateMany()`
- ⚠️ SQLAdapter disabled pending relational schema redesign
- 📋 MongoDBAdapter planned

### TypeScript Migration (January 2025)
- ✅ Entire codebase migrated to TypeScript
- ✅ Dual build system (ES Modules + CommonJS)
- ✅ Full type definitions for all public APIs
- ✅ Strict mode enabled for maximum type safety
- ✅ All tests migrated and passing
- ❌ Webpack and Babel removed (simpler build)

---

**Remember**: You're not just coding, you're collaborating with both current and future developers (human and AI). Make your work clear, complete, and considerate.

*For detailed instructions on the documentation system, see `/docs/ai-context/README.md`*
