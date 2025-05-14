# BalanceBookJS

[![NPM Version](https://img.shields.io/npm/v/balancebookjs.svg)](https://www.npmjs.com/package/balancebookjs)
[![License](https://img.shields.io/npm/l/balancebookjs.svg)](https://github.com/rafa3127/BalanceBookJS/blob/main/LICENSE)
BalanceBookJS is a JavaScript library that provides an object-oriented approach based on fundamental accounting principles for managing financial records.

## Features

* Object-Oriented implementation of core accounting concepts: Accounts and Journal Entries.
* Specialized classes for common account types: `Asset`, `Liability`, `Equity`, `Income`, and `Expense`.
* Automatic balance calculation based on debit and credit entries.
* Enforces double-entry bookkeeping principles in Journal Entries (debits must equal credits).
* Written in modern JavaScript, designed for use with ES Modules.
* Lightweight and without external dependencies beyond core JavaScript.

## Prerequisites

* Node.js (LTS version recommended, e.g., >= 18.x)
* npm or yarn (for project installation)

## Installation

Install BalanceBookJS into your project using npm:

```bash
npm install balancebookjs
```


## Usage / Getting Started

### Importing the Library

You can import the necessary classes from BalanceBookJS using ES module syntax:

```javascript
import { Account, Asset, Liability, Equity, Income, Expense, JournalEntry } from 'balancebookjs';
```

## Core Classes (API)

### `Account` (Base Class)

The `Account` class is the foundational class in BalanceBookJS representing a general accounting account.

**Constructor:**

```javascript
new Account(name, initialBalance, isDebitPositive)
```

* `name` (string): The name of the account (e.g., "Cash", "Accounts Payable").
* `initialBalance` (number): The starting balance of the account.
* `isDebitPositive` (boolean): Determines how debits and credits affect the balance.
    * Set to `true` if debits increase the balance and credits decrease it (typical for Assets and Expenses).
    * Set to `false` if debits decrease the balance and credits increase it (typical for Liabilities, Equity, and Income).

**Methods:**

* **`debit(amount)`**: Records a debit entry to the account.
    * `amount` (number): The amount to debit.
* **`credit(amount)`**: Records a credit entry to the account.
    * `amount` (number): The amount to credit.
* **`getBalance()`**: Returns the current balance of the account.
    * *Returns:* `number` - The current balance.

**Example:**

```javascript
import { Account } from 'balancebookjs';

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
new Asset(name, initialBalance)
// Similar constructors for Liability, Equity, Income, Expense
```

* `name` (string): The name of the specific account.
* `initialBalance` (number): The starting balance.

**Methods:**
These classes use the same `debit(amount)`, `credit(amount)`, and `getBalance()` methods inherited from the `Account` class.

**Example (`Asset`):**

```javascript
import { Asset } from 'balancebookjs';

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
* **`commit()`**: Validates that the total debits equal total credits for all entries. If balanced, it applies each entry (debit or credit) to its respective account, updating their balances.
    * *Throws:* `Error` if the journal entry is not balanced (debits !== credits).
* **`getDetails()`**: Returns an array of objects, each representing an entry line with details.
    * *Returns:* `Array<Object>` - Each object contains `{ accountName, amount, type, date, description }`.

**Example (`JournalEntry`):**

```javascript
import { JournalEntry, Asset, Expense } from 'balancebookjs';

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

## Error Handling

* The `JournalEntry.commit()` method will throw an `Error` if the sum of debit entries does not equal the sum of credit entries. It's recommended to wrap calls to `.commit()` in a `try...catch` block.
* The `JournalEntry.addEntry()` method will throw an `Error` if an invalid account object is provided.

## Contributing

Details on contributing, including commit message conventions, can be found in `CONTRIBUTING.md`.

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
```