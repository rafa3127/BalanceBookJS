# Improvement: Money Value Object

## 🎯 AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature. This improvement addresses the critical issue of monetary precision in financial calculations.

## 📋 Overview
**Priority**: High  
**Category**: Architecture  
**Complexity**: Medium  
**Breaking Change**: No (backward compatible with number amounts)

### Brief Description
Implement a Money value object to handle monetary amounts with proper precision, avoiding JavaScript's floating-point arithmetic issues. This will ensure accurate financial calculations and support for currency information.

## 🎯 Success Criteria
- [ ] Eliminate floating-point precision errors in calculations
- [ ] Support for currency codes (ISO 4217)
- [ ] Immutable Money objects
- [ ] Backward compatibility with number inputs
- [ ] Arithmetic operations (add, subtract, multiply, divide)
- [ ] Comparison operations (equals, greater than, less than)
- [ ] Format for display with currency symbols

## 📐 Technical Design

### Proposed Solution
Use a decimal library internally (or integer arithmetic with scale) to maintain precision. Wrap this in a Money class that provides a clean API.

### New Classes
```javascript
class Money {
    constructor(amount, currency = 'USD', scale = 2) {
        // Store as integer cents/minor units
        this.minorUnits = this.toMinorUnits(amount, scale);
        this.currency = currency;
        this.scale = scale;
    }

    // Arithmetic operations return new Money instances
    add(other) {
        this.assertSameCurrency(other);
        return new Money(
            this.toMajorUnits(this.minorUnits + other.minorUnits),
            this.currency,
            this.scale
        );
    }

    subtract(other) {
        this.assertSameCurrency(other);
        return new Money(
            this.toMajorUnits(this.minorUnits - other.minorUnits),
            this.currency,
            this.scale
        );
    }

    multiply(factor) {
        return new Money(
            this.toMajorUnits(Math.round(this.minorUnits * factor)),
            this.currency,
            this.scale
        );
    }

    divide(divisor) {
        return new Money(
            this.toMajorUnits(Math.round(this.minorUnits / divisor)),
            this.currency,
            this.scale
        );
    }

    // Comparison methods
    equals(other) {
        return this.minorUnits === other.minorUnits && 
               this.currency === other.currency;
    }

    isGreaterThan(other) {
        this.assertSameCurrency(other);
        return this.minorUnits > other.minorUnits;
    }

    isLessThan(other) {
        this.assertSameCurrency(other);
        return this.minorUnits < other.minorUnits;
    }

    // Utility methods
    toNumber() {
        return this.toMajorUnits(this.minorUnits);
    }

    toString() {
        return `${this.currency} ${this.format()}`;
    }

    format(locale = 'en-US') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: this.currency
        }).format(this.toNumber());
    }

    // Helper methods
    toMinorUnits(amount, scale) {
        return Math.round(amount * Math.pow(10, scale));
    }

    toMajorUnits(minorUnits) {
        return minorUnits / Math.pow(10, this.scale);
    }

    assertSameCurrency(other) {
        if (this.currency !== other.currency) {
            throw new Error(`Cannot operate on different currencies: ${this.currency} and ${other.currency}`);
        }
    }

    // Static factory methods
    static fromCents(cents, currency = 'USD') {
        return new Money(cents / 100, currency);
    }

    static zero(currency = 'USD') {
        return new Money(0, currency);
    }
}
```

### Integration with Account
```javascript
class Account {
    constructor(name, initialBalance, isDebitPositive, currency = 'USD') {
        this.name = name;
        // Accept both number and Money
        this.balance = initialBalance instanceof Money 
            ? initialBalance 
            : new Money(initialBalance, currency);
        this.isDebitPositive = isDebitPositive;
    }

    debit(amount) {
        const money = amount instanceof Money 
            ? amount 
            : new Money(amount, this.balance.currency);
        
        if (this.isDebitPositive) {
            this.balance = this.balance.add(money);
        } else {
            this.balance = this.balance.subtract(money);
        }
    }

    credit(amount) {
        const money = amount instanceof Money 
            ? amount 
            : new Money(amount, this.balance.currency);
        
        if (this.isDebitPositive) {
            this.balance = this.balance.subtract(money);
        } else {
            this.balance = this.balance.add(money);
        }
    }

    getBalance() {
        // Return Money object for new code, number for backward compatibility
        return this.balance;
    }

    getBalanceAsNumber() {
        return this.balance.toNumber();
    }
}
```

## 🔄 Implementation Steps

1. **Create Money Class**
   - Implement basic structure with minor units storage
   - Add arithmetic operations
   - Add comparison methods
   - Add formatting capabilities

2. **Add Currency Support**
   - Create currency constants/enum
   - Validate currency codes
   - Implement currency conversion placeholder

3. **Update Account Class**
   - Modify constructor to accept Money or number
   - Update debit/credit methods
   - Maintain backward compatibility

4. **Update JournalEntry**
   - Handle Money objects in validation
   - Ensure proper addition for balance checking

5. **Add Utility Functions**
   - Parse money from strings
   - Format for different locales
   - Round to appropriate decimal places

## 🧪 Testing Requirements

### Unit Tests
```javascript
describe('Money', () => {
    it('should handle decimal arithmetic correctly', () => {
        const money1 = new Money(0.1);
        const money2 = new Money(0.2);
        const result = money1.add(money2);
        expect(result.toNumber()).toBe(0.3); // No floating point error!
    });

    it('should prevent operations on different currencies', () => {
        const usd = new Money(100, 'USD');
        const eur = new Money(100, 'EUR');
        expect(() => usd.add(eur)).toThrow();
    });

    it('should maintain immutability', () => {
        const original = new Money(100);
        const result = original.add(new Money(50));
        expect(original.toNumber()).toBe(100); // Original unchanged
        expect(result.toNumber()).toBe(150);
    });
});
```

### Integration Tests
```javascript
describe('Account with Money', () => {
    it('should work with Money objects', () => {
        const account = new Asset('Cash', new Money(1000, 'USD'));
        account.debit(new Money(100.50, 'USD'));
        expect(account.getBalance().toNumber()).toBe(1100.50);
    });

    it('should maintain backward compatibility with numbers', () => {
        const account = new Asset('Cash', 1000);
        account.debit(100.50);
        expect(account.getBalanceAsNumber()).toBe(1100.50);
    });
});
```

### Edge Cases to Test
- Very large numbers
- Very small numbers (micro-transactions)
- Negative amounts
- Division with remainders
- Multiplication by decimals
- Different currency scales (JPY has 0 decimal places)

## 📦 Dependencies
- [ ] No new runtime dependencies (implement from scratch)
- [ ] Alternative: Consider decimal.js or big.js if needed

## 🔄 Migration Guide
```javascript
// Old code (still works)
const account = new Asset('Cash', 1000);
account.debit(100);

// New code (recommended)
const account = new Asset('Cash', new Money(1000, 'USD'));
account.debit(new Money(100, 'USD'));

// Mixed usage (supported)
const account = new Asset('Cash', 1000); // Creates Money internally
account.debit(new Money(100, 'USD'));
```

## 📚 Documentation Updates
- [ ] Add Money class documentation
- [ ] Update examples to show Money usage
- [ ] Document precision guarantees
- [ ] Add currency handling guide

## ⚠️ Risks & Considerations
- Performance impact of object creation
- Memory usage increase
- Need to handle currency conversions in future
- Rounding strategies for division
- Serialization/deserialization for persistence

## 🔗 Related Improvements
- Prerequisite for: Multi-currency support (005)
- Enhances: Financial Reports (004)

## 🎯 Example Usage
```javascript
import { Asset, Money } from 'balancebookjs';

// Create account with Money
const cash = new Asset('Cash', Money.zero('USD'));

// Precise calculations
const amount1 = new Money(0.1, 'USD');
const amount2 = new Money(0.2, 'USD');
cash.debit(amount1);
cash.debit(amount2);

// No floating point errors!
console.log(cash.getBalance().toNumber()); // 0.3 (not 0.30000000000000004)

// Formatting
console.log(cash.getBalance().format()); // "$0.30"
console.log(cash.getBalance().format('es-ES')); // "0,30 US$"

// Arithmetic
const payment = new Money(150.75, 'USD');
const tax = payment.multiply(0.08); // 8% tax
const total = payment.add(tax);
console.log(total.format()); // "$162.81"
```

---
*Status: Not Started*  
*Assigned: Unassigned*  
*PR: N/A*
