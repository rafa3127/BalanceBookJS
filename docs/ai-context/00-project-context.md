# Project Context: BalanceBookJS

## 🎯 AI Assistant Instructions
You are working on BalanceBookJS, a JavaScript library implementing double-entry bookkeeping principles. Read this document completely before proceeding with any tasks.

## 📚 Essential Reading Order
1. **This file** (00-project-context.md)
2. **Project README**: `/README.md`
3. **Contributing Guidelines**: `/CONTRIBUTING.md`
4. **Architecture Overview**: `/docs/ai-context/01-architecture-overview.md`

## 🏗️ Project Structure Overview

```
BalanceBookJS/
├── src/                          # Source code
│   ├── index.js                 # Main entry point and exports
│   ├── Constants.js             # Project constants (currently empty)
│   └── classes/                 # Core classes
│       ├── accounts/            # Account-related classes
│       │   ├── Account.js       # Base account class
│       │   ├── Asset.js         # Asset account (debit positive)
│       │   ├── Liability.js     # Liability account (credit positive)
│       │   ├── Equity.js        # Equity account (credit positive)
│       │   ├── Income.js        # Income account (credit positive)
│       │   └── Expense.js       # Expense account (debit positive)
│       └── transactions/        # Transaction-related classes
│           └── JournalEntry.js  # Journal entry implementation
├── lib/                         # Built/compiled output
├── tests/                       # Test files
├── docs/                        # Documentation
│   └── ai-context/             # AI-specific documentation
└── package.json                # Node.js configuration
```

## 🔧 Technical Stack
- **Language**: JavaScript (ES6+ Modules)
- **Node Version**: LTS (>= 18.x recommended)
- **Module System**: ES Modules (`"type": "module"` in package.json)
- **Testing**: Jest with experimental VM modules
- **Build Tool**: Webpack with Babel
- **Package Manager**: npm
- **Version**: 1.1.0

## 📦 Core Dependencies
- No runtime dependencies (pure JavaScript)
- Dev dependencies: Babel, Jest, Webpack

## 🎨 Design Principles
1. **Double-Entry Bookkeeping**: Every transaction must balance (debits = credits)
2. **Object-Oriented Design**: Clear class hierarchy with inheritance
3. **No External Dependencies**: Keep the library lightweight
4. **Immutable Transactions**: Once committed, journal entries shouldn't change
5. **Type Safety**: Moving towards TypeScript for better type checking

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

# Build library
npm run build

# Start development
npm start
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
2. All monetary amounts are currently handled as JavaScript numbers (potential precision issues)
3. When creating PRs, ensure commits follow the conventional format
4. The project is on GitHub at: `rafa3127/BalanceBookJS`

## 🎯 Current Project Goals
1. Maintain backwards compatibility with existing API
2. Improve type safety and error handling
3. Add comprehensive financial reporting capabilities
4. Ensure precision in monetary calculations
5. Keep the library lightweight and dependency-free

## 🔍 Where to Find Things
- **Account Logic**: `/src/classes/accounts/Account.js`
- **Transaction Logic**: `/src/classes/transactions/JournalEntry.js`
- **Type Definitions**: Currently in JSDoc comments (moving to TypeScript)
- **Tests**: `/tests/` directory
- **Built Output**: `/lib/` directory
- **Improvement Plans**: `/docs/ai-context/improvements/`

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
