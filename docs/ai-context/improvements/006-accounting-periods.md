# Improvement: Accounting Periods System

## 🎯 AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature. This improvement enhances the General Ledger with proper period management.

## 📋 Overview
**Priority**: Medium  
**Category**: Feature  
**Complexity**: Medium  
**Breaking Change**: No (additive feature)

### Brief Description
Implement a comprehensive accounting periods system that manages fiscal years, quarters, and months. This enables proper period-end closing, prevents posting to closed periods, and supports period-based reporting.

## 🎯 Success Criteria
- [ ] Define and manage fiscal years with custom start/end dates
- [ ] Support monthly, quarterly, and annual periods
- [ ] Period opening and closing procedures
- [ ] Prevent posting to closed periods
- [ ] Period-based account balances
- [ ] Year-end closing with income/expense reset
- [ ] Period comparison reporting

## 📐 Technical Design

### Proposed Solution
Create an AccountingPeriod system that integrates with the GeneralLedger to enforce period controls and facilitate period-based operations.

### New Classes
```javascript
class AccountingPeriod {
    constructor(startDate, endDate, type = 'MONTH') {
        this.startDate = startDate;
        this.endDate = endDate;
        this.type = type; // MONTH, QUARTER, YEAR, CUSTOM
        this.status = 'OPEN'; // OPEN, CLOSING, CLOSED
        this.closedDate = null;
        this.closedBy = null;
        this.id = this.generateId();
        this.name = this.generateName();
    }

    generateId() {
        const year = this.startDate.getFullYear();
        const month = String(this.startDate.getMonth() + 1).padStart(2, '0');
        
        switch(this.type) {
            case 'MONTH':
                return `${year}-${month}`;
            case 'QUARTER':
                const quarter = Math.ceil((this.startDate.getMonth() + 1) / 3);
                return `${year}-Q${quarter}`;
            case 'YEAR':
                return `${year}`;
            default:
                return `CUSTOM-${this.startDate.toISOString()}-${this.endDate.toISOString()}`;
        }
    }

    generateName() {
        const year = this.startDate.getFullYear();
        
        switch(this.type) {
            case 'MONTH':
                const monthName = this.startDate.toLocaleString('default', { month: 'long' });
                return `${monthName} ${year}`;
            case 'QUARTER':
                const quarter = Math.ceil((this.startDate.getMonth() + 1) / 3);
                return `Q${quarter} ${year}`;
            case 'YEAR':
                return `Fiscal Year ${year}`;
            default:
                return `Custom Period ${this.id}`;
        }
    }

    isWithinPeriod(date) {
        return date >= this.startDate && date <= this.endDate;
    }

    canPost() {
        return this.status === 'OPEN';
    }

    close(closedBy = 'System') {
        if (this.status === 'CLOSED') {
            throw new Error(`Period ${this.name} is already closed`);
        }
        
        this.status = 'CLOSING';
        this.closedDate = new Date();
        this.closedBy = closedBy;
    }

    finalizeClosure() {
        if (this.status !== 'CLOSING') {
            throw new Error(`Period ${this.name} must be in CLOSING status to finalize`);
        }
        this.status = 'CLOSED';
    }

    reopen(reason, authorizedBy) {
        if (this.status !== 'CLOSED') {
            throw new Error(`Only closed periods can be reopened`);
        }
        
        this.status = 'OPEN';
        this.reopenReason = reason;
        this.reopenedBy = authorizedBy;
        this.reopenedDate = new Date();
    }
}

class FiscalYear {
    constructor(year, startMonth = 1, startDay = 1) {
        this.year = year;
        this.startDate = new Date(year, startMonth - 1, startDay);
        this.endDate = new Date(year + 1, startMonth - 1, startDay - 1, 23, 59, 59, 999);
        this.periods = [];
        this.status = 'OPEN';
        
        this.generatePeriods();
    }

    generatePeriods() {
        // Generate 12 monthly periods
        for (let i = 0; i < 12; i++) {
            const periodStart = new Date(this.startDate);
            periodStart.setMonth(this.startDate.getMonth() + i);
            
            const periodEnd = new Date(periodStart);
            periodEnd.setMonth(periodStart.getMonth() + 1);
            periodEnd.setDate(periodEnd.getDate() - 1);
            periodEnd.setHours(23, 59, 59, 999);
            
            this.periods.push(new AccountingPeriod(periodStart, periodEnd, 'MONTH'));
        }
        
        // Generate 4 quarterly periods
        for (let q = 0; q < 4; q++) {
            const quarterStart = new Date(this.startDate);
            quarterStart.setMonth(this.startDate.getMonth() + (q * 3));
            
            const quarterEnd = new Date(quarterStart);
            quarterEnd.setMonth(quarterStart.getMonth() + 3);
            quarterEnd.setDate(quarterEnd.getDate() - 1);
            quarterEnd.setHours(23, 59, 59, 999);
            
            this.periods.push(new AccountingPeriod(quarterStart, quarterEnd, 'QUARTER'));
        }
        
        // Add the annual period
        this.periods.push(new AccountingPeriod(this.startDate, this.endDate, 'YEAR'));
    }

    getPeriod(date) {
        return this.periods.find(period => 
            period.type === 'MONTH' && period.isWithinPeriod(date)
        );
    }

    getQuarter(date) {
        return this.periods.find(period => 
            period.type === 'QUARTER' && period.isWithinPeriod(date)
        );
    }

    closeMonth(month) {
        const period = this.periods.find(p => 
            p.type === 'MONTH' && 
            p.startDate.getMonth() === month - 1
        );
        
        if (!period) {
            throw new Error(`Month ${month} not found in fiscal year`);
        }
        
        period.close();
        return period;
    }

    isYearClosed() {
        const yearPeriod = this.periods.find(p => p.type === 'YEAR');
        return yearPeriod.status === 'CLOSED';
    }
}

class PeriodManager {
    constructor(generalLedger) {
        this.ledger = generalLedger;
        this.fiscalYears = new Map();
        this.currentPeriod = null;
        this.settings = {
            fiscalYearStartMonth: 1,
            fiscalYearStartDay: 1,
            allowPostingToClosedPeriods: false,
            requirePeriodEndAdjustments: true
        };
    }

    initializeFiscalYear(year) {
        if (this.fiscalYears.has(year)) {
            throw new Error(`Fiscal year ${year} already exists`);
        }
        
        const fiscalYear = new FiscalYear(
            year,
            this.settings.fiscalYearStartMonth,
            this.settings.fiscalYearStartDay
        );
        
        this.fiscalYears.set(year, fiscalYear);
        
        // Set current period if not set
        if (!this.currentPeriod) {
            const today = new Date();
            this.currentPeriod = fiscalYear.getPeriod(today);
        }
        
        return fiscalYear;
    }

    getCurrentPeriod() {
        return this.currentPeriod;
    }

    setCurrentPeriod(period) {
        if (period.status === 'CLOSED' && !this.settings.allowPostingToClosedPeriods) {
            throw new Error('Cannot set current period to a closed period');
        }
        this.currentPeriod = period;
    }

    getPeriodForDate(date) {
        const year = date.getFullYear();
        const fiscalYear = this.fiscalYears.get(year);
        
        if (!fiscalYear) {
            throw new Error(`Fiscal year ${year} not initialized`);
        }
        
        return fiscalYear.getPeriod(date);
    }

    validatePosting(date) {
        const period = this.getPeriodForDate(date);
        
        if (!period) {
            throw new Error(`No period found for date ${date}`);
        }
        
        if (!period.canPost() && !this.settings.allowPostingToClosedPeriods) {
            throw new Error(`Cannot post to closed period ${period.name}`);
        }
        
        return true;
    }

    closePeriod(period, options = {}) {
        const {
            performAdjustments = true,
            closeToRetainedEarnings = false,
            validateTrialBalance = true
        } = options;
        
        // Start closing process
        period.close();
        
        try {
            // Validate trial balance if required
            if (validateTrialBalance) {
                const trialBalance = this.ledger.generateTrialBalance(period.endDate);
                if (!trialBalance.isBalanced) {
                    throw new Error('Trial balance is not balanced');
                }
            }
            
            // Perform period-end adjustments
            if (performAdjustments && this.settings.requirePeriodEndAdjustments) {
                this.performPeriodEndAdjustments(period);
            }
            
            // Close income and expense accounts if year-end
            if (period.type === 'YEAR' || closeToRetainedEarnings) {
                this.closeTemporaryAccounts(period);
            }
            
            // Finalize the closure
            period.finalizeClosure();
            
            // Create closing report
            return this.generateClosingReport(period);
            
        } catch (error) {
            // Rollback on error
            period.status = 'OPEN';
            throw error;
        }
    }

    performPeriodEndAdjustments(period) {
        const adjustments = [];
        
        // Accruals
        adjustments.push(this.calculateAccruals(period));
        
        // Deferrals
        adjustments.push(this.calculateDeferrals(period));
        
        // Depreciation
        adjustments.push(this.calculateDepreciation(period));
        
        // Post adjustments
        for (const adjustment of adjustments) {
            if (adjustment) {
                this.ledger.postJournalEntry(adjustment);
            }
        }
        
        return adjustments;
    }

    closeTemporaryAccounts(period) {
        const closingEntries = [];
        const retainedEarnings = this.ledger.getAccount('Retained Earnings');
        let netIncome = 0;
        
        // Close revenue accounts
        const revenueAccounts = this.ledger.getAllAccounts()
            .filter(acc => acc.constructor.name === 'Income');
        
        for (const account of revenueAccounts) {
            const balance = account.getBalance();
            if (balance !== 0) {
                const entry = new JournalEntry(
                    `Closing ${account.name}`,
                    period.endDate
                );
                entry.addEntry(account, balance, 'debit');
                entry.addEntry(retainedEarnings, balance, 'credit');
                this.ledger.postJournalEntry(entry);
                closingEntries.push(entry);
                netIncome += balance;
            }
        }
        
        // Close expense accounts
        const expenseAccounts = this.ledger.getAllAccounts()
            .filter(acc => acc.constructor.name === 'Expense');
        
        for (const account of expenseAccounts) {
            const balance = account.getBalance();
            if (balance !== 0) {
                const entry = new JournalEntry(
                    `Closing ${account.name}`,
                    period.endDate
                );
                entry.addEntry(retainedEarnings, balance, 'debit');
                entry.addEntry(account, balance, 'credit');
                this.ledger.postJournalEntry(entry);
                closingEntries.push(entry);
                netIncome -= balance;
            }
        }
        
        return {
            closingEntries,
            netIncome,
            closedAccounts: revenueAccounts.length + expenseAccounts.length
        };
    }

    generateClosingReport(period) {
        return {
            period: {
                id: period.id,
                name: period.name,
                startDate: period.startDate,
                endDate: period.endDate,
                type: period.type
            },
            closedDate: period.closedDate,
            closedBy: period.closedBy,
            trialBalance: this.ledger.generateTrialBalance(period.endDate),
            adjustments: this.getPerformedAdjustments(period),
            closingEntries: this.getClosingEntries(period)
        };
    }

    // Period-based balance calculation
    getPeriodBalance(account, period) {
        const history = this.ledger.getAccountHistory(
            account.name,
            period.startDate,
            period.endDate
        );
        
        let periodActivity = 0;
        for (const transaction of history) {
            if (transaction.type === 'debit') {
                periodActivity += account.isDebitPositive ? transaction.amount : -transaction.amount;
            } else {
                periodActivity += account.isDebitPositive ? -transaction.amount : transaction.amount;
            }
        }
        
        return {
            openingBalance: this.getBalanceAtDate(account, period.startDate),
            periodActivity: periodActivity,
            closingBalance: this.getBalanceAtDate(account, period.endDate)
        };
    }

    // Compare periods
    comparePeriods(period1, period2) {
        const accounts = this.ledger.getAllAccounts();
        const comparison = {
            period1: period1.name,
            period2: period2.name,
            accounts: []
        };
        
        for (const account of accounts) {
            const balance1 = this.getPeriodBalance(account, period1);
            const balance2 = this.getPeriodBalance(account, period2);
            
            comparison.accounts.push({
                name: account.name,
                type: account.constructor.name,
                period1: balance1.closingBalance,
                period2: balance2.closingBalance,
                variance: balance2.closingBalance - balance1.closingBalance,
                variancePercent: balance1.closingBalance !== 0 
                    ? ((balance2.closingBalance - balance1.closingBalance) / balance1.closingBalance) * 100
                    : 0
            });
        }
        
        return comparison;
    }

    calculateAccruals(period) {
        // Placeholder for accrual calculations
        // Would calculate things like accrued interest, wages, etc.
        return null;
    }

    calculateDeferrals(period) {
        // Placeholder for deferral calculations
        // Would handle prepaid expenses, unearned revenue, etc.
        return null;
    }

    calculateDepreciation(period) {
        // Placeholder for depreciation calculations
        return null;
    }

    getPerformedAdjustments(period) {
        // Get adjustments performed for the period
        return this.ledger.getJournalEntries({
            startDate: period.endDate,
            endDate: period.endDate,
            searchTerm: 'Adjustment'
        });
    }

    getClosingEntries(period) {
        // Get closing entries for the period
        return this.ledger.getJournalEntries({
            startDate: period.endDate,
            endDate: period.endDate,
            searchTerm: 'Closing'
        });
    }

    getBalanceAtDate(account, date) {
        // Calculate balance up to a specific date
        const history = this.ledger.getAccountHistory(account.name, null, date);
        let balance = 0;
        
        for (const transaction of history) {
            if (transaction.type === 'debit') {
                balance += account.isDebitPositive ? transaction.amount : -transaction.amount;
            } else {
                balance += account.isDebitPositive ? -transaction.amount : transaction.amount;
            }
        }
        
        return balance;
    }
}
```

## 🔄 Implementation Steps

1. **Create AccountingPeriod Class**
   - Period definition and status management
   - Date validation methods
   - Closing procedures

2. **Implement FiscalYear**
   - Generate monthly/quarterly/annual periods
   - Period lookup methods
   - Year-end procedures

3. **Build PeriodManager**
   - Integration with GeneralLedger
   - Period validation for postings
   - Closing orchestration

4. **Add Period Controls**
   - Prevent posting to closed periods
   - Period-based reporting
   - Adjustment tracking

5. **Implement Closing Procedures**
   - Trial balance validation
   - Temporary account closure
   - Retained earnings transfer

## 🧪 Testing Requirements

### Unit Tests
```javascript
describe('AccountingPeriods', () => {
    let ledger, periodManager;
    
    beforeEach(() => {
        ledger = new GeneralLedger();
        periodManager = new PeriodManager(ledger);
        
        // Setup test accounts
        ledger.addAccount(new Asset('Cash', 10000));
        ledger.addAccount(new Income('Sales Revenue', 0));
        ledger.addAccount(new Expense('Rent Expense', 0));
        ledger.addAccount(new Equity('Retained Earnings', 0));
    });

    it('should initialize fiscal year with correct periods', () => {
        const fiscalYear = periodManager.initializeFiscalYear(2025);
        
        expect(fiscalYear.periods.length).toBe(17); // 12 months + 4 quarters + 1 year
        expect(fiscalYear.periods.filter(p => p.type === 'MONTH').length).toBe(12);
        expect(fiscalYear.periods.filter(p => p.type === 'QUARTER').length).toBe(4);
        expect(fiscalYear.periods.filter(p => p.type === 'YEAR').length).toBe(1);
    });

    it('should prevent posting to closed periods', () => {
        const fiscalYear = periodManager.initializeFiscalYear(2025);
        const january = fiscalYear.periods.find(p => 
            p.type === 'MONTH' && p.startDate.getMonth() === 0
        );
        
        periodManager.closePeriod(january);
        
        const entry = new JournalEntry('Test Entry', new Date('2025-01-15'));
        entry.addEntry(ledger.getAccount('Cash'), 100, 'debit');
        entry.addEntry(ledger.getAccount('Sales Revenue'), 100, 'credit');
        
        expect(() => {
            periodManager.validatePosting(entry.date);
        }).toThrow('Cannot post to closed period');
    });

    it('should close temporary accounts at year-end', () => {
        const fiscalYear = periodManager.initializeFiscalYear(2025);
        
        // Post some transactions
        const sale = new JournalEntry('Sale', new Date('2025-06-15'));
        sale.addEntry(ledger.getAccount('Cash'), 1000, 'debit');
        sale.addEntry(ledger.getAccount('Sales Revenue'), 1000, 'credit');
        ledger.postJournalEntry(sale);
        
        const rent = new JournalEntry('Rent', new Date('2025-06-20'));
        rent.addEntry(ledger.getAccount('Rent Expense'), 500, 'debit');
        rent.addEntry(ledger.getAccount('Cash'), 500, 'credit');
        ledger.postJournalEntry(rent);
        
        // Close the year
        const yearPeriod = fiscalYear.periods.find(p => p.type === 'YEAR');
        const closingResult = periodManager.closePeriod(yearPeriod, {
            closeToRetainedEarnings: true
        });
        
        expect(ledger.getAccount('Sales Revenue').getBalance()).toBe(0);
        expect(ledger.getAccount('Rent Expense').getBalance()).toBe(0);
        expect(ledger.getAccount('Retained Earnings').getBalance()).toBe(500); // 1000 - 500
        expect(closingResult.netIncome).toBe(500);
    });

    it('should compare periods correctly', () => {
        const fiscalYear = periodManager.initializeFiscalYear(2025);
        const jan = fiscalYear.periods.find(p => 
            p.type === 'MONTH' && p.startDate.getMonth() === 0
        );
        const feb = fiscalYear.periods.find(p => 
            p.type === 'MONTH' && p.startDate.getMonth() === 1
        );
        
        // Post transactions in different periods
        const janSale = new JournalEntry('January Sale', new Date('2025-01-15'));
        janSale.addEntry(ledger.getAccount('Cash'), 1000, 'debit');
        janSale.addEntry(ledger.getAccount('Sales Revenue'), 1000, 'credit');
        ledger.postJournalEntry(janSale);
        
        const febSale = new JournalEntry('February Sale', new Date('2025-02-15'));
        febSale.addEntry(ledger.getAccount('Cash'), 1500, 'debit');
        febSale.addEntry(ledger.getAccount('Sales Revenue'), 1500, 'credit');
        ledger.postJournalEntry(febSale);
        
        const comparison = periodManager.comparePeriods(jan, feb);
        
        const cashComparison = comparison.accounts.find(a => a.name === 'Cash');
        expect(cashComparison.variance).toBe(500); // 1500 - 1000
        expect(cashComparison.variancePercent).toBe(50); // 50% increase
    });
});
```

## 📦 Dependencies
- [ ] No new runtime dependencies

## 📚 Documentation Updates
- [ ] Add period management documentation
- [ ] Document closing procedures
- [ ] Add fiscal year configuration guide
- [ ] Include period comparison examples

## ⚠️ Risks & Considerations
- Data integrity during closing process
- Rollback capability for closures
- Performance with many periods
- Compliance with different fiscal year conventions

## 🔗 Related Improvements
- Depends on: General Ledger (003)
- Enhances: Financial Reports (004)
- Related to: Audit Trail

## 🎯 Example Usage
```javascript
import { GeneralLedger, PeriodManager, Asset, Income, Expense } from 'balancebookjs';

// Setup
const ledger = new GeneralLedger();
const periodManager = new PeriodManager(ledger);

// Initialize fiscal year
const fiscalYear2025 = periodManager.initializeFiscalYear(2025);

// Configure settings
periodManager.settings.fiscalYearStartMonth = 4; // April start
periodManager.settings.allowPostingToClosedPeriods = false;

// Get current period
const currentPeriod = periodManager.getCurrentPeriod();
console.log('Current Period:', currentPeriod.name);

// Validate before posting
const entry = new JournalEntry('Sale', new Date());
if (periodManager.validatePosting(entry.date)) {
    ledger.postJournalEntry(entry);
}

// Month-end closing
const january = fiscalYear2025.getPeriod(new Date('2025-01-15'));
const closingReport = periodManager.closePeriod(january, {
    performAdjustments: true,
    validateTrialBalance: true
});

console.log('Closing Report:', closingReport);

// Year-end closing
const yearPeriod = fiscalYear2025.periods.find(p => p.type === 'YEAR');
const yearEndReport = periodManager.closePeriod(yearPeriod, {
    closeToRetainedEarnings: true
});

console.log('Net Income for Year:', yearEndReport.netIncome);

// Period comparison
const q1 = fiscalYear2025.getQuarter(new Date('2025-02-15'));
const q2 = fiscalYear2025.getQuarter(new Date('2025-05-15'));
const comparison = periodManager.comparePeriods(q1, q2);

console.log('Quarter Comparison:', comparison);

// Reopen period if needed
january.reopen('Adjustment needed', 'CFO');
```

---
*Status: Not Started*  
*Assigned: Unassigned*  
*PR: N/A*
