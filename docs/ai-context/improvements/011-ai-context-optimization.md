# Improvement 011: AI Context Optimization

## 🎯 AI Assistant Instructions
This improvement restructures the AI context documentation to reduce token consumption at session start. Instead of loading all documentation upfront, agents will load a lightweight index and only fetch detailed module docs when needed.

## 📋 Overview
**Priority**: Low
**Category**: Documentation / DX
**Complexity**: Low
**Breaking Change**: No
**Status**: Planning

## 🎯 Success Criteria
- [ ] Create lightweight `AGENT_INDEX.md` (~50-80 lines)
- [ ] Create `modules/` folder with detailed documentation per area
- [ ] Reduce initial context load by 60-80%
- [ ] Maintain all existing information (just reorganized)
- [ ] Update any references to old structure

## 📐 Technical Design

### Current State
- `00-project-context.md` loads ~140 lines and references other files
- Agent typically loads 5,000+ lines before knowing session topic
- ~47K tokens in ai-context folder total

### Target Structure
```
docs/ai-context/
├── AGENT_INDEX.md              # (~50-80 lines) Entry point for agents
│
├── modules/                     # Detailed docs (load on demand)
│   ├── core-accounting.md       # Account, JournalEntry, debit/credit rules
│   ├── money-system.md          # Money, MoneyUtils, currencies
│   ├── persistence.md           # Factory, Adapters, IAdapter interface
│   └── architecture.md          # Project structure, build, exports
│
├── improvements/                # (keep as-is)
└── completed/                   # (keep as-is)
```

### AGENT_INDEX.md Content

```markdown
# BalanceBookJS - AI Agent Index

Double-entry bookkeeping library in TypeScript.

## Quick Facts
- Version: 2.2.0
- Language: TypeScript (ES Modules + CommonJS)
- Testing: Jest
- Build: Webpack + Babel

## Module Reference

| Module | Doc | Load when... |
|--------|-----|--------------|
| Core Accounting | `modules/core-accounting.md` | Working on Account, JournalEntry, debit/credit |
| Money System | `modules/money-system.md` | Working on Money, currencies, precision |
| Persistence | `modules/persistence.md` | Working on adapters, Factory, save/query |
| Architecture | `modules/architecture.md` | Build issues, exports, folder structure |

## Key Conventions
- Conventional commits required
- No runtime deps in core
- Backward compatibility required
- Tests must pass before PR

## Planning Work
- Active improvements: `improvements/`
- Completed features: `completed/`

## Source Locations
- Accounts: `src/classes/accounts/`
- Transactions: `src/classes/transactions/`
- Money: `src/classes/value-objects/`
- Persistence: `src/persistence/`
- Tests: `tests/`
```

## 🔄 Implementation Phases

### Phase 1: Create Module Docs
Extract from existing docs into focused files:

1. **core-accounting.md** (~200 lines)
   - Account class API and behavior
   - Specialized accounts (Asset, Liability, etc.)
   - JournalEntry usage
   - Debit/Credit rules
   - Source file locations

2. **money-system.md** (~200 lines)
   - Money value object
   - MoneyUtils
   - createCurrency factory
   - Supported currencies
   - Backward compatibility notes

3. **persistence.md** (~250 lines)
   - Factory pattern
   - MemoryAdapter
   - FirebaseAdapter (config, limitations)
   - SQLAdapter (config, dialect notes)
   - IAdapter interface for custom adapters
   - Known limitations and tech debt

4. **architecture.md** (~150 lines)
   - Folder structure
   - Build process
   - Module exports
   - TypeScript config
   - Testing setup

### Phase 2: Create Index
- Write `AGENT_INDEX.md`
- Keep it under 80 lines
- Include clear "when to load" guidance

### Phase 3: Update References
- Update any system prompts referencing old files
- Archive or remove redundant files
- Update `00-project-context.md` to point to new structure (or replace it)

## 💡 Design Decisions

### Why not just compress existing docs?
- Compression loses clarity
- Modular approach allows selective loading
- Easier to maintain per-topic

### Why keep improvements/ and completed/ separate?
- They serve different purposes (planning vs history)
- Already well-organized
- Not loaded unless working on specific feature

### Index vs project-context.md
- Index is agent-optimized (table-based, scannable)
- project-context.md was human-readable narrative
- Index replaces project-context as entry point

## 📊 Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Initial load | ~5,000 lines | ~80 lines |
| Focused session | ~5,000 lines | ~300-400 lines |
| Full context (if needed) | ~5,000 lines | ~5,000 lines |

Token savings: **60-80%** for typical focused sessions.

## ⚠️ Considerations

### Maintenance
- When adding features, update relevant module doc
- Keep index synchronized with modules
- Review quarterly for accuracy

### Agent Behavior
- Agents must be instructed to check index first
- System prompt should reference `AGENT_INDEX.md`
- Agents should state which module they're loading

## 🔗 Related
- Improvement 010: Developer Guide Documentation (user-facing docs)
- This improvement focuses on AI/agent-facing docs
