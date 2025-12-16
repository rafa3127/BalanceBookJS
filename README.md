# BalanceBookJS

[![NPM Version](https://img.shields.io/npm/v/balancebookjs.svg)](https://www.npmjs.com/package/balance-book-js)
[![License](https://img.shields.io/npm/l/balancebookjs.svg)](https://github.com/rafa3127/BalanceBookJS/blob/main/LICENSE)
BalanceBookJS is a TypeScript/JavaScript library that provides an object-oriented approach based on fundamental accounting principles for managing financial records.

## Features

* Object-Oriented implementation of core accounting concepts: Accounts and Journal Entries.
* Specialized classes for common account types: `Asset`, `Liability`, `Equity`, `Income`, and `Expense`.
* **Precise monetary calculations** with the Money value object - no floating-point errors.
* **Multi-currency support** with automatic currency validation.
* Automatic balance calculation based on debit and credit entries.
* Enforces double-entry bookkeeping principles in Journal Entries (debits must equal credits).
* **Persistence Layer**: Plugin-based architecture with adapters for different storage backends.
* **Built-in Adapters**: MemoryAdapter (testing), FirebaseAdapter (Firestore), and MongoDBAdapter (MongoDB).
* **Advanced Query Filters**: Flexible `IQueryFilters` interface with operators (`==`, `!=`, `>`, `>=`, `<`, `<=`, `in`, `not-in`, `contains`, `startsWith`, `endsWith`, `includes`), sorting (`$orderBy`), and pagination (`$limit`, `$offset`).
* **Bulk Operations**: Efficient `deleteMany()` and `updateMany()` for batch data manipulation.
* **Full TypeScript support** with comprehensive type definitions.
* **Dual module system**: Works with both ES Modules and CommonJS.
* Written in TypeScript, compiled to JavaScript for maximum compatibility.
* **Backward compatible** - works with both numbers and Money objects.

## Prerequisites

* Node.js (LTS version recommended, e.g., >= 18.x)
* npm or yarn (for project installation)

## Installation

Install BalanceBookJS into your project using npm:

```bash
npm install balance-book-js
```

Or using yarn:

```bash
yarn add balance-book-js
```


## Usage / Getting Started

### Importing the Library

#### ES Modules (JavaScript/TypeScript)

```javascript
import { Asset, Liability, Equity, Income, Expense, JournalEntry } from 'balance-book-js';

// For precise monetary calculations
import { Money, MoneyUtils, createCurrency } from 'balance-book-js';
```

#### CommonJS (Node.js)

```javascript
const { Asset, Liability, Equity, Income, Expense, JournalEntry } = require('balance-book-js');

// For precise monetary calculations
const { Money, MoneyUtils, createCurrency } = require('balance-book-js');
```

#### TypeScript

TypeScript users get full type support automatically:

```typescript
import { 
  Asset, 
  JournalEntry,
  Money,
  IAccount,           // Interface for accounts
  IJournalEntry,       // Interface for journal entries
  IMoney,             // Interface for money objects
  EntryType,          // Type for 'debit' | 'credit'
  AccountType         // Enum for account types
} from 'balance-book-js';

const cash: Asset = new Asset('Cash', 1000);
const entry: IJournalEntry = new JournalEntry('Test transaction');

// With Money for precision
const usdCash: Asset = new Asset('USD Cash', new Money(1000, 'USD'));
```

## Core Classes (API)

### `Account` (Base Class)

The `Account` class is the foundational class in BalanceBookJS representing a general accounting account.

**Constructor:**

```javascript
new Account(name, initialBalance = 0, isDebitPositive, defaultCurrency = 'CURR')
```

* `name` (string): The name of the account (e.g., "Cash", "Accounts Payable").
* `initialBalance` (number | Money, optional): The starting balance. Can be a number or Money object. Defaults to 0.
* `isDebitPositive` (boolean): Determines how debits and credits affect the balance.
* `defaultCurrency` (string, optional): Default currency for number mode. Defaults to 'CURR' (generic currency).
    * Set to `true` if debits increase the balance and credits decrease it (typical for Assets and Expenses).
    * Set to `false` if debits decrease the balance and credits increase it (typical for Liabilities, Equity, and Income).

**Methods:**

* **`debit(amount)`**: Records a debit entry to the account.
    * `amount` (number | Money): The amount to debit. Must be positive.
* **`credit(amount)`**: Records a credit entry to the account.
    * `amount` (number | Money): The amount to credit. Must be positive.
* **`getBalance()`**: Returns the current balance of the account.
    * *Returns:* `number | Money` - Returns the same type as initialized (number or Money).

**Example:**

```javascript
import { Account } from 'balance-book-js';

// For an Asset account, debits are positive
const checkingAccount = new Account('Checking Account', 1000, true);
console.log('Initial Balance:', checkingAccount.getBalance()); // 1000

checkingAccount.debit(200); // Increases balance
console.log('After Debit:', checkingAccount.getBalance()); // 1200

checkingAccount.credit(50); // Decreases balance
console.log('After Credit:', checkingAccount.getBalance()); // 1150

// For an Income account, credits are positive (debits are negative)
const salesRevenue = new Account('Sales Revenue', 0, false);
console.log('Initial Revenue:', salesRevenue.getBalance()); // 0

salesRevenue.credit(500); // Increases revenue
console.log('After Credit (Sale):', salesRevenue.getBalance()); // 500
```

### Specialized Account Classes (`Asset`, `Liability`, `Equity`, `Income`, `Expense`)

These classes inherit from `Account` and pre-configure the `isDebitPositive` property and `type` (if you add a type property later) according to standard accounting rules.

* **`Asset`**: Debits increase the balance (`isDebitPositive = true`).
* **`Liability`**: Credits increase the balance (`isDebitPositive = false`).
* **`Equity`**: Credits increase the balance (`isDebitPositive = false`).
* **`Income`**: Credits increase the balance (`isDebitPositive = false`).
* **`Expense`**: Debits increase the balance (`isDebitPositive = true`).

**Constructors (Example for `Asset`):**

```javascript
new Asset(name, initialBalance = 0)
new Liability(name, initialBalance = 0)
new Equity(name, initialBalance = 0)
new Income(name, initialBalance = 0)
new Expense(name, initialBalance = 0)
```

* `name` (string): The name of the specific account.
* `initialBalance` (number, optional): The starting balance. Defaults to 0.

**Methods:**
These classes use the same `debit(amount)`, `credit(amount)`, and `getBalance()` methods inherited from the `Account` class.

**Example (`Asset`):**

```javascript
import { Asset } from 'balance-book-js';

const officeEquipment = new Asset('Office Equipment', 5000);
console.log('Initial Equipment Value:', officeEquipment.getBalance()); // 5000

officeEquipment.debit(1500); // Purchase of more equipment
console.log('Post-debit Balance:', officeEquipment.getBalance()); // 6500

officeEquipment.credit(200); // Disposal or depreciation
console.log('Post-credit Balance:', officeEquipment.getBalance()); // 6300
```

### `JournalEntry`

This class is used for creating and managing journal entries, which represent a complete transaction affecting multiple accounts according to the double-entry bookkeeping system.

**Constructor:**

```javascript
new JournalEntry(description, date = new Date())
```

* `description` (string): A description for the journal entry (e.g., "Payment of monthly rent").
* `date` (Date, optional): The date of the transaction. Defaults to the current date and time if not provided.

**Methods:**

* **`addEntry(account, amount, type)`**: Adds an individual debit or credit line to the journal entry.
    * `account` (Account): An instance of the `Account` class (or its subclasses like `Asset`, `Income`, etc.) that is affected.
    * `amount` (number): The monetary value of this entry line. Must be a positive number.
    * `type` (string): Must be either `'debit'` or `'credit'`.
* **`commit()`**: Validates that the total debits equal total credits for all entries. If balanced, it applies each entry (debit or credit) to its respective account, updating their balances. **Once committed, the journal entry cannot be modified.**
    * *Throws:* `Error` if the journal entry is not balanced (debits !== credits).
    * *Throws:* `Error` if the journal entry has already been committed.
    * *Throws:* `Error` if the journal entry is empty.
* **`getDetails()`**: Returns an array of objects, each representing an entry line with details.
    * *Returns:* `Array<Object>` - Each object contains `{ accountName, amount, type, date, description }`.
* **`isBalanced()`**: Checks if the journal entry is balanced (total debits equal total credits).
    * *Returns:* `boolean` - True if balanced, false otherwise.
* **`getDebitTotal()`**: Returns the sum of all debit entries.
    * *Returns:* `number` - Total debits.
* **`getCreditTotal()`**: Returns the sum of all credit entries.
    * *Returns:* `number` - Total credits.
* **`isCommitted()`**: Checks if the journal entry has been committed.
    * *Returns:* `boolean` - True if committed, false otherwise.

### `Money` (Value Object)

The `Money` class provides precise monetary calculations without floating-point errors, using BigInt internally.

**Constructor:**

```javascript
new Money(amount, currency = 'USD', options)
```

* `amount` (number | string): The monetary amount.
* `currency` (string, optional): Currency code (ISO 4217). Defaults to 'USD'.
* `options` (object, optional): Configuration options.
    * `minInternalScale` (number): Minimum internal precision. Defaults to 6.
    * `forceScale` (number): Force specific scale.

**Key Methods:**

* **Arithmetic**: `add()`, `subtract()`, `multiply()`, `divide()`, `negate()`
* **Comparison**: `equals()`, `isGreaterThan()`, `isLessThan()`, `isZero()`, `isPositive()`, `isNegative()`
* **Conversion**: `toNumber()`, `toString()`, `format()`, `toJSON()`
* **Factory Methods**: `Money.zero()`, `Money.fromCents()`, `Money.fromAmount()`

**Example:**

```javascript
import { Money } from 'balance-book-js';

// Precise calculations - no floating-point errors
const price = new Money(99.99, 'USD');
const tax = price.multiply(0.08); // 8% tax
const total = price.add(tax);

console.log(total.toNumber()); // 107.99 (exact, not 107.98999999999999)
console.log(total.format());   // "$107.99"

// Currency validation
const usdAmount = new Money(100, 'USD');
const eurAmount = new Money(100, 'EUR');
// usdAmount.add(eurAmount); // Throws: Currency mismatch
```

### `MoneyUtils` (Utility Class)

Provides utility functions for working with Money objects.

**Key Methods:**

* **`sum(moneys)`**: Sum an array of Money objects
* **`average(moneys)`**: Calculate average
* **`min/max(moneys)`**: Find minimum/maximum
* **`distribute(money, n)`**: Distribute amount evenly (handles remainders)
* **`percentage(money, percent)`**: Calculate percentage
* **`calculateTax(money, rate)`**: Calculate tax amount
* **`applyDiscount(money, discount)`**: Apply discount percentage

**Example:**

```javascript
import { Money, MoneyUtils } from 'balance-book-js';

// Distribute $100 among 3 people
const total = new Money(100, 'USD');
const shares = MoneyUtils.distribute(total, 3);
// Result: [$33.34, $33.33, $33.33] - no cents lost!

// Calculate 15% tip
const bill = new Money(85.50, 'USD');
const tip = MoneyUtils.percentage(bill, 15);
console.log(tip.format()); // "$12.83"
```

### `createCurrency` (Factory Function)

Create custom currency classes and factory functions for convenience.

**Example:**

```javascript
import { createCurrency } from 'balance-book-js';

// Create USD currency class and factory
const { USD, usd } = createCurrency('USD');

// Use the class
const payment = new USD(100);  // Same as new Money(100, 'USD')

// Use the factory function
const refund = usd(50);        // Same as new Money(50, 'USD')

// They work together
const balance = payment.subtract(refund);
console.log(balance.format()); // "$50.00"
```

### Supported Currencies

The library includes built-in support for major currencies:

* **USD** - US Dollar (2 decimals)
* **EUR** - Euro (2 decimals)
* **GBP** - British Pound (2 decimals)
* **JPY** - Japanese Yen (0 decimals)
* **CAD** - Canadian Dollar (2 decimals)
* **AUD** - Australian Dollar (2 decimals)
* **CHF** - Swiss Franc (2 decimals)
* **CNY** - Chinese Yuan (2 decimals)
* **MXN** - Mexican Peso (2 decimals)
* **CURR** - Generic Currency (2 decimals, default for backward compatibility)

You can also register custom currencies:

```javascript
import { Money, registerCurrencyConfig } from 'balance-book-js';

// Register Bitcoin with 8 decimal places
registerCurrencyConfig('BTC', {
  code: 'BTC',
  symbol: '₿',
  name: 'Bitcoin',
  decimals: 8
});

const bitcoin = new Money(0.00001234, 'BTC');
console.log(bitcoin.format()); // "₿0.00001234"
```

**Example (`JournalEntry`):**

```javascript
import { JournalEntry, Asset, Expense } from 'balance-book-js';

// Setup accounts
const cash = new Asset('Cash on Hand', 1000);
const rentExpense = new Expense('Rent Expense', 0);

// Create a new journal entry
const rentPaymentEntry = new JournalEntry("Paid monthly office rent - May 2025");

// Add entries (must balance)
rentPaymentEntry.addEntry(rentExpense, 750, 'debit'); // Increase Rent Expense
rentPaymentEntry.addEntry(cash, 750, 'credit');      // Decrease Cash

// Commit the transaction
try {
    rentPaymentEntry.commit();
    console.log('Rent payment journal entry committed successfully.');
    console.log('New Cash Balance:', cash.getBalance()); // Expected: 250
    console.log('Rent Expense Balance:', rentExpense.getBalance()); // Expected: 750
} catch (error) {
    console.error('Failed to commit journal entry:', error.message);
}

// Get details of the committed entry
console.log(rentPaymentEntry.getDetails());
/*
Expected output might look like:
[
  { accountName: 'Rent Expense', amount: 750, type: 'debit', date: ..., description: 'Paid monthly office rent - May 2025'},
  { accountName: 'Cash on Hand', amount: 750, type: 'credit', date: ..., description: 'Paid monthly office rent - May 2025'}
]
*/
```

## Working with Money and Accounts

> 💡 **Note**: The Money value object is completely optional and backward compatible. Existing code continues to work without any changes. For gradual adoption strategies, see the [Adoption Guide](docs/migration_guides/002_MONEY_OBJECTS_ADOPTION_GUIDES.md).

### Backward Compatible Mode

Accounts work seamlessly with both numbers (for backward compatibility) and Money objects (for precision):

```javascript
import { Asset, Money } from 'balance-book-js';

// Traditional mode with numbers (backward compatible)
const cashAccount = new Asset('Cash', 1000);
cashAccount.debit(500);
console.log(cashAccount.getBalance()); // 1500 (returns number)

// Money mode for precision
const usdAccount = new Asset('USD Cash', new Money(1000, 'USD'));
usdAccount.debit(new Money(500, 'USD'));
const balance = usdAccount.getBalance(); // Returns Money object
console.log(balance.format()); // "$1,500.00"

// Currency validation prevents errors
const eurMoney = new Money(100, 'EUR');
// usdAccount.debit(eurMoney); // Throws: Currency mismatch
```

### Journal Entries with Money

```javascript
import { Asset, Expense, JournalEntry, Money } from 'balance-book-js';

// Create accounts with Money for precision
const cash = new Asset('Cash', new Money(5000, 'USD'));
const rent = new Expense('Rent', new Money(0, 'USD'));

// Create journal entry
const entry = new JournalEntry('Monthly rent payment');

// Add entries with Money objects
entry.addEntry(rent, new Money(1500, 'USD'), 'debit');
entry.addEntry(cash, new Money(1500, 'USD'), 'credit');

// Commit the transaction
entry.commit();

// Check balances (returns Money objects)
console.log(cash.getBalance().format());    // "$3,500.00"
console.log(rent.getBalance().format());    // "$1,500.00"
```

### Solving Floating-Point Problems

```javascript
import { Asset, Money } from 'balance-book-js';

// JavaScript floating-point problem
console.log(0.1 + 0.2); // 0.30000000000000004 ❌

// Solution with Money
const account = new Asset('Savings', new Money(0, 'USD'));

// Add 1000 transactions of $0.001 each
for (let i = 0; i < 1000; i++) {
  account.credit(new Money(0.001, 'USD'));
}

// Perfect precision maintained
const balance = account.getBalance();
console.log(balance.toNumber()); // 1.00 (exact) ✅
console.log(balance.format());   // "$1.00"
```

### Advanced Example: Multi-Currency Accounting

```javascript
import { Asset, Income, JournalEntry, Money, createCurrency } from 'balance-book-js';

// Create currency-specific factories
const { USD, usd } = createCurrency('USD');
const { EUR, eur } = createCurrency('EUR');

// Separate accounts for each currency
const usdBank = new Asset('USD Bank', usd(10000));
const eurBank = new Asset('EUR Bank', eur(5000));
const usdRevenue = new Income('USD Sales', usd(0));
const eurRevenue = new Income('EUR Sales', eur(0));

// USD transaction
const usdSale = new JournalEntry('US Customer Sale');
usdSale.addEntry(usdBank, usd(1500), 'debit');
usdSale.addEntry(usdRevenue, usd(1500), 'credit');
usdSale.commit();

// EUR transaction
const eurSale = new JournalEntry('EU Customer Sale');
eurSale.addEntry(eurBank, eur(800), 'debit');
eurSale.addEntry(eurRevenue, eur(800), 'credit');
eurSale.commit();

// Check balances - each maintains its currency
console.log(usdBank.getBalance().format());    // "$11,500.00"
console.log(eurBank.getBalance().format());    // "€5,800.00"
```

## TypeScript Example

```typescript
import { 
  Asset, 
  Liability, 
  JournalEntry,
  IAccount,
  IJournalEntry,
  AccountType,
  EntryType,
  ENTRY_TYPES
} from 'balance-book-js';

// Using interfaces for type safety
const createAccount = (type: AccountType, name: string, balance: number): IAccount => {
  switch(type) {
    case AccountType.ASSET:
      return new Asset(name, balance);
    case AccountType.LIABILITY:
      return new Liability(name, balance);
    default:
      throw new Error(`Unknown account type: ${type}`);
  }
};

// Type-safe journal entry
const processTransaction = (entry: IJournalEntry): void => {
  if (entry.isBalanced()) {
    entry.commit();
    console.log('Transaction processed successfully');
  } else {
    const diff = entry.getDebitTotal() - entry.getCreditTotal();
    console.error(`Transaction unbalanced by ${diff}`);
  }
};

// Example usage
const cash = createAccount(AccountType.ASSET, 'Cash', 10000);
const loan = createAccount(AccountType.LIABILITY, 'Bank Loan', 0);

const loanEntry = new JournalEntry('Received bank loan');
loanEntry.addEntry(cash, 5000, ENTRY_TYPES.DEBIT);
loanEntry.addEntry(loan, 5000, ENTRY_TYPES.CREDIT);

processTransaction(loanEntry);
```

## Persistence Layer

BalanceBookJS includes a flexible persistence layer that allows you to save and retrieve accounts and journal entries using various storage backends through a plugin architecture.

### Basic Usage

```typescript
import { Factory, MemoryAdapter } from 'balance-book-js/persistence';

// 1. Setup adapter and factory
const adapter = new MemoryAdapter();
const factory = new Factory(adapter);

// 2. Create persistable classes
const { Account, Asset, JournalEntry } = factory.createClasses();

// 3. Use classes with persistence methods
const savings = new Asset('Savings', 1000);
await savings.save(); // Saves to storage
console.log(savings.id); // Auto-generated ID

// 4. Query data
const account = await Asset.findById(savings.id);
const allAccounts = await Account.findAll();
const filtered = await Account.findAll({ name: 'Savings' });
```

### Available Adapters

#### MemoryAdapter (Built-in)
In-memory storage for development and testing:

```typescript
import { MemoryAdapter } from 'balance-book-js/persistence';

const adapter = new MemoryAdapter();
// Data persists only during runtime
adapter.clear(); // Helper to reset storage in tests
```

#### FirebaseAdapter
For Firebase/Firestore backends (requires `firebase-admin` peer dependency):

```typescript
import { FirebaseAdapter } from 'balance-book-js/persistence';
import admin from 'firebase-admin';

// Option 1: Pass configuration (adapter initializes Firebase internally)
const adapter = new FirebaseAdapter({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'your-project-id'
});

// Option 2: Dependency Injection - Pass an already initialized Firestore instance
// This is recommended when you need more control over Firebase initialization
// or when integrating with existing Firebase setups
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'your-project-id'
});
const firestore = admin.firestore();
const adapter = new FirebaseAdapter(firestore);

const factory = new Factory(adapter);
const { Account } = factory.createClasses();

// Works the same as MemoryAdapter
const account = new Account('Cash', 5000, true);
await account.save(); // Saves to Firestore
```

**Why use dependency injection?**
- Better control over Firebase initialization options
- Easier integration with existing Firebase setups in your application
- Avoids potential module resolution issues in complex build environments
- Simplifies testing with mock Firestore instances

#### MongoDBAdapter
For MongoDB backends (requires `mongodb` peer dependency):

```typescript
import { MongoDBAdapter } from 'balance-book-js/persistence';

// Option 1: Config-based initialization (adapter manages connection)
const adapter = await MongoDBAdapter.connect({
    uri: 'mongodb://localhost:27017',
    dbName: 'accounting'
});

const factory = new Factory(adapter);
const { Account } = factory.createClasses();

// Works the same as other adapters
const account = new Account('Cash', 5000, true);
await account.save(); // Saves to MongoDB

// Don't forget to disconnect when done
await adapter.disconnect();
```

```typescript
// Option 2: Dependency Injection - Pass an already connected Db instance
import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const db = client.db('accounting');

const adapter = new MongoDBAdapter(db);
const factory = new Factory(adapter);
// You manage the connection lifecycle
```

**Why choose MongoDBAdapter?**
- **Native query support**: All `IQueryFilters` operators work natively (no in-memory filtering)
- **Native regex**: `startsWith`, `endsWith`, `includes` use MongoDB's `$regex`
- **Native pagination**: `$skip` and `$limit` handled by MongoDB
- **No composite indexes**: Unlike Firestore, multi-field queries work without index configuration
- **Dot notation**: Query nested fields like `balance.amount` natively

#### SQLAdapter (Temporarily Disabled)

> ⚠️ **Note**: The SQLAdapter is temporarily disabled in v2.3.0 pending a redesign with a proper relational schema. The current implementation stores `JournalEntry.entries` as serialized JSON, which prevents efficient queries like "find all transactions involving account X".
>
> See [008-sql-adapter-relational-schema.md](docs/ai-context/improvements/008-sql-adapter-relational-schema.md) for the planned relational schema design with separate `journal_entry_lines` table that will enable proper SQL JOINs and indexed queries.
>
> **Available adapters**: Use `MemoryAdapter` for testing/development, `FirebaseAdapter` for Firestore, or `MongoDBAdapter` for MongoDB.

### Instance Methods

All persistable classes have these instance methods:

```typescript
// Save to storage (creates or updates)
await account.save();

// Delete from storage
await account.delete();
```

### Static Methods

Query and bulk operations available on all persistable classes:

```typescript
// Find by ID
const account = await Account.findById('abc123');

// Find all (with optional simple filters)
const allAccounts = await Account.findAll();
const assets = await Account.findAll({ isDebitPositive: true });

// Advanced query filters with IQueryFilters
const filtered = await Account.findAll({
    $where: [
        { field: 'type', operator: '==', value: 'ASSET' },
        { field: 'name', operator: 'startsWith', value: 'Cash' },
        { field: 'balance.amount', operator: '>=', value: 1000 }
    ],
    $orderBy: { field: 'name', direction: 'asc' },
    $limit: 10,
    $offset: 0
});

// Bulk delete - returns count of deleted documents
const deletedCount = await Account.deleteMany({ status: 'inactive' });

// Bulk update - returns count of updated documents
const updatedCount = await Account.updateMany(
    { category: 'old' },      // filter
    { category: 'updated' }   // data to apply
);
```

### Creating Custom Adapters

Implement the `IAdapter` interface to create adapters for any storage backend:

```typescript
import { IAdapter, IQueryFilters } from 'balance-book-js/persistence';

class CustomAdapter implements IAdapter {
    async get<T>(collection: string, id: string): Promise<T | null> {
        // Retrieve document by ID
    }

    async save(collection: string, id: string | null, data: any): Promise<string> {
        // Save document, return ID (generate if null)
    }

    async delete(collection: string, id: string): Promise<void> {
        // Delete document by ID
    }

    async query<T>(collection: string, filters?: IQueryFilters): Promise<T[]> {
        // Query documents with optional filters
    }

    async deleteMany(collection: string, filters: IQueryFilters): Promise<number> {
        // Delete multiple documents, return count
    }

    async updateMany(collection: string, filters: IQueryFilters, data: any): Promise<number> {
        // Update multiple documents, return count
    }
}
```

### Advanced Query Filters

The `IQueryFilters` interface provides powerful querying capabilities:

```typescript
interface IQueryFilters {
    $where?: IWhereCondition[];  // Array of filter conditions
    $orderBy?: IOrderBy;         // Sorting configuration
    $limit?: number;             // Maximum results to return
    $offset?: number;            // Skip N results (pagination)
    [key: string]: any;          // Simple equality filters (backward compatible)
}

interface IWhereCondition {
    field: string;               // Field path (supports dot notation: 'balance.amount')
    operator: QueryOperator;     // Comparison operator
    value: any;                  // Value to compare against
}

// Available operators:
// '==' | '!=' | '>' | '>=' | '<' | '<='  - Comparison
// 'in' | 'not-in'                         - Array membership
// 'contains'                              - Array contains value
// 'startsWith' | 'endsWith' | 'includes'  - String operations
```

**Example - Date Range Query:**
```typescript
const novemberTransactions = await JournalEntry.findAll({
    $where: [
        { field: 'date', operator: '>=', value: new Date('2024-11-01') },
        { field: 'date', operator: '<=', value: new Date('2024-11-30') }
    ],
    $orderBy: { field: 'date', direction: 'desc' },
    $limit: 50
});
```

**Example - String Search:**
```typescript
const cashAccounts = await Account.findAll({
    $where: [
        { field: 'name', operator: 'includes', value: 'Cash' },
        { field: 'type', operator: '==', value: 'ASSET' }
    ]
});
```

### Important Notes

- **Bulk operations don't rehydrate**: `updateMany` and `deleteMany` return counts, not updated instances. Objects in memory are not automatically synchronized.
- **Firebase batch limits**: The FirebaseAdapter automatically handles Firestore's 500 operations per batch limit.
- **Firestore indexes**: Multi-field queries with `$orderBy` may require composite indexes. Create them in Firebase Console or via `firestore.indexes.json`.
- **Firestore in-memory filtering**: Some operators (`endsWith`, `includes`) are filtered in memory after fetching from Firestore, as they're not natively supported. The adapter uses iterative pagination to guarantee the requested `$limit` is satisfied.
- **MongoDB native queries**: Unlike Firestore, MongoDBAdapter executes all filter operators natively in the database with no in-memory filtering overhead.

## Error Handling

* The `JournalEntry.commit()` method will throw an `Error` if:
  - The sum of debit entries does not equal the sum of credit entries
  - The journal entry has already been committed
  - The journal entry is empty (no entries added)
* The `JournalEntry.addEntry()` method will throw an `Error` if:
  - An invalid account object is provided
  - The amount is negative
  - The type is not 'debit' or 'credit'
  - The journal entry has already been committed
* The `JournalEntry.serialize()` method will throw an `Error` if:
  - Any referenced account has not been saved (missing ID)
* Account `debit()` and `credit()` methods will throw an `Error` if:
  - The amount is negative
  - Currency mismatch when using Money objects
* Money arithmetic operations will throw an `Error` if:
  - Currencies don't match in add/subtract operations
  - Division by zero
  - Amount exceeds safe value limits for the precision level

It's recommended to wrap calls to `.commit()` in a `try...catch` block.

## Version

Current version: 2.3.0

### What's New in v2.4.0
- **MongoDBAdapter**: New adapter for MongoDB with native query support for all filter operators
- **Native Regex Queries**: `startsWith`, `endsWith`, `includes` use MongoDB's `$regex` (no in-memory filtering)
- **Improved Pagination**: MongoDB's native `skip()` and `limit()` for efficient pagination

### What's New in v2.3.0
- **Advanced Query Filters**: New `IQueryFilters` interface with operators (`==`, `!=`, `>`, `>=`, `<`, `<=`, `in`, `not-in`, `contains`, `startsWith`, `endsWith`, `includes`), sorting (`$orderBy`), and pagination (`$limit`, `$offset`)
- **Dot Notation Support**: Query nested fields like `balance.amount`
- **Iterative Pagination**: FirebaseAdapter guarantees `$limit` results even with in-memory filters
- **Timestamp Conversion**: Automatic conversion of Firestore Timestamps to JavaScript Dates
- **SQLAdapter Deprecated**: Temporarily disabled pending redesign with proper relational schema (see IMPROVEMENTS.md)

### Previous Updates (v2.2.0)
- **FirebaseAdapter**: Firestore integration with automatic batch handling (500 ops limit)
- **SQLAdapter**: SQL database support via Knex.js (PostgreSQL, MySQL, SQLite, MSSQL, Oracle)
- **Bulk Operations**: `deleteMany()` and `updateMany()` for efficient data manipulation
- **Data Sanitization**: Automatic handling of undefined values while preserving Date objects

### Previous Updates (v2.0.0)
- **Persistence Layer**: Plugin-based architecture for data persistence
- **Factory Pattern**: Generate persistable classes with `factory.createClasses()`
- **MemoryAdapter**: Built-in in-memory storage for development and testing
- **Query Support**: `findById()` and `findAll()` with filter support
- **Adapter Interface**: Create custom adapters for any storage backend

### Previous Updates (v1.3.0)
- **Money Value Object**: Precise monetary calculations without floating-point errors
- **Multi-currency support**: Automatic currency validation and conversion prevention
- **MoneyUtils**: Utility functions for common financial operations
- **Currency Factory**: Create currency-specific classes for cleaner code
- **Backward compatibility**: Existing code works without changes
- **Safe value limits**: Automatic validation to prevent precision loss
- **Distribution algorithm**: Split amounts evenly with no lost cents
- **Internal precision**: 6+ decimal places internally while respecting currency display rules

### Previous Updates (v1.2.0)
- Complete TypeScript migration
- Full type definitions for all public APIs
- Dual module support (ES Modules + CommonJS)
- Enhanced JournalEntry with helper methods
- Improved validation and error messages
- Zero runtime dependencies

## Contributing

Details on contributing, including commit message conventions, can be found in `CONTRIBUTING.md`.

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
```