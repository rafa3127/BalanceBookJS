# Improvement 010: Developer Guide Documentation

## 🎯 AI Assistant Instructions
This improvement restructures the documentation by extracting detailed API documentation from README.md into a dedicated `docs/developer-guide/` folder, making the README concise and the documentation more navigable.

## 📋 Overview
**Priority**: Medium
**Category**: Documentation
**Complexity**: Low
**Breaking Change**: No
**Status**: Planning

## 🎯 Success Criteria
- [ ] Create `docs/developer-guide/` folder structure
- [ ] Extract Account/JournalEntry documentation to `accounts.md` and `journal-entries.md`
- [ ] Extract Money documentation to `money.md`
- [ ] Extract Persistence documentation to `persistence.md`
- [ ] Create `getting-started.md` with quick start guide
- [ ] Reduce README.md to overview + quick start + documentation links
- [ ] Update `00-project-context.md` to reference new structure

## 📐 Technical Design

### Current State
- README.md has ~760 lines
- All documentation in single file
- Hard to navigate for specific topics

### Target Structure
```
docs/
├── ai-context/                    # (Keep) Internal for AI assistants
│   ├── 00-project-context.md
│   ├── 01-architecture-overview.md
│   ├── completed/
│   └── improvements/
│
├── developer-guide/               # (New) Developer documentation
│   ├── getting-started.md         # Installation, prerequisites, quick example
│   ├── accounts.md                # Account, Asset, Liability, Equity, Income, Expense
│   ├── journal-entries.md         # JournalEntry API, examples
│   ├── money.md                   # Money, MoneyUtils, createCurrency, currencies
│   └── persistence.md             # Factory, Adapters (Memory, Firebase, SQL), custom adapters
│
└── migration/                     # Migration guides
    └── (future migration docs)
```

### README.md Target (~150-200 lines)
1. **Header + Badges** (~5 lines)
2. **Brief description** (~3 lines)
3. **Features** - bullet list (~15 lines)
4. **Quick Start** - minimal working example (~40 lines)
5. **Documentation** - table with links to developer-guide/ (~20 lines)
6. **Version/Changelog** - current version + link to releases (~10 lines)
7. **Contributing + License** (~10 lines)

## 🔄 Implementation Phases

### Phase 1: Create Developer Guide Structure
1. Create `docs/developer-guide/` folder
2. Create placeholder files with headers

### Phase 2: Extract Content
1. **getting-started.md**
   - Prerequisites
   - Installation (npm/yarn)
   - Basic import examples (ESM, CommonJS, TypeScript)
   - Minimal working example

2. **accounts.md**
   - Account base class API
   - Specialized accounts (Asset, Liability, Equity, Income, Expense)
   - Debit/Credit rules explanation
   - Examples

3. **journal-entries.md**
   - JournalEntry constructor and methods
   - Adding entries
   - Committing transactions
   - Getting details
   - Error handling
   - Examples

4. **money.md**
   - Money value object
   - MoneyUtils utility class
   - createCurrency factory
   - Supported currencies
   - Custom currency registration
   - Backward compatibility notes
   - Examples

5. **persistence.md**
   - Factory pattern usage
   - MemoryAdapter
   - FirebaseAdapter
   - SQLAdapter
   - Creating custom adapters (IAdapter interface)
   - Important notes and limitations
   - Examples

### Phase 3: Reduce README
1. Keep only essential overview content
2. Add documentation links table
3. Simplify version section

### Phase 4: Update AI Context
1. Update `00-project-context.md` to mention `docs/developer-guide/`
2. Add note that developer-guide is public, ai-context is internal

## 💡 Design Decisions

### Why `developer-guide/` instead of `guide/` or `api/`?
- Clearly indicates audience (developers using the library)
- Distinguishes from `ai-context/` (internal)
- More descriptive than generic `docs/` or `api/`

### Why not use a documentation generator (TypeDoc, etc.)?
- Current project size doesn't warrant the overhead
- Markdown files are simpler to maintain
- GitHub renders markdown automatically
- Can migrate to generator later if needed

### Content Organization
- Each file focuses on one major feature area
- Cross-references between files where relevant
- Examples in every file

## ⚠️ Important Considerations

### Links
- Use relative links between documentation files
- README links should work from GitHub root

### Maintenance
- When adding new features, update relevant guide file
- Keep README minimal - details go in developer-guide

## 📊 Success Metrics
- README.md reduced to <200 lines
- All current documentation preserved in developer-guide/
- Links work correctly from GitHub
- Easy navigation between topics
