# Improvement: Config-Based Constructors (v3.0)

## AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature. This is a **breaking change** that modernizes the constructor API to use configuration objects, enabling extensibility and better TypeScript support.

## Overview
**Priority**: High
**Category**: Breaking Change / API Redesign
**Complexity**: Medium
**Breaking Change**: Yes (all class constructors change)
**Status**: Completed (v3.0.0)
**Target Version**: 3.0.0

### Brief Description
Replace positional parameter constructors with configuration object constructors across all core classes (Account, Asset, Liability, Equity, Income, Expense, JournalEntry). This enables users to extend classes with custom fields while maintaining full TypeScript type safety.

### Why This Is Needed

**Current Problem:**
```typescript
// Current API - positional parameters, not extensible
new Asset('Cash', 1000, 'USD')

// If user wants to add custom fields, they can't pass them to constructor
class MyAsset extends Asset {
    category: string;
    // No clean way to initialize category via constructor
}
```

**After This Change:**
```typescript
// New API - config object, fully extensible
new Asset({ name: 'Cash', balance: 1000, currency: 'USD' })

// Users can extend with custom required fields
interface MyAssetConfig extends AssetConfig {
    category: string;  // Required
    tags?: string[];   // Optional
}

class MyAsset extends Asset {
    category: string;
    tags: string[];

    constructor(config: MyAssetConfig) {
        super(config);
        this.category = config.category;
        this.tags = config.tags ?? [];
    }
}

// TypeScript enforces category is required
new MyAsset({ name: 'Cash', balance: 1000, category: 'bank' })
```

## Success Criteria
- [ ] All core classes use config object constructors
- [ ] Full backward compatibility for serialization/deserialization
- [ ] TypeScript interfaces exported for all config types
- [ ] Users can extend config interfaces for custom fields
- [ ] All existing tests updated and passing
- [ ] Migration guide from v2 to v3
- [ ] `fromData()` static methods updated to use new constructors

## Technical Design

### Config Interfaces

```typescript
// src/types/config.types.ts

import { Money } from '../classes/value-objects/Money';

/**
 * Base configuration for all accounts
 */
export interface AccountConfig {
    /** Account name (required) */
    name: string;

    /** Initial balance - number or Money object */
    balance?: number | Money;

    /** Whether debits increase the balance */
    isDebitPositive: boolean;

    /** Currency code for number mode (default: 'CURR') */
    currency?: string;

    /** Allow extra fields for extensibility */
    [key: string]: any;
}

/**
 * Configuration for Asset accounts
 * Assets: Debits increase, Credits decrease
 */
export interface AssetConfig extends Omit<AccountConfig, 'isDebitPositive'> {
    // isDebitPositive is always true for Assets
}

/**
 * Configuration for Liability accounts
 * Liabilities: Credits increase, Debits decrease
 */
export interface LiabilityConfig extends Omit<AccountConfig, 'isDebitPositive'> {
    // isDebitPositive is always false for Liabilities
}

/**
 * Configuration for Equity accounts
 * Equity: Credits increase, Debits decrease
 */
export interface EquityConfig extends Omit<AccountConfig, 'isDebitPositive'> {
    // isDebitPositive is always false for Equity
}

/**
 * Configuration for Income/Revenue accounts
 * Income: Credits increase, Debits decrease
 */
export interface IncomeConfig extends Omit<AccountConfig, 'isDebitPositive'> {
    // isDebitPositive is always false for Income
}

/**
 * Configuration for Expense accounts
 * Expenses: Debits increase, Credits decrease
 */
export interface ExpenseConfig extends Omit<AccountConfig, 'isDebitPositive'> {
    // isDebitPositive is always true for Expenses
}

/**
 * Configuration for Journal Entry
 */
export interface JournalEntryConfig {
    /** Optional ID (generated if not provided) */
    id?: string;

    /** Entry date (default: now) */
    date?: Date;

    /** Description of the transaction */
    description?: string;

    /** Reference number */
    reference?: string;

    /** Allow extra fields for extensibility */
    [key: string]: any;
}
```

### Updated Account Class

```typescript
// src/classes/accounts/Account.ts

import { AccountConfig } from '../../types/config.types';
import { Money } from '../value-objects/Money';

class Account implements IAccountInternal, ISerializable {
    public readonly name: string;
    protected balanceMoney: Money;
    protected readonly initialMode: 'number' | 'money';
    readonly isDebitPositive: boolean;

    // Store extra fields
    readonly [key: string]: any;

    constructor(config: AccountConfig) {
        // Validate required fields
        if (!config.name || config.name.trim().length === 0) {
            throw new Error('Account name cannot be empty');
        }

        this.name = config.name;
        this.isDebitPositive = config.isDebitPositive;

        // Setup balance
        const balance = config.balance ?? 0;
        const currency = config.currency ?? 'CURR';

        if (Money.isMoney(balance)) {
            if (balance.isNegative()) {
                throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
            }
            this.initialMode = 'money';
            this.balanceMoney = balance;
        } else {
            if (balance < 0) {
                throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
            }
            this.initialMode = 'number';
            this.balanceMoney = new Money(balance, currency);
        }

        // Store extra fields (excluding known config keys)
        const knownKeys = ['name', 'balance', 'isDebitPositive', 'currency'];
        for (const [key, value] of Object.entries(config)) {
            if (!knownKeys.includes(key)) {
                (this as any)[key] = value;
            }
        }
    }

    // ... rest of methods remain the same ...

    public serialize(): any {
        const base = {
            name: this.name,
            type: (this as any).type || 'ACCOUNT',
            balance: this.balanceMoney.toJSON(),
            isDebitPositive: this.isDebitPositive,
            initialMode: this.initialMode,
            currency: this.balanceMoney.currency
        };

        // Include extra fields
        const knownKeys = ['name', 'balanceMoney', 'initialMode', 'isDebitPositive', 'type'];
        for (const key of Object.keys(this)) {
            if (!knownKeys.includes(key) && !key.startsWith('_')) {
                base[key] = (this as any)[key];
            }
        }

        return base;
    }

    public static fromData(data: any): Account {
        let balance: number | Money = 0;

        if (data.balance) {
            if (data.initialMode === 'number') {
                balance = data.balance.amount;
            } else {
                balance = new Money(
                    data.balance.amount,
                    data.balance.currency || data.currency
                );
            }
        }

        // Pass all data as config - extra fields will be preserved
        return new Account({
            ...data,
            balance,
            currency: data.currency || 'CURR'
        });
    }
}
```

### Updated Asset Class

```typescript
// src/classes/accounts/Asset.ts

import { AssetConfig } from '../../types/config.types';
import Account from './Account';

class Asset extends Account {
    readonly type = 'ASSET';

    constructor(config: AssetConfig) {
        super({
            ...config,
            isDebitPositive: true  // Assets always debit-positive
        });
    }

    public static fromData(data: any): Asset {
        let balance: number | Money = 0;

        if (data.balance) {
            if (data.initialMode === 'number') {
                balance = data.balance.amount;
            } else {
                balance = new Money(
                    data.balance.amount,
                    data.balance.currency || data.currency
                );
            }
        }

        return new Asset({
            ...data,
            balance,
            currency: data.currency || 'CURR'
        });
    }
}
```

### Usage Examples

```typescript
// Basic usage
const cash = new Asset({ name: 'Cash', balance: 1000, currency: 'USD' });

// With Money object
const bank = new Asset({
    name: 'Bank Account',
    balance: new Money(5000, 'USD')
});

// Extended by user
interface MyAssetConfig extends AssetConfig {
    category: string;
    department?: string;
    purchaseDate?: Date;
}

class MyAsset extends Asset {
    category: string;
    department: string;
    purchaseDate: Date | null;

    constructor(config: MyAssetConfig) {
        super(config);
        this.category = config.category;
        this.department = config.department ?? 'general';
        this.purchaseDate = config.purchaseDate ?? null;
    }
}

// TypeScript enforces required fields
const computer = new MyAsset({
    name: 'Office Computer',
    balance: 1500,
    currency: 'USD',
    category: 'equipment',  // Required by MyAssetConfig
    department: 'IT',
    purchaseDate: new Date('2024-01-15')
});

// This would be a TypeScript error:
// const invalid = new MyAsset({ name: 'Test', balance: 100 });
// Error: Property 'category' is missing
```

## Implementation Steps

### Phase 1: Core Changes
1. [ ] Create `src/types/config.types.ts` with all config interfaces
2. [ ] Update `Account.ts` to use `AccountConfig`
3. [ ] Update `Asset.ts` to use `AssetConfig`
4. [ ] Update `Liability.ts` to use `LiabilityConfig`
5. [ ] Update `Equity.ts` to use `EquityConfig`
6. [ ] Update `Income.ts` to use `IncomeConfig`
7. [ ] Update `Expense.ts` to use `ExpenseConfig`
8. [ ] Update `JournalEntry.ts` to use `JournalEntryConfig`

### Phase 2: Persistence Layer
9. [ ] Update `Factory.ts` to handle new constructors
10. [ ] Update `PersistableMixin.ts` if needed
11. [ ] Update `fromData()` methods in all classes
12. [ ] Ensure extra fields are serialized/deserialized

### Phase 3: Testing
13. [ ] Update all existing tests to use new constructor syntax
14. [ ] Add tests for custom field extension
15. [ ] Add tests for TypeScript type safety (compile-time)
16. [ ] Test serialization/deserialization with extra fields

### Phase 4: Documentation
17. [ ] Update README.md with new constructor syntax
18. [ ] Create migration guide (v2 → v3)
19. [ ] Update ai-context documentation
20. [ ] Add examples for extending classes

## Migration Guide (v2 → v3)

### Account Classes

```typescript
// v2 (positional parameters)
new Account('Cash', 1000, true, 'USD')
new Asset('Cash', 1000, 'USD')
new Liability('Loan', 5000, 'USD')

// v3 (config object)
new Account({ name: 'Cash', balance: 1000, isDebitPositive: true, currency: 'USD' })
new Asset({ name: 'Cash', balance: 1000, currency: 'USD' })
new Liability({ name: 'Loan', balance: 5000, currency: 'USD' })
```

### JournalEntry

```typescript
// v2
const entry = new JournalEntry();
entry.date = new Date();
entry.description = 'Sale';

// v3
const entry = new JournalEntry({
    date: new Date(),
    description: 'Sale'
});
```

### With Persistence Layer

```typescript
// v2
const factory = new Factory(adapter);
const { Asset } = factory.createClasses();
const cash = new Asset('Cash', 1000, 'USD');

// v3 (same Factory API, new constructor)
const factory = new Factory(adapter);
const { Asset } = factory.createClasses();
const cash = new Asset({ name: 'Cash', balance: 1000, currency: 'USD' });
```

## Breaking Changes Summary

| Component | v2 Signature | v3 Signature |
|-----------|--------------|--------------|
| Account | `(name, balance, isDebitPositive, currency)` | `({ name, balance?, isDebitPositive, currency? })` |
| Asset | `(name, balance, currency)` | `({ name, balance?, currency? })` |
| Liability | `(name, balance, currency)` | `({ name, balance?, currency? })` |
| Equity | `(name, balance, currency)` | `({ name, balance?, currency? })` |
| Income | `(name, balance, currency)` | `({ name, balance?, currency? })` |
| Expense | `(name, balance, currency)` | `({ name, balance?, currency? })` |
| JournalEntry | `()` | `({ date?, description?, reference? })` |

## Notes

- This change enables the extensibility pattern that users have been requesting
- The `[key: string]: any` index signature allows extra fields while maintaining type safety for known fields
- Serialization automatically includes extra fields
- Users extending classes get full TypeScript support for their custom required/optional fields
- No changes to the persistence layer API (Factory, adapters)

## Related Improvements
- 008-sql-adapter-relational-schema.md - May need updates for extra field handling
- 009-mongodb-adapter.md - Already handles extra fields well (document-based)
