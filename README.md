# BalanceBookJS

[![NPM Version](https://img.shields.io/npm/v/balancebookjs.svg)](https://www.npmjs.com/package/balance-book-js)
[![License](https://img.shields.io/npm/l/balancebookjs.svg)](https://github.com/rafa3127/BalanceBookJS/blob/main/LICENSE)

BalanceBookJS is a TypeScript/JavaScript library that provides an object-oriented approach based on fundamental accounting principles for managing financial records.

## Features

* **Config-based constructors** - Extensible API that allows custom fields on accounts and journal entries
* Object-Oriented implementation of core accounting concepts: Accounts and Journal Entries
* Specialized classes for common account types: `Asset`, `Liability`, `Equity`, `Income`, and `Expense`
* **Precise monetary calculations** with the Money value object - no floating-point errors
* **Multi-currency support** with automatic currency validation
* Automatic balance calculation based on debit and credit entries
* Enforces double-entry bookkeeping principles in Journal Entries (debits must equal credits)
* **Persistence Layer**: Plugin-based architecture with adapters for different storage backends
* **Built-in Adapters**: MemoryAdapter (testing), FirebaseAdapter (Firestore), and MongoDBAdapter (MongoDB)
* **Advanced Query Filters**: Flexible `IQueryFilters` interface with operators, sorting, and pagination
* **Bulk Operations**: Efficient `deleteMany()` and `updateMany()` for batch data manipulation
* **Full TypeScript support** with comprehensive type definitions and exported config interfaces
* **Dual module system**: Works with both ES Modules and CommonJS
* Zero runtime dependencies

## Prerequisites

* Node.js (LTS version recommended, e.g., >= 18.x)
* npm or yarn (for project installation)

## Installation

```bash
npm install balance-book-js
```

Or using yarn:

```bash
yarn add balance-book-js
```

## Quick Start

```javascript
import { Asset, Expense, JournalEntry } from 'balance-book-js';

// Create accounts using config objects
const cash = new Asset({ name: 'Cash', balance: 10000 });
const rent = new Expense({ name: 'Rent Expense' });

// Create and commit a journal entry
const entry = new JournalEntry({ description: 'Monthly rent payment' });
entry.addEntry(rent, 1500, 'debit');
entry.addEntry(cash, 1500, 'credit');
entry.commit();

console.log(cash.getBalance());  // 8500
console.log(rent.getBalance());  // 1500
```

## Core Classes (API)

### `Account` (Base Class)

The `Account` class is the foundational class representing a general accounting account.

**Constructor:**

```javascript
new Account(config)
```

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `name` | string | Yes | - | Account name |
| `balance` | number \| Money | No | 0 | Initial balance |
| `isDebitPositive` | boolean | Yes | - | Whether debits increase balance |
| `currency` | string | No | 'CURR' | Currency code for number mode |
| `[key]` | any | No | - | Custom fields for extensibility |

**Methods:**

* **`debit(amount)`**: Records a debit entry to the account
* **`credit(amount)`**: Records a credit entry to the account
* **`getBalance()`**: Returns the current balance (same type as initialized)
* **`getCurrency()`**: Returns the currency code
* **`isNumberMode()`**: Returns true if initialized with number
* **`isMoneyMode()`**: Returns true if initialized with Money

**Example:**

```javascript
import { Account } from 'balance-book-js';

// Basic usage
const checkingAccount = new Account({
  name: 'Checking Account',
  balance: 1000,
  isDebitPositive: true
});

checkingAccount.debit(200);  // 1200
checkingAccount.credit(50);  // 1150

// With custom fields
const account = new Account({
  name: 'Cash',
  balance: 5000,
  isDebitPositive: true,
  department: 'Sales',      // custom field
  costCenter: 'CC-100'      // custom field
});

console.log(account.department);  // 'Sales'
```

### Specialized Account Classes

These classes inherit from `Account` and pre-configure `isDebitPositive` according to standard accounting rules.

| Class | Debit Effect | Credit Effect |
|-------|--------------|---------------|
| `Asset` | Increases | Decreases |
| `Expense` | Increases | Decreases |
| `Liability` | Decreases | Increases |
| `Equity` | Decreases | Increases |
| `Income` | Decreases | Increases |

**Constructor:**

```javascript
new Asset(config)
new Liability(config)
new Equity(config)
new Income(config)
new Expense(config)
```

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `name` | string | Yes | - | Account name |
| `balance` | number \| Money | No | 0 | Initial balance |
| `currency` | string | No | 'CURR' | Currency code for number mode |
| `[key]` | any | No | - | Custom fields for extensibility |

**Example:**

```javascript
import { Asset, Liability, Income, Expense } from 'balance-book-js';

// Create various account types
const cash = new Asset({ name: 'Cash', balance: 10000 });
const loan = new Liability({ name: 'Bank Loan', balance: 50000 });
const revenue = new Income({ name: 'Sales Revenue' });
const utilities = new Expense({ name: 'Utilities' });

// With custom fields for your business logic
const equipment = new Asset({
  name: 'Office Equipment',
  balance: 25000,
  category: 'Fixed Assets',
  depreciationRate: 0.10,
  purchaseDate: new Date('2024-01-15')
});
```

### `JournalEntry`

This class is used for creating and managing journal entries, which represent complete transactions affecting multiple accounts.

**Constructor:**

```javascript
new JournalEntry(config)
```

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `description` | string | Yes | - | Transaction description |
| `date` | Date | No | `new Date()` | Transaction date |
| `id` | string | No | - | Optional unique identifier |
| `reference` | string | No | - | Reference number (invoice, check, etc.) |
| `[key]` | any | No | - | Custom fields for extensibility |

**Methods:**

* **`addEntry(account, amount, type)`**: Adds a debit or credit line
* **`commit()`**: Validates balance and applies transactions to accounts
* **`isBalanced()`**: Checks if debits equal credits
* **`getDebitTotal()`**: Returns sum of all debits
* **`getCreditTotal()`**: Returns sum of all credits
* **`getDetails()`**: Returns array of entry details
* **`isCommitted()`**: Returns true if already committed
* **`getEntryCount()`**: Returns number of entry lines

**Example:**

```javascript
import { JournalEntry, Asset, Expense } from 'balance-book-js';

const cash = new Asset({ name: 'Cash', balance: 5000 });
const rent = new Expense({ name: 'Rent Expense' });

// Basic journal entry
const entry = new JournalEntry({
  description: 'Monthly rent payment',
  date: new Date('2025-01-15')
});

entry.addEntry(rent, 1500, 'debit');
entry.addEntry(cash, 1500, 'credit');
entry.commit();

// With custom fields
const payroll = new JournalEntry({
  description: 'January 2025 Payroll',
  date: new Date('2025-01-31'),
  reference: 'PAY-2025-01',
  department: 'All',
  approvedBy: 'Jane Smith',
  payPeriod: '2025-01'
});
```

## Working with Money

### Precise Calculations

The `Money` class provides precise monetary calculations without floating-point errors:

```javascript
import { Money, Asset } from 'balance-book-js';

// JavaScript floating-point problem
console.log(0.1 + 0.2);  // 0.30000000000000004

// Solution with Money
const account = new Asset({
  name: 'Savings',
  balance: new Money(0, 'USD')
});

for (let i = 0; i < 1000; i++) {
  account.credit(new Money(0.01, 'USD'));
}

console.log(account.getBalance().toNumber());  // 10.00 (exact)
```

### Multi-Currency Support

```javascript
import { Asset, JournalEntry, Money, createCurrency } from 'balance-book-js';

const { usd } = createCurrency('USD');
const { eur } = createCurrency('EUR');

// Separate accounts for each currency
const usdBank = new Asset({ name: 'USD Bank', balance: usd(10000) });
const eurBank = new Asset({ name: 'EUR Bank', balance: eur(5000) });

// Currency validation prevents errors
const eurMoney = new Money(100, 'EUR');
// usdBank.debit(eurMoney);  // Throws: Currency mismatch
```

### Money Utilities

```javascript
import { Money, MoneyUtils } from 'balance-book-js';

// Distribute $100 among 3 people
const total = new Money(100, 'USD');
const shares = MoneyUtils.distribute(total, 3);
// Result: [$33.34, $33.33, $33.33] - no cents lost!

// Calculate 15% tip
const bill = new Money(85.50, 'USD');
const tip = MoneyUtils.percentage(bill, 15);
console.log(tip.format());  // "$12.83"
```

## Persistence Layer

BalanceBookJS includes a flexible persistence layer with support for various storage backends.

### Basic Usage

```typescript
import { Factory, MemoryAdapter } from 'balance-book-js/persistence';

// Setup adapter and factory
const adapter = new MemoryAdapter();
const factory = new Factory(adapter);

// Create persistable classes
const { Asset, JournalEntry } = factory.createClasses();

// Use classes with persistence methods
const savings = new Asset({ name: 'Savings', balance: 1000 });
await savings.save();
console.log(savings.id);  // Auto-generated ID

// Query data
const account = await Asset.findById(savings.id);
const allAccounts = await Asset.findAll();
```

### Available Adapters

#### MemoryAdapter (Built-in)

```typescript
import { MemoryAdapter } from 'balance-book-js/persistence';

const adapter = new MemoryAdapter();
// Data persists only during runtime
```

#### FirebaseAdapter

```typescript
import { FirebaseAdapter } from 'balance-book-js/persistence';
import admin from 'firebase-admin';

admin.initializeApp({ /* config */ });
const firestore = admin.firestore();
const adapter = new FirebaseAdapter(firestore);
```

#### MongoDBAdapter

```typescript
import { MongoDBAdapter } from 'balance-book-js/persistence';

const adapter = await MongoDBAdapter.connect({
  uri: 'mongodb://localhost:27017',
  dbName: 'accounting'
});

// Don't forget to disconnect
await adapter.disconnect();
```

### Custom Fields in Persistence

Custom fields are automatically serialized and deserialized:

```typescript
const { Asset } = factory.createClasses();

const equipment = new Asset({
  name: 'Equipment',
  balance: 25000,
  department: 'Operations',
  serialNumber: 'EQ-12345'
});

await equipment.save();

// Later...
const retrieved = await Asset.findById(equipment.id);
console.log(retrieved.department);     // 'Operations'
console.log(retrieved.serialNumber);   // 'EQ-12345'
```

### Advanced Queries

```typescript
const results = await Account.findAll({
  $where: [
    { field: 'type', operator: '==', value: 'ASSET' },
    { field: 'balance.amount', operator: '>=', value: 1000 }
  ],
  $orderBy: { field: 'name', direction: 'asc' },
  $limit: 10,
  $offset: 0
});
```

## TypeScript Support

Full TypeScript support with exported config interfaces:

```typescript
import {
  Asset,
  JournalEntry,
  Money,
  // Config interfaces
  AssetConfig,
  JournalEntryConfig,
  // Other types
  IAccount,
  IJournalEntry,
  AccountType,
  EntryType
} from 'balance-book-js';

// Extend config interfaces for type-safe custom fields
interface MyAssetConfig extends AssetConfig {
  department: string;
  costCenter: string;
}

const config: MyAssetConfig = {
  name: 'Equipment',
  balance: 10000,
  department: 'Operations',
  costCenter: 'CC-100'
};

const asset = new Asset(config);
```

## Error Handling

```javascript
import { Asset, JournalEntry } from 'balance-book-js';

// Account errors
try {
  const invalid = new Asset({ name: '', balance: 1000 });
} catch (e) {
  console.error(e.message);  // "Account name cannot be empty"
}

// Journal entry errors
const entry = new JournalEntry({ description: 'Test' });
const cash = new Asset({ name: 'Cash', balance: 100 });

try {
  entry.addEntry(cash, -50, 'debit');  // Negative amount
} catch (e) {
  console.error(e.message);  // "Amount must be positive"
}

try {
  entry.commit();  // Empty entry
} catch (e) {
  console.error(e.message);  // "Journal entry must have at least one debit and one credit"
}
```

## Migration from v2.x

If you're upgrading from v2.x, see the [Migration Guide](docs/migration_guides/003_V2_TO_V3_MIGRATION.md).

**Quick comparison:**

```javascript
// v2.x (positional parameters)
new Asset('Cash', 1000, 'USD');
new JournalEntry('Payment', new Date());

// v3.x (config objects)
new Asset({ name: 'Cash', balance: 1000, currency: 'USD' });
new JournalEntry({ description: 'Payment', date: new Date() });
```

## Version

Current version: 3.0.0

### What's New in v3.0.0
- **Config-based constructors**: All classes now use configuration objects instead of positional parameters
- **Extensible accounts**: Add custom fields to accounts and journal entries that persist through serialization
- **Exported config types**: TypeScript users can extend `AssetConfig`, `JournalEntryConfig`, etc.
- **Breaking change**: See migration guide for updating from v2.x

### Previous Versions
- v2.4.0: MongoDBAdapter
- v2.3.0: Advanced Query Filters
- v2.2.0: FirebaseAdapter, Bulk Operations
- v2.0.0: Persistence Layer
- v1.3.0: Money Value Object

For v2.x documentation, see [docs/deprecated/README-v2.md](docs/deprecated/README-v2.md).

## Contributing

Details on contributing, including commit message conventions, can be found in `CONTRIBUTING.md`.

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
