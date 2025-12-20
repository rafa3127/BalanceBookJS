# BalanceBookJS v2.x Documentation (Deprecated)

> **Warning**: This documentation is for v2.x API which uses positional constructor parameters.
> For v3.0+, use config-based constructors. See the main [README.md](../../README.md).

---

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

## Migration to v3.0

See [Migration Guide v2 to v3](../migration_guides/003_V2_TO_V3_MIGRATION.md) for detailed instructions on updating your code to use the new config-based constructor API.

## License

This project is licensed under the ISC License. See the [LICENSE](../../LICENSE) file for details.
