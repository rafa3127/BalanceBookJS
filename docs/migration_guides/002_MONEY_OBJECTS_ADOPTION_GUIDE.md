# Money Value Object - Adoption Guide

## 🎯 Important: This is NOT a Breaking Change

**You don't need to change any existing code!** Version 1.3.0 is fully backward compatible. This guide is for developers who want to adopt the new Money value object for better precision.

## 📊 Should You Adopt Money?

### Keep using numbers if:
- Your application deals with simple, single-currency transactions
- You're comfortable with JavaScript's floating-point limitations
- Your amounts rarely involve fractions of cents
- You want to keep your code simple

### Consider adopting Money if:
- You need precise financial calculations (no floating-point errors)
- You work with multiple currencies
- You process many small transactions that could accumulate rounding errors
- You need to distribute amounts evenly (like splitting bills)
- You want type safety for monetary values

## 🔄 Gradual Adoption Strategies

### Strategy 1: New Features Only
Keep existing code as-is, use Money only for new features:

```javascript
// Old code - still works perfectly
const oldAccount = new Asset('Legacy Account', 1000);
oldAccount.debit(500);

// New code - uses Money for precision
const newAccount = new Asset('New Account', new Money(1000, 'USD'));
newAccount.debit(new Money(500, 'USD'));
```

### Strategy 2: Critical Paths First
Migrate only the most critical financial calculations:

```javascript
// Before: Potential precision issues
function calculateInterest(principal, rate, days) {
    return principal * rate * days / 365; // May have floating-point errors
}

// After: Precise calculations
function calculateInterest(principal, rate, days) {
    const principalMoney = Money.isMoney(principal) 
        ? principal 
        : new Money(principal, 'USD');
    return principalMoney.multiply(rate * days / 365);
}
```

### Strategy 3: Currency-Specific Migration
Migrate one currency at a time:

```javascript
// Phase 1: Migrate USD accounts
const usdAccounts = accounts
    .filter(acc => acc.currency === 'USD')
    .map(acc => new Asset(acc.name, new Money(acc.balance, 'USD')));

// Phase 2: Keep other currencies as numbers for now
const otherAccounts = accounts
    .filter(acc => acc.currency !== 'USD')
    .map(acc => new Asset(acc.name, acc.balance));
```

## 💡 Migration Patterns

### Pattern 1: Wrapper Function
Create a wrapper to handle both types:

```javascript
function createSmartAccount(name, balance, currency = 'USD') {
    // Use Money for known currencies, numbers for generic
    if (currency !== 'GENERIC') {
        return new Asset(name, new Money(balance, currency));
    }
    return new Asset(name, balance);
}
```

### Pattern 2: Progressive Enhancement
Add Money support while maintaining number interface:

```javascript
class EnhancedAccount extends Asset {
    constructor(name, balance, currency = 'USD') {
        // Always use Money internally
        const moneyBalance = Money.isMoney(balance) 
            ? balance 
            : new Money(balance, currency);
        super(name, moneyBalance);
    }
    
    // Convenience method for number users
    getBalanceAsNumber() {
        const balance = this.getBalance();
        return Money.isMoney(balance) 
            ? balance.toNumber() 
            : balance;
    }
}
```

### Pattern 3: Dual-Mode Operations
Support both modes in your business logic:

```javascript
function processPayment(account, amount, currency = null) {
    // Detect mode from account
    const currentBalance = account.getBalance();
    
    if (Money.isMoney(currentBalance)) {
        // Account uses Money - use Money for amount
        const moneyAmount = Money.isMoney(amount) 
            ? amount 
            : new Money(amount, currentBalance.currency);
        account.debit(moneyAmount);
    } else {
        // Account uses numbers - use number
        const numAmount = Money.isMoney(amount) 
            ? amount.toNumber() 
            : amount;
        account.debit(numAmount);
    }
}
```

## 🚀 Quick Start Examples

### Example 1: Simple Precision Fix
```javascript
// Before: 0.1 + 0.2 = 0.30000000000000004
const account = new Asset('Savings', 0);
account.credit(0.1);
account.credit(0.2);
console.log(account.getBalance()); // 0.30000000000000004 😟

// After: Exact calculations
const account = new Asset('Savings', new Money(0, 'USD'));
account.credit(new Money(0.1, 'USD'));
account.credit(new Money(0.2, 'USD'));
console.log(account.getBalance().toNumber()); // 0.30 ✅
```

### Example 2: Multi-Currency Safety
```javascript
// Prevent currency mixing errors
const usdAccount = new Asset('USD Bank', new Money(1000, 'USD'));
const eurAccount = new Asset('EUR Bank', new Money(1000, 'EUR'));

// This will throw an error (currency mismatch)
// usdAccount.debit(new Money(100, 'EUR')); // ❌ Error!

// Transfer between currencies requires explicit conversion
const usdAmount = new Money(100, 'USD');
const eurAmount = new Money(85, 'EUR'); // After conversion
usdAccount.credit(usdAmount);
eurAccount.debit(eurAmount);
```

### Example 3: Distribution Without Lost Cents
```javascript
import { Money, MoneyUtils } from 'balance-book-js';

// Split $100 among 3 people
const total = new Money(100, 'USD');
const shares = MoneyUtils.distribute(total, 3);
// Result: [$33.34, $33.33, $33.33]

// Create accounts for each person
const accounts = shares.map((share, i) => 
    new Asset(`Person ${i + 1}`, share)
);
```

## ⚠️ Common Pitfalls to Avoid

### 1. Don't Mix Modes in Same Transaction
```javascript
// ❌ Bad: Mixing number and Money in same transaction
const cash = new Asset('Cash', 1000); // Number mode
const bank = new Asset('Bank', new Money(0, 'USD')); // Money mode

const entry = new JournalEntry('Transfer');
entry.addEntry(cash, 500, 'credit');           // Number
entry.addEntry(bank, new Money(500, 'USD'), 'debit'); // Money
// This works but is confusing!

// ✅ Good: Use consistent mode
const cash = new Asset('Cash', new Money(1000, 'USD'));
const bank = new Asset('Bank', new Money(0, 'USD'));
```

### 2. Remember Type Casting When Needed
```javascript
const account = new Asset('Test', new Money(100, 'USD'));
const balance = account.getBalance(); // Returns Money object

// ❌ This won't work
// const doubled = balance * 2; 

// ✅ Correct approaches:
const doubled1 = balance.multiply(2);                    // Use Money methods
const doubled2 = (balance as Money).toNumber() * 2;     // Cast and convert
```

### 3. Currency Consistency in Journal Entries
```javascript
// ✅ Good: All accounts in same journal entry use same currency
const usdSale = new JournalEntry('US Sale');
const usdCash = new Asset('USD Cash', new Money(0, 'USD'));
const usdRevenue = new Income('USD Revenue', new Money(0, 'USD'));

usdSale.addEntry(usdCash, new Money(100, 'USD'), 'debit');
usdSale.addEntry(usdRevenue, new Money(100, 'USD'), 'credit');
```

## 📚 Resources

- [README.md](../README.md) - Full documentation with Money examples
- [Money Implementation](../docs/ai-context/improvements/002-money-value-object.md) - Technical details
- [Tests](../tests/) - See `AccountMoney.test.ts` and `JournalEntryMoney.test.ts` for examples

## 🎉 Summary

- **No breaking changes** - Your existing code works as-is
- **Opt-in adoption** - Use Money only where you need it
- **Mix and match** - Number and Money accounts can coexist
- **Gradual migration** - Move at your own pace
- **Better precision** - Eliminate floating-point errors where it matters

Remember: The best migration is the one that fits your needs. There's no requirement to use Money everywhere - use it where precision matters most!
