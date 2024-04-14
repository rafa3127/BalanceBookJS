# BalanceBookJS

BalanceBookJS is a JavaScript library that provides an object-oriented approach based on fundamental accounting principles.

## Installation

```npm install balancebookjs```

## Usage

### Importing the Library

You can import the classes from BalanceBookJS using ES module syntax:

```import { Account, Asset, Liability, Equity, Income, Expense, JournalEntry } from 'balancebookjs';```

### Account Class

The `Account` class is the foundational class in BalanceBookJS that represents a general accounting account.

#### Constructor

```new Account(name, initialBalance, isDebitPositive)```

#### Debit and Credit Methods

```account.debit(amount)```
```account.credit(amount)```

#### GetBalance Method

```account.getBalance()```

### Examples

Creating and using an account:

```import { Account } from 'balancebookjs';

const checkingAccount = new Account('Checking Account', 1000, true);
checkingAccount.debit(200);
console.log(checkingAccount.getBalance()); // 1200 if isDebitPositive is true
checkingAccount.credit(100);
console.log(checkingAccount.getBalance()); // 1100 if isDebitPositive is true```

### Asset, Liability, Equity, Income, and Expense Classes

These classes are specific types of accounts and are used similarly to the `Account` class. You can create and manage these accounts as shown in the previous sections. Below is a quick example of how to use the `Asset` class:

```import { Asset } from 'balancebookjs';

const officeEquipment = new Asset('Office Equipment', 5000);
officeEquipment.debit(1500);
console.log('Post-debit Balance:', officeEquipment.getBalance()); // Outputs: 6500
officeEquipment.credit(2000);
console.log('Post-credit Balance:', officeEquipment.getBalance()); // Outputs: 4500```

### JournalEntry Class

This class is used for creating and managing journal entries involving multiple transactions.

#### Constructor and Methods

```new JournalEntry(description, date = new Date())```
```addEntry(account, amount, type)```
```commit()```

#### Usage Example

```import { JournalEntry, Account } from 'balancebookjs';

const cash = new Account('Cash', 1000);
const rentExpense = new Account('Rent', 0);
let entry = new JournalEntry("Payment of rent");
entry.addEntry(cash, 500, 'credit');
entry.addEntry(rentExpense, 500, 'debit');
try {
    entry.commit();
    console.log('Journal entry committed successfully.');
} catch (error) {
    console.error('Failed to commit journal entry:', error.message);
}```
