# 🤖 AI Agent Navigation Guide - BalanceBookJS

## Quick Start for AI Assistants

Welcome! You are working on **BalanceBookJS**, a JavaScript library implementing double-entry bookkeeping principles. This guide will help you navigate the project and understand where to find the information you need.

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
├── 📄 index.js                      # Main exports
├── 📁 classes/
│   ├── 📁 accounts/                 # Account classes (Account, Asset, Liability, etc.)
│   └── 📁 transactions/             # Transaction classes (JournalEntry)
└── 📄 Constants.js                  # Project constants
```

### 3️⃣ **Improvements & Features**
```
📁 /docs/ai-context/
├── 📁 improvements/                 # Fully documented improvements
│   ├── 📄 _template.md             # Template for new improvements
│   ├── 📄 001-typescript-migration.md
│   ├── 📄 002-money-value-object.md
│   ├── 📄 003-general-ledger.md
│   ├── 📄 004-financial-reports.md
│   ├── 📄 005-multi-currency.md
│   ├── 📄 006-accounting-periods.md
│   └── 📄 007-validation-business-rules.md
├── 📁 completed/                    # Completed improvements (currently empty)
└── 📄 improvement-ideas-backlog.md # 100+ undeveloped ideas
```

### 4️⃣ **Project Configuration**
```
📄 package.json                      # Dependencies and scripts
📄 README.md                         # User-facing documentation
📄 CONTRIBUITING.md                  # Contributing guidelines (note the typo!)
📄 LICENSE                           # ISC License
```

### 5️⃣ **Tests**
```
📁 /tests/                           # Test files
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

### "I need to understand the current code"
1. Start with `/src/index.js` for exports
2. Review `/src/classes/accounts/Account.js` for base logic
3. Review `/src/classes/transactions/JournalEntry.js` for transactions

### "I need to create a Pull Request"
1. Read `/CONTRIBUITING.md` for commit conventions
2. Follow Conventional Commits format: `type(scope): description`
3. Types: feat, fix, docs, style, refactor, perf, test, chore

## 💡 Important Context

### Key Design Principles
- **Double-Entry Bookkeeping**: Every transaction must balance (debits = credits)
- **Object-Oriented**: Clear class hierarchy with inheritance
- **No External Dependencies**: Keep the library lightweight
- **ES Modules**: Using modern JavaScript module system

### Account Types & Behavior
- **Assets & Expenses**: Debit increases, Credit decreases (`isDebitPositive = true`)
- **Liabilities, Equity & Income**: Credit increases, Debit decreases (`isDebitPositive = false`)

### Current Technical Stack
- **Language**: JavaScript (ES6+)
- **Testing**: Jest
- **Build**: Webpack with Babel
- **Module Type**: ES Modules
- **Node**: LTS (>= 18.x)

## 🚀 Quick Command Reference

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

1. **File name typo**: Contributing file is `CONTRIBUITING.md` (not CONTRIBUTING.md)
2. **Always validate**: The library enforces double-entry principles
3. **Maintain compatibility**: Don't break existing API without documentation
4. **Ask questions**: When developing improvements, always ask for requirements first

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

---

**Remember**: You're not just coding, you're collaborating with both current and future developers (human and AI). Make your work clear, complete, and considerate.

*For detailed instructions on the documentation system, see `/docs/ai-context/README.md`*
