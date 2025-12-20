# Migration Guide: v2.x to v3.0

This guide helps you update your code from BalanceBookJS v2.x (positional parameters) to v3.0 (config-based constructors).

## Overview of Changes

v3.0 introduces **config-based constructors** for all classes. This is a **breaking change** that affects how you instantiate accounts and journal entries.

### Benefits of v3.0

- **Extensibility**: Add custom fields that automatically serialize/deserialize
- **Readability**: Named properties are clearer than positional parameters
- **TypeScript**: Exported config interfaces for type-safe custom fields
- **Flexibility**: Optional parameters don't require placeholders

## Quick Migration Reference

### Account (Base Class)

```javascript
// v2.x
new Account('Cash', 1000, true, 'USD')

// v3.0
new Account({
  name: 'Cash',
  balance: 1000,
  isDebitPositive: true,
  currency: 'USD'
})
```

### Asset

```javascript
// v2.x
new Asset('Cash', 1000, 'USD')
new Asset('Bank')  // default balance

// v3.0
new Asset({ name: 'Cash', balance: 1000, currency: 'USD' })
new Asset({ name: 'Bank' })  // default balance
```

### Liability, Equity, Income, Expense

Same pattern as Asset:

```javascript
// v2.x
new Liability('Loan', 5000)
new Equity('Capital', 10000)
new Income('Sales')
new Expense('Rent', 0, 'USD')

// v3.0
new Liability({ name: 'Loan', balance: 5000 })
new Equity({ name: 'Capital', balance: 10000 })
new Income({ name: 'Sales' })
new Expense({ name: 'Rent', currency: 'USD' })
```

### JournalEntry

```javascript
// v2.x
new JournalEntry('Monthly rent', new Date('2025-01-15'))
new JournalEntry('Sale')  // default date

// v3.0
new JournalEntry({
  description: 'Monthly rent',
  date: new Date('2025-01-15')
})
new JournalEntry({ description: 'Sale' })  // default date
```

## Detailed Migration

### Step 1: Update Account Instantiation

Find all `new Account(` calls and convert to config objects:

```javascript
// Before
const account = new Account('Test', 1000, true);

// After
const account = new Account({
  name: 'Test',
  balance: 1000,
  isDebitPositive: true
});
```

### Step 2: Update Specialized Accounts

Find all `new Asset(`, `new Liability(`, etc. and convert:

```javascript
// Before
const cash = new Asset('Cash', 5000);
const loan = new Liability('Bank Loan', 10000);

// After
const cash = new Asset({ name: 'Cash', balance: 5000 });
const loan = new Liability({ name: 'Bank Loan', balance: 10000 });
```

### Step 3: Update JournalEntry Instantiation

Find all `new JournalEntry(` calls:

```javascript
// Before
const entry = new JournalEntry('Payment', new Date(), 'JE-001');

// After
const entry = new JournalEntry({
  description: 'Payment',
  date: new Date(),
  id: 'JE-001'
});
```

### Step 4: Update Persistence Layer (if using)

The Factory classes automatically handle the new API:

```javascript
// Before
const { Asset } = factory.createClasses();
const account = new Asset('Cash', 1000, true);

// After
const { Asset } = factory.createClasses();
const account = new Asset({ name: 'Cash', balance: 1000, isDebitPositive: true });
```

## New Features in v3.0

### Custom Fields

You can now add custom fields to accounts and journal entries:

```javascript
// v3.0 - Custom fields on accounts
const equipment = new Asset({
  name: 'Equipment',
  balance: 25000,
  department: 'Operations',     // custom
  serialNumber: 'EQ-12345',     // custom
  purchaseDate: new Date()      // custom
});

console.log(equipment.department);  // 'Operations'

// Custom fields persist through serialization
await equipment.save();
const retrieved = await Asset.findById(equipment.id);
console.log(retrieved.department);  // 'Operations'
```

### TypeScript Config Interfaces

```typescript
import { Asset, AssetConfig } from 'balance-book-js';

// Extend for type-safe custom fields
interface MyAssetConfig extends AssetConfig {
  department: string;
  serialNumber?: string;
}

const config: MyAssetConfig = {
  name: 'Equipment',
  balance: 25000,
  department: 'Operations'
};

const asset = new Asset(config);
```

### JournalEntry Reference Field

v3.0 adds a built-in `reference` field for invoice/check numbers:

```javascript
const entry = new JournalEntry({
  description: 'Invoice Payment',
  reference: 'INV-2025-001',  // new field
  date: new Date()
});

console.log(entry.reference);  // 'INV-2025-001'
```

## Regex Search & Replace

For large codebases, use these regex patterns:

### Asset/Liability/Equity/Income/Expense

```regex
# Find
new (Asset|Liability|Equity|Income|Expense)\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*(\d+(?:\.\d+)?))?\s*(?:,\s*['"]([^'"]+)['"])?\s*\)

# Replace with
new $1({ name: '$2', balance: $3, currency: '$4' })
```

### JournalEntry

```regex
# Find
new JournalEntry\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*([^,)]+))?\s*\)

# Replace with
new JournalEntry({ description: '$1', date: $2 })
```

Note: Manual review is recommended after regex replacements.

## Common Issues

### "isDebitPositive" Required for Account

The base `Account` class requires `isDebitPositive`:

```javascript
// Error: isDebitPositive is required
new Account({ name: 'Test', balance: 100 })

// Fix: Add isDebitPositive
new Account({ name: 'Test', balance: 100, isDebitPositive: true })

// Or use specialized classes (recommended)
new Asset({ name: 'Test', balance: 100 })  // isDebitPositive is auto-set
```

### TypeScript Errors with Custom Fields

Access custom fields with type assertion or extend the config interface:

```typescript
// Option 1: Type assertion
const dept = (account as any).department;

// Option 2: Extend interface (recommended)
interface MyAssetConfig extends AssetConfig {
  department: string;
}
```

## Questions?

If you encounter issues during migration, please open an issue on GitHub.
