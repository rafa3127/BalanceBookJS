# Improvement: Multi-Currency Support

## 🎯 AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature. This improvement depends on the Money Value Object (002) being implemented first.

## 📋 Overview
**Priority**: Medium  
**Category**: Feature  
**Complexity**: Complex  
**Breaking Change**: No (backward compatible with single currency)

### Brief Description
Implement comprehensive multi-currency support allowing accounts to hold different currencies, automatic conversion between currencies, and proper handling of exchange rate gains/losses. This is essential for international businesses and global financial management.

## 🎯 Success Criteria
- [ ] Support for multiple currencies per ledger
- [ ] Real-time and historical exchange rates
- [ ] Automatic currency conversion in journal entries
- [ ] Exchange rate gain/loss tracking
- [ ] Multi-currency financial reports
- [ ] Configurable base/reporting currency
- [ ] Currency conversion audit trail

## 📐 Technical Design

### Proposed Solution
Extend the Money class with currency conversion capabilities and create an ExchangeRateProvider for managing conversion rates.

### New Classes
```javascript
// Exchange Rate Management
class ExchangeRateProvider {
    constructor() {
        this.rates = new Map(); // "USD/EUR/2025-01-15" -> rate
        this.baseCurrency = 'USD';
    }

    setBaseCurrency(currency) {
        this.baseCurrency = currency;
    }

    // Add exchange rate for a specific date
    addRate(fromCurrency, toCurrency, rate, date = new Date()) {
        const dateStr = this.formatDate(date);
        const key = `${fromCurrency}/${toCurrency}/${dateStr}`;
        const reverseKey = `${toCurrency}/${fromCurrency}/${dateStr}`;
        
        this.rates.set(key, rate);
        this.rates.set(reverseKey, 1 / rate);
    }

    // Bulk import rates
    importRates(ratesData) {
        for (const rateEntry of ratesData) {
            this.addRate(
                rateEntry.from,
                rateEntry.to,
                rateEntry.rate,
                rateEntry.date
            );
        }
    }

    // Get exchange rate for specific date
    getRate(fromCurrency, toCurrency, date = new Date()) {
        if (fromCurrency === toCurrency) return 1;

        const dateStr = this.formatDate(date);
        const directKey = `${fromCurrency}/${toCurrency}/${dateStr}`;
        
        // Try direct rate
        if (this.rates.has(directKey)) {
            return this.rates.get(directKey);
        }

        // Try cross rate through base currency
        const toBaseKey = `${fromCurrency}/${this.baseCurrency}/${dateStr}`;
        const fromBaseKey = `${this.baseCurrency}/${toCurrency}/${dateStr}`;
        
        if (this.rates.has(toBaseKey) && this.rates.has(fromBaseKey)) {
            return this.rates.get(toBaseKey) * this.rates.get(fromBaseKey);
        }

        // Try to find closest date
        const closestRate = this.findClosestRate(fromCurrency, toCurrency, date);
        if (closestRate) return closestRate;

        throw new Error(`No exchange rate found for ${fromCurrency} to ${toCurrency} on ${dateStr}`);
    }

    // Find closest available rate
    findClosestRate(fromCurrency, toCurrency, targetDate) {
        const targetTime = targetDate.getTime();
        let closestRate = null;
        let closestDiff = Infinity;

        for (const [key, rate] of this.rates) {
            const [from, to, dateStr] = key.split('/');
            if (from === fromCurrency && to === toCurrency) {
                const date = new Date(dateStr);
                const diff = Math.abs(date.getTime() - targetTime);
                
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestRate = rate;
                }
            }
        }

        return closestRate;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
}

// Extended Money class with currency conversion
class MultiCurrencyMoney extends Money {
    constructor(amount, currency = 'USD', exchangeRateProvider = null) {
        super(amount, currency);
        this.exchangeRateProvider = exchangeRateProvider;
    }

    // Convert to another currency
    convertTo(targetCurrency, date = new Date()) {
        if (this.currency === targetCurrency) {
            return new MultiCurrencyMoney(
                this.toNumber(),
                targetCurrency,
                this.exchangeRateProvider
            );
        }

        if (!this.exchangeRateProvider) {
            throw new Error('Exchange rate provider required for currency conversion');
        }

        const rate = this.exchangeRateProvider.getRate(
            this.currency,
            targetCurrency,
            date
        );

        return new MultiCurrencyMoney(
            this.toNumber() * rate,
            targetCurrency,
            this.exchangeRateProvider
        );
    }

    // Add with automatic conversion
    addWithConversion(other, targetCurrency = this.currency, date = new Date()) {
        const converted = other.currency === targetCurrency 
            ? other 
            : other.convertTo(targetCurrency, date);
        
        return this.convertTo(targetCurrency, date).add(converted);
    }

    // Check if currencies match
    isSameCurrency(other) {
        return this.currency === other.currency;
    }
}

// Multi-currency Account
class MultiCurrencyAccount extends Account {
    constructor(name, initialBalance, isDebitPositive, currency = 'USD', exchangeRateProvider = null) {
        super(name, initialBalance, isDebitPositive);
        this.currency = currency;
        this.exchangeRateProvider = exchangeRateProvider;
        
        // Store balances per currency
        this.balancesByCurrency = new Map();
        
        if (initialBalance instanceof MultiCurrencyMoney) {
            this.balancesByCurrency.set(initialBalance.currency, initialBalance);
        } else if (typeof initialBalance === 'number') {
            this.balancesByCurrency.set(
                currency,
                new MultiCurrencyMoney(initialBalance, currency, exchangeRateProvider)
            );
        }
    }

    // Override debit method
    debit(amount, date = new Date()) {
        const money = this.ensureMoneyObject(amount);
        
        if (!this.balancesByCurrency.has(money.currency)) {
            this.balancesByCurrency.set(
                money.currency,
                new MultiCurrencyMoney(0, money.currency, this.exchangeRateProvider)
            );
        }

        const currentBalance = this.balancesByCurrency.get(money.currency);
        const newBalance = this.isDebitPositive 
            ? currentBalance.add(money)
            : currentBalance.subtract(money);
        
        this.balancesByCurrency.set(money.currency, newBalance);
    }

    // Override credit method  
    credit(amount, date = new Date()) {
        const money = this.ensureMoneyObject(amount);
        
        if (!this.balancesByCurrency.has(money.currency)) {
            this.balancesByCurrency.set(
                money.currency,
                new MultiCurrencyMoney(0, money.currency, this.exchangeRateProvider)
            );
        }

        const currentBalance = this.balancesByCurrency.get(money.currency);
        const newBalance = this.isDebitPositive 
            ? currentBalance.subtract(money)
            : currentBalance.add(money);
        
        this.balancesByCurrency.set(money.currency, newBalance);
    }

    // Get balance in specific currency
    getBalance(currency = null, date = new Date()) {
        if (!currency) {
            // Return primary currency balance
            return this.getBalanceInBaseCurrency(date);
        }

        // Return balance in requested currency
        let total = new MultiCurrencyMoney(0, currency, this.exchangeRateProvider);
        
        for (const [curr, balance] of this.balancesByCurrency) {
            if (curr === currency) {
                total = total.add(balance);
            } else {
                const converted = balance.convertTo(currency, date);
                total = total.add(converted);
            }
        }

        return total;
    }

    // Get all currency balances
    getAllBalances() {
        return new Map(this.balancesByCurrency);
    }

    // Get balance in base currency for reporting
    getBalanceInBaseCurrency(date = new Date()) {
        const baseCurrency = this.exchangeRateProvider?.baseCurrency || 'USD';
        return this.getBalance(baseCurrency, date);
    }

    ensureMoneyObject(amount) {
        if (amount instanceof MultiCurrencyMoney) {
            return amount;
        }
        return new MultiCurrencyMoney(
            amount,
            this.currency,
            this.exchangeRateProvider
        );
    }
}

// Exchange Rate Gain/Loss Tracking
class ExchangeRateGainLoss {
    constructor(generalLedger, exchangeRateProvider) {
        this.ledger = generalLedger;
        this.exchangeRateProvider = exchangeRateProvider;
    }

    // Calculate unrealized gains/losses
    calculateUnrealizedGainLoss(date = new Date()) {
        const gainLoss = [];
        const baseCurrency = this.exchangeRateProvider.baseCurrency;

        for (const account of this.ledger.getAllAccounts()) {
            if (account instanceof MultiCurrencyAccount) {
                const balances = account.getAllBalances();
                
                for (const [currency, balance] of balances) {
                    if (currency !== baseCurrency) {
                        // Get historical rate (when transaction occurred)
                        const historicalRate = this.getHistoricalRate(account, currency);
                        
                        // Get current rate
                        const currentRate = this.exchangeRateProvider.getRate(
                            currency,
                            baseCurrency,
                            date
                        );

                        const balanceAmount = balance.toNumber();
                        const historicalValue = balanceAmount * historicalRate;
                        const currentValue = balanceAmount * currentRate;
                        const difference = currentValue - historicalValue;

                        if (Math.abs(difference) > 0.01) {
                            gainLoss.push({
                                account: account.name,
                                currency: currency,
                                balance: balanceAmount,
                                historicalRate: historicalRate,
                                currentRate: currentRate,
                                gain: difference > 0 ? difference : 0,
                                loss: difference < 0 ? Math.abs(difference) : 0,
                                unrealized: true
                            });
                        }
                    }
                }
            }
        }

        return gainLoss;
    }

    // Record realized gain/loss when converting currency
    recordRealizedGainLoss(fromAmount, toAmount, description = 'Currency Exchange') {
        const baseCurrency = this.exchangeRateProvider.baseCurrency;
        
        // Convert both to base currency to calculate gain/loss
        const fromBaseValue = fromAmount.convertTo(baseCurrency);
        const toBaseValue = toAmount.convertTo(baseCurrency);
        
        const difference = toBaseValue.toNumber() - fromBaseValue.toNumber();
        
        if (Math.abs(difference) > 0.01) {
            const gainLossAccount = difference > 0 
                ? this.ledger.getAccount('Exchange Rate Gains')
                : this.ledger.getAccount('Exchange Rate Losses');

            const entry = new JournalEntry(description);
            
            if (difference > 0) {
                // Gain
                entry.addEntry(gainLossAccount, Math.abs(difference), 'credit');
            } else {
                // Loss
                entry.addEntry(gainLossAccount, Math.abs(difference), 'debit');
            }

            // Balance with equity or retained earnings
            const retainedEarnings = this.ledger.getAccount('Retained Earnings');
            entry.addEntry(
                retainedEarnings,
                Math.abs(difference),
                difference > 0 ? 'debit' : 'credit'
            );

            this.ledger.postJournalEntry(entry);
            
            return {
                type: difference > 0 ? 'gain' : 'loss',
                amount: Math.abs(difference),
                journalEntry: entry
            };
        }

        return null;
    }

    getHistoricalRate(account, currency) {
        // This would need to track the weighted average rate
        // from all transactions in that currency
        // Simplified for this example
        return 1;
    }
}

// Multi-currency Journal Entry
class MultiCurrencyJournalEntry extends JournalEntry {
    constructor(description, date = new Date(), baseCurrency = 'USD', exchangeRateProvider = null) {
        super(description, date);
        this.baseCurrency = baseCurrency;
        this.exchangeRateProvider = exchangeRateProvider;
    }

    // Override commit to handle multi-currency validation
    commit() {
        // Convert all amounts to base currency for validation
        let totalDebits = 0;
        let totalCredits = 0;

        for (const entry of this.entries) {
            const amount = entry.amount instanceof MultiCurrencyMoney
                ? entry.amount.convertTo(this.baseCurrency, this.date).toNumber()
                : entry.amount;

            if (entry.type === 'debit') {
                totalDebits += amount;
            } else {
                totalCredits += amount;
            }
        }

        if (Math.abs(totalDebits - totalCredits) > 0.01) {
            throw new Error(
                `Multi-currency journal entry not balanced. ` +
                `Debits: ${totalDebits} ${this.baseCurrency}, ` +
                `Credits: ${totalCredits} ${this.baseCurrency}`
            );
        }

        // Apply entries
        for (const entry of this.entries) {
            entry.account[entry.type](entry.amount, this.date);
        }
    }
}
```

## 🔄 Implementation Steps

1. **Create ExchangeRateProvider**
   - Rate storage and retrieval
   - Cross-rate calculation
   - Historical rate tracking

2. **Extend Money Class**
   - Add currency conversion
   - Multi-currency arithmetic
   - Conversion validation

3. **Create MultiCurrencyAccount**
   - Store balances per currency
   - Currency-aware debit/credit
   - Balance conversion methods

4. **Implement Exchange Gain/Loss**
   - Unrealized gain/loss calculation
   - Realized gain/loss recording
   - Reporting integration

5. **Update Journal Entries**
   - Multi-currency validation
   - Automatic conversion support
   - Exchange difference handling

## 🧪 Testing Requirements

### Unit Tests
```javascript
describe('MultiCurrency', () => {
    let exchangeProvider;
    
    beforeEach(() => {
        exchangeProvider = new ExchangeRateProvider();
        exchangeProvider.setBaseCurrency('USD');
        
        // Setup exchange rates
        exchangeProvider.addRate('USD', 'EUR', 0.85, new Date('2025-01-15'));
        exchangeProvider.addRate('USD', 'GBP', 0.73, new Date('2025-01-15'));
        exchangeProvider.addRate('EUR', 'GBP', 0.86, new Date('2025-01-15'));
    });

    it('should convert between currencies', () => {
        const usd = new MultiCurrencyMoney(100, 'USD', exchangeProvider);
        const eur = usd.convertTo('EUR', new Date('2025-01-15'));
        
        expect(eur.currency).toBe('EUR');
        expect(eur.toNumber()).toBeCloseTo(85, 2);
    });

    it('should handle multi-currency accounts', () => {
        const account = new MultiCurrencyAccount(
            'International Cash',
            0,
            true,
            'USD',
            exchangeProvider
        );

        account.debit(new MultiCurrencyMoney(100, 'USD', exchangeProvider));
        account.debit(new MultiCurrencyMoney(50, 'EUR', exchangeProvider));
        
        const usdBalance = account.getBalance('USD', new Date('2025-01-15'));
        expect(usdBalance.toNumber()).toBeCloseTo(158.82, 2); // 100 USD + (50 EUR * 1.1765)
    });

    it('should track exchange rate gains/losses', () => {
        const ledger = new GeneralLedger();
        const tracker = new ExchangeRateGainLoss(ledger, exchangeProvider);
        
        // Add rate change
        exchangeProvider.addRate('USD', 'EUR', 0.90, new Date('2025-01-20'));
        
        const gainLoss = tracker.calculateUnrealizedGainLoss(new Date('2025-01-20'));
        expect(gainLoss.length).toBeGreaterThan(0);
    });

    it('should validate multi-currency journal entries', () => {
        const entry = new MultiCurrencyJournalEntry(
            'International Transfer',
            new Date('2025-01-15'),
            'USD',
            exchangeProvider
        );

        const usdAccount = new MultiCurrencyAccount('USD Cash', 0, true, 'USD', exchangeProvider);
        const eurAccount = new MultiCurrencyAccount('EUR Cash', 0, true, 'EUR', exchangeProvider);

        entry.addEntry(usdAccount, new MultiCurrencyMoney(100, 'USD', exchangeProvider), 'credit');
        entry.addEntry(eurAccount, new MultiCurrencyMoney(85, 'EUR', exchangeProvider), 'debit');

        expect(() => entry.commit()).not.toThrow();
    });
});
```

## 📦 Dependencies
- [ ] No new runtime dependencies
- [ ] Optional: External API for real-time exchange rates

## 📚 Documentation Updates
- [ ] Add multi-currency usage guide
- [ ] Document exchange rate setup
- [ ] Explain gain/loss calculations
- [ ] Add international accounting examples

## ⚠️ Risks & Considerations
- Exchange rate precision and rounding
- Historical rate storage requirements
- Performance with many currencies
- Regulatory compliance (IFRS/GAAP)
- Real-time rate provider reliability

## 🔗 Related Improvements
- Depends on: Money Value Object (002)
- Enhances: Financial Reports (004)
- Enhances: General Ledger (003)

## 🎯 Example Usage
```javascript
import { 
    MultiCurrencyAccount, 
    MultiCurrencyMoney, 
    MultiCurrencyJournalEntry,
    ExchangeRateProvider,
    GeneralLedger 
} from 'balancebookjs';

// Setup exchange rates
const exchangeProvider = new ExchangeRateProvider();
exchangeProvider.setBaseCurrency('USD');
exchangeProvider.addRate('USD', 'EUR', 0.85, new Date());
exchangeProvider.addRate('USD', 'GBP', 0.73, new Date());

// Create multi-currency accounts
const usdCash = new MultiCurrencyAccount('USD Cash', 10000, true, 'USD', exchangeProvider);
const eurCash = new MultiCurrencyAccount('EUR Cash', 5000, true, 'EUR', exchangeProvider);
const gbpCash = new MultiCurrencyAccount('GBP Cash', 3000, true, 'GBP', exchangeProvider);

// Perform multi-currency transaction
const payment = new MultiCurrencyJournalEntry(
    'International Payment',
    new Date(),
    'USD',
    exchangeProvider
);

payment.addEntry(eurCash, new MultiCurrencyMoney(1000, 'EUR', exchangeProvider), 'debit');
payment.addEntry(usdCash, new MultiCurrencyMoney(1176.47, 'USD', exchangeProvider), 'credit');
payment.commit();

// Get balance in different currencies
console.log('EUR Cash in EUR:', eurCash.getBalance('EUR').format()); // €6,000.00
console.log('EUR Cash in USD:', eurCash.getBalance('USD').format()); // $7,058.82

// Calculate unrealized gains/losses
const tracker = new ExchangeRateGainLoss(ledger, exchangeProvider);
const unrealizedGL = tracker.calculateUnrealizedGainLoss();
console.log('Unrealized Gains/Losses:', unrealizedGL);

// Import bulk exchange rates
const historicalRates = [
    { from: 'USD', to: 'EUR', rate: 0.84, date: new Date('2025-01-01') },
    { from: 'USD', to: 'EUR', rate: 0.85, date: new Date('2025-01-15') },
    { from: 'USD', to: 'EUR', rate: 0.86, date: new Date('2025-01-31') }
];
exchangeProvider.importRates(historicalRates);
```

---
*Status: Not Started*  
*Assigned: Unassigned*  
*PR: N/A*
