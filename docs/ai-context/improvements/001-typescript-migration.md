# Improvement: TypeScript Migration

## 🎯 AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature. This is a foundational change that will affect all future development.

## 📋 Overview
**Priority**: High  
**Category**: Architecture  
**Complexity**: Complex  
**Breaking Change**: No (will maintain JavaScript compatibility)

### Brief Description
Migrate the entire codebase from JavaScript to TypeScript to provide better type safety, improved IDE support, and catch errors at compile-time. This will establish a stronger foundation for future features and make the library more maintainable.

## 🎯 Success Criteria
- [ ] All existing JavaScript code converted to TypeScript
- [ ] Type definitions for all public APIs
- [ ] Maintain backward compatibility with JavaScript consumers
- [ ] Zero runtime dependencies added
- [ ] Build process generates both ES modules and type definitions
- [ ] All existing tests pass

## 📐 Technical Design

### Proposed Solution
Gradual migration approach:
1. Set up TypeScript configuration
2. Rename files from `.js` to `.ts`
3. Add type annotations progressively
4. Create interfaces for domain concepts

### New Interfaces
```typescript
interface IAccount {
    name: string;
    balance: number;
    debit(amount: number): void;
    credit(amount: number): void;
    getBalance(): number;
}

interface IJournalEntry {
    description: string;
    date: Date;
    addEntry(account: IAccount, amount: number, type: EntryType): void;
    commit(): void;
    getDetails(): EntryDetail[];
}

type EntryType = 'debit' | 'credit';

interface EntryDetail {
    accountName: string;
    amount: number;
    type: EntryType;
    date: Date;
    description: string;
}
```

### File Structure Changes
```
src/
├── index.ts
├── types/
│   ├── index.ts
│   ├── account.types.ts
│   └── transaction.types.ts
└── classes/
    ├── accounts/
    │   ├── Account.ts
    │   ├── Asset.ts
    │   └── ...
    └── transactions/
        └── JournalEntry.ts
```

### Build Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./lib",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "lib", "tests"]
}
```

## 🔄 Implementation Steps

1. **Install TypeScript Dependencies**
   ```bash
   npm install --save-dev typescript @types/node @types/jest ts-jest
   ```

2. **Create TypeScript Configuration**
   - Add `tsconfig.json`
   - Update `jest.config.js` for TypeScript support
   - Update build scripts in `package.json`

3. **Create Type Definitions**
   - Define interfaces for core concepts
   - Create type aliases for common types
   - Add enum for entry types

4. **Migrate Account Classes**
   ```typescript
   // Account.ts
   export default class Account implements IAccount {
       public readonly name: string;
       protected balance: number;
       protected readonly isDebitPositive: boolean;

       constructor(name: string, initialBalance: number, isDebitPositive: boolean) {
           this.name = name;
           this.balance = initialBalance;
           this.isDebitPositive = isDebitPositive;
       }

       public debit(amount: number): void {
           if (amount < 0) throw new Error('Amount must be positive');
           this.balance += this.isDebitPositive ? amount : -amount;
       }

       public credit(amount: number): void {
           if (amount < 0) throw new Error('Amount must be positive');
           this.balance += this.isDebitPositive ? -amount : amount;
       }

       public getBalance(): number {
           return this.balance;
       }
   }
   ```

5. **Migrate JournalEntry Class**
   - Add proper types for entries array
   - Type the validation logic
   - Ensure type safety in commit method

6. **Update Build Process**
   - Replace Babel with TypeScript compiler
   - Update Webpack configuration
   - Ensure .d.ts files are generated

## 🧪 Testing Requirements

### Type Testing
```typescript
// type-tests.ts
import { Account, Asset, JournalEntry } from '../src';

// Should compile without errors
const account: Account = new Asset('Cash', 1000);
const balance: number = account.getBalance();

// Should show type errors (in IDE/compiler)
// @ts-expect-error
account.debit('invalid'); // amount must be number
```

### Existing Test Migration
- Update test files to `.ts`
- Add type annotations to test code
- Ensure all existing tests pass

## 📦 Dependencies
- [ ] New dev dependency: typescript
- [ ] New dev dependency: @types/node
- [ ] New dev dependency: @types/jest
- [ ] New dev dependency: ts-jest

## 🔄 Migration Guide
No migration needed for JavaScript users. TypeScript users will get automatic type definitions.

## 📚 Documentation Updates
- [ ] Update README with TypeScript examples
- [ ] Add section on TypeScript usage
- [ ] Document type definitions
- [ ] Update contribution guide for TypeScript

## ⚠️ Risks & Considerations
- Build time will increase slightly
- Need to maintain type definitions going forward
- Contributors will need TypeScript knowledge
- Must ensure JavaScript backward compatibility

## 🔗 Related Improvements
- Prerequisite for: Money Value Object (002)
- Prerequisite for: Most other improvements

## ✅ Acceptance Checklist
- [ ] All files migrated to TypeScript
- [ ] No any types (except where absolutely necessary)
- [ ] Type definitions exported correctly
- [ ] JavaScript consumers can still use the library
- [ ] Build process working correctly
- [ ] All tests passing
- [ ] Documentation updated

## 🎯 Example Usage
```typescript
// TypeScript usage with full type safety
import { Asset, Liability, JournalEntry } from 'balancebookjs';

const cash: Asset = new Asset('Cash', 1000);
const loan: Liability = new Liability('Bank Loan', 5000);

const entry: JournalEntry = new JournalEntry('Loan Payment');
entry.addEntry(loan, 500, 'debit');
entry.addEntry(cash, 500, 'credit');
entry.commit();

// Type safety
const balance: number = cash.getBalance(); // TypeScript knows this returns number
```

---
*Status: Not Started*  
*Assigned: Unassigned*  
*PR: N/A*
