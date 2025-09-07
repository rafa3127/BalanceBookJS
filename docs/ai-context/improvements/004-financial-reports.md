# Improvement: Financial Reports Generation

## 🎯 AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature. This improvement depends on having a General Ledger (003) implemented.

## 📋 Overview
**Priority**: High  
**Category**: Feature  
**Complexity**: Medium  
**Breaking Change**: No (additive feature)

### Brief Description
Implement comprehensive financial reporting capabilities including Balance Sheet, Income Statement, Cash Flow Statement, and Statement of Changes in Equity. These reports are essential for understanding the financial position and performance of an entity.

## 🎯 Success Criteria
- [ ] Generate Balance Sheet (Statement of Financial Position)
- [ ] Generate Income Statement (Profit & Loss)
- [ ] Generate Cash Flow Statement (Direct and Indirect methods)
- [ ] Generate Statement of Changes in Equity
- [ ] Support for comparative periods
- [ ] Export reports in multiple formats (JSON, CSV, HTML)
- [ ] Customizable report templates

## 📐 Technical Design

### Proposed Solution
Create a FinancialReports class that works with the GeneralLedger to generate standard financial statements.

### New Classes
```javascript
class FinancialReports {
    constructor(generalLedger) {
        this.ledger = generalLedger;
    }

    // Balance Sheet (Statement of Financial Position)
    generateBalanceSheet(date = new Date(), comparativeDate = null) {
        const balanceSheet = {
            reportDate: date,
            comparativeDate,
            assets: {
                current: [],
                nonCurrent: [],
                total: 0
            },
            liabilities: {
                current: [],
                nonCurrent: [],
                total: 0
            },
            equity: {
                items: [],
                total: 0
            },
            validation: {
                balanced: false,
                difference: 0
            }
        };

        // Get all accounts
        const accounts = this.ledger.getAllAccounts();
        
        // Categorize accounts
        for (const account of accounts) {
            const balance = account.getBalance();
            const accountData = {
                name: account.name,
                code: this.ledger.getAccountCode(account.name),
                balance: balance,
                comparativeBalance: comparativeDate ? 
                    this.getBalanceAtDate(account, comparativeDate) : null
            };

            switch (account.constructor.name) {
                case 'Asset':
                    // Classify as current or non-current based on account name/code
                    if (this.isCurrentAsset(account)) {
                        balanceSheet.assets.current.push(accountData);
                    } else {
                        balanceSheet.assets.nonCurrent.push(accountData);
                    }
                    balanceSheet.assets.total += balance;
                    break;
                    
                case 'Liability':
                    if (this.isCurrentLiability(account)) {
                        balanceSheet.liabilities.current.push(accountData);
                    } else {
                        balanceSheet.liabilities.nonCurrent.push(accountData);
                    }
                    balanceSheet.liabilities.total += balance;
                    break;
                    
                case 'Equity':
                    balanceSheet.equity.items.push(accountData);
                    balanceSheet.equity.total += balance;
                    break;
            }
        }

        // Add retained earnings (accumulated income - expenses)
        const retainedEarnings = this.calculateRetainedEarnings(date);
        balanceSheet.equity.items.push({
            name: 'Retained Earnings',
            balance: retainedEarnings,
            comparativeBalance: comparativeDate ? 
                this.calculateRetainedEarnings(comparativeDate) : null
        });
        balanceSheet.equity.total += retainedEarnings;

        // Validate accounting equation
        const difference = balanceSheet.assets.total - 
            (balanceSheet.liabilities.total + balanceSheet.equity.total);
        balanceSheet.validation.balanced = Math.abs(difference) < 0.01;
        balanceSheet.validation.difference = difference;

        return balanceSheet;
    }

    // Income Statement (Profit & Loss)
    generateIncomeStatement(startDate, endDate, comparativeStartDate = null, comparativeEndDate = null) {
        const incomeStatement = {
            period: { start: startDate, end: endDate },
            comparativePeriod: comparativeStartDate ? 
                { start: comparativeStartDate, end: comparativeEndDate } : null,
            revenue: {
                items: [],
                total: 0,
                comparativeTotal: 0
            },
            expenses: {
                operating: [],
                nonOperating: [],
                total: 0,
                comparativeTotal: 0
            },
            calculations: {
                grossProfit: 0,
                operatingProfit: 0,
                profitBeforeTax: 0,
                netProfit: 0,
                comparativeNetProfit: 0
            }
        };

        const accounts = this.ledger.getAllAccounts();

        for (const account of accounts) {
            const periodBalance = this.getPeriodActivity(account, startDate, endDate);
            
            if (account.constructor.name === 'Income') {
                const revenueItem = {
                    name: account.name,
                    code: this.ledger.getAccountCode(account.name),
                    amount: periodBalance,
                    comparativeAmount: comparativeStartDate ? 
                        this.getPeriodActivity(account, comparativeStartDate, comparativeEndDate) : 0
                };
                incomeStatement.revenue.items.push(revenueItem);
                incomeStatement.revenue.total += periodBalance;
                incomeStatement.revenue.comparativeTotal += revenueItem.comparativeAmount;
            } 
            else if (account.constructor.name === 'Expense') {
                const expenseItem = {
                    name: account.name,
                    code: this.ledger.getAccountCode(account.name),
                    amount: periodBalance,
                    comparativeAmount: comparativeStartDate ? 
                        this.getPeriodActivity(account, comparativeStartDate, comparativeEndDate) : 0
                };
                
                if (this.isOperatingExpense(account)) {
                    incomeStatement.expenses.operating.push(expenseItem);
                } else {
                    incomeStatement.expenses.nonOperating.push(expenseItem);
                }
                incomeStatement.expenses.total += periodBalance;
                incomeStatement.expenses.comparativeTotal += expenseItem.comparativeAmount;
            }
        }

        // Calculate profit metrics
        incomeStatement.calculations.grossProfit = incomeStatement.revenue.total - 
            this.calculateCostOfGoodsSold(startDate, endDate);
        incomeStatement.calculations.operatingProfit = incomeStatement.calculations.grossProfit - 
            incomeStatement.expenses.operating.reduce((sum, exp) => sum + exp.amount, 0);
        incomeStatement.calculations.netProfit = incomeStatement.revenue.total - 
            incomeStatement.expenses.total;
        
        if (comparativeStartDate) {
            incomeStatement.calculations.comparativeNetProfit = 
                incomeStatement.revenue.comparativeTotal - 
                incomeStatement.expenses.comparativeTotal;
        }

        return incomeStatement;
    }

    // Cash Flow Statement
    generateCashFlowStatement(startDate, endDate, method = 'indirect') {
        const cashFlow = {
            period: { start: startDate, end: endDate },
            method: method,
            operating: {
                items: [],
                total: 0
            },
            investing: {
                items: [],
                total: 0
            },
            financing: {
                items: [],
                total: 0
            },
            summary: {
                beginningCash: 0,
                netIncrease: 0,
                endingCash: 0
            }
        };

        if (method === 'indirect') {
            // Start with net income
            const netIncome = this.calculateNetIncome(startDate, endDate);
            cashFlow.operating.items.push({
                description: 'Net Income',
                amount: netIncome
            });

            // Add back non-cash expenses (depreciation, amortization)
            // Adjust for changes in working capital
            const workingCapitalChanges = this.calculateWorkingCapitalChanges(startDate, endDate);
            for (const change of workingCapitalChanges) {
                cashFlow.operating.items.push(change);
            }
        } else {
            // Direct method - show actual cash receipts and payments
            const cashTransactions = this.getCashTransactions(startDate, endDate);
            cashFlow.operating.items = this.categorizeCashTransactions(cashTransactions);
        }

        // Calculate totals
        cashFlow.operating.total = cashFlow.operating.items.reduce((sum, item) => sum + item.amount, 0);
        cashFlow.investing.total = cashFlow.investing.items.reduce((sum, item) => sum + item.amount, 0);
        cashFlow.financing.total = cashFlow.financing.items.reduce((sum, item) => sum + item.amount, 0);

        // Summary
        const cashAccount = this.ledger.getAccount('Cash');
        cashFlow.summary.beginningCash = this.getBalanceAtDate(cashAccount, startDate);
        cashFlow.summary.netIncrease = cashFlow.operating.total + 
            cashFlow.investing.total + cashFlow.financing.total;
        cashFlow.summary.endingCash = this.getBalanceAtDate(cashAccount, endDate);

        return cashFlow;
    }

    // Statement of Changes in Equity
    generateEquityStatement(startDate, endDate) {
        const equityStatement = {
            period: { start: startDate, end: endDate },
            beginningBalance: {},
            changes: [],
            endingBalance: {}
        };

        // Get all equity accounts
        const equityAccounts = this.ledger.getAllAccounts()
            .filter(acc => acc.constructor.name === 'Equity');

        for (const account of equityAccounts) {
            const accountName = account.name;
            
            // Beginning balance
            equityStatement.beginningBalance[accountName] = 
                this.getBalanceAtDate(account, startDate);
            
            // Track changes
            const changes = this.getAccountChanges(account, startDate, endDate);
            equityStatement.changes.push(...changes);
            
            // Ending balance
            equityStatement.endingBalance[accountName] = 
                this.getBalanceAtDate(account, endDate);
        }

        // Add net income for the period
        const netIncome = this.calculateNetIncome(startDate, endDate);
        equityStatement.changes.push({
            description: 'Net Income for the Period',
            amount: netIncome,
            account: 'Retained Earnings'
        });

        return equityStatement;
    }

    // Export Methods
    exportToJSON(report) {
        return JSON.stringify(report, null, 2);
    }

    exportToCSV(report, type) {
        // Convert report to CSV format based on type
        const csvRows = [];
        
        switch(type) {
            case 'balanceSheet':
                csvRows.push(['Balance Sheet', report.reportDate]);
                csvRows.push(['']);
                csvRows.push(['Assets']);
                csvRows.push(['Account', 'Balance']);
                report.assets.current.forEach(item => {
                    csvRows.push([item.name, item.balance]);
                });
                // ... continue for other sections
                break;
            case 'incomeStatement':
                // ... format income statement
                break;
        }
        
        return csvRows.map(row => row.join(',')).join('\n');
    }

    exportToHTML(report, type) {
        // Generate HTML table for the report
        let html = `<html><head><style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
            .section-header { font-weight: bold; background-color: #e0e0e0; }
            .total-row { font-weight: bold; border-top: 2px solid #000; }
        </style></head><body>`;
        
        // Generate specific HTML based on report type
        // ...
        
        html += '</body></html>';
        return html;
    }

    // Helper Methods
    isCurrentAsset(account) {
        const currentAssetKeywords = ['cash', 'receivable', 'inventory', 'prepaid'];
        return currentAssetKeywords.some(keyword => 
            account.name.toLowerCase().includes(keyword)
        );
    }

    isCurrentLiability(account) {
        const currentLiabilityKeywords = ['payable', 'accrued', 'short-term'];
        return currentLiabilityKeywords.some(keyword => 
            account.name.toLowerCase().includes(keyword)
        );
    }

    isOperatingExpense(account) {
        const operatingKeywords = ['salary', 'rent', 'utilities', 'supplies'];
        return operatingKeywords.some(keyword => 
            account.name.toLowerCase().includes(keyword)
        );
    }

    getBalanceAtDate(account, date) {
        // Calculate account balance up to specific date
        const entries = this.ledger.getAccountHistory(account.name, null, date);
        let balance = 0;
        
        for (const entry of entries) {
            if (entry.type === 'debit') {
                balance += account.isDebitPositive ? entry.amount : -entry.amount;
            } else {
                balance += account.isDebitPositive ? -entry.amount : entry.amount;
            }
        }
        
        return balance;
    }

    getPeriodActivity(account, startDate, endDate) {
        const startBalance = this.getBalanceAtDate(account, startDate);
        const endBalance = this.getBalanceAtDate(account, endDate);
        return endBalance - startBalance;
    }

    calculateRetainedEarnings(date) {
        const incomeAccounts = this.ledger.getAllAccounts()
            .filter(acc => acc.constructor.name === 'Income');
        const expenseAccounts = this.ledger.getAllAccounts()
            .filter(acc => acc.constructor.name === 'Expense');
        
        let totalIncome = 0;
        let totalExpenses = 0;
        
        for (const account of incomeAccounts) {
            totalIncome += this.getBalanceAtDate(account, date);
        }
        
        for (const account of expenseAccounts) {
            totalExpenses += this.getBalanceAtDate(account, date);
        }
        
        return totalIncome - totalExpenses;
    }

    calculateNetIncome(startDate, endDate) {
        const incomeStatement = this.generateIncomeStatement(startDate, endDate);
        return incomeStatement.calculations.netProfit;
    }
}
```

## 🔄 Implementation Steps

1. **Create FinancialReports Class**
   - Basic structure with ledger dependency
   - Helper methods for calculations

2. **Implement Balance Sheet**
   - Asset categorization
   - Liability categorization
   - Equity calculation
   - Validation of accounting equation

3. **Implement Income Statement**
   - Revenue aggregation
   - Expense categorization
   - Profit calculations
   - Comparative periods

4. **Implement Cash Flow Statement**
   - Indirect method
   - Direct method
   - Working capital adjustments

5. **Add Export Capabilities**
   - JSON export
   - CSV export
   - HTML export with styling

## 🧪 Testing Requirements

### Unit Tests
```javascript
describe('FinancialReports', () => {
    let ledger, reports;
    
    beforeEach(() => {
        ledger = new GeneralLedger();
        reports = new FinancialReports(ledger);
        
        // Setup test accounts
        ledger.addAccount(new Asset('Cash', 10000), '1010');
        ledger.addAccount(new Asset('Accounts Receivable', 5000), '1020');
        ledger.addAccount(new Liability('Accounts Payable', 3000), '2010');
        ledger.addAccount(new Equity('Common Stock', 10000), '3010');
        ledger.addAccount(new Income('Sales Revenue', 0), '4010');
        ledger.addAccount(new Expense('Rent Expense', 0), '5010');
    });

    it('should generate balanced balance sheet', () => {
        const balanceSheet = reports.generateBalanceSheet();
        expect(balanceSheet.validation.balanced).toBe(true);
        expect(balanceSheet.assets.total).toBe(
            balanceSheet.liabilities.total + balanceSheet.equity.total
        );
    });

    it('should calculate correct net income', () => {
        // Post some transactions
        const sale = new JournalEntry('Sale');
        sale.addEntry(ledger.getAccount('Cash'), 1000, 'debit');
        sale.addEntry(ledger.getAccount('Sales Revenue'), 1000, 'credit');
        ledger.postJournalEntry(sale);

        const rent = new JournalEntry('Pay Rent');
        rent.addEntry(ledger.getAccount('Rent Expense'), 500, 'debit');
        rent.addEntry(ledger.getAccount('Cash'), 500, 'credit');
        ledger.postJournalEntry(rent);

        const incomeStatement = reports.generateIncomeStatement(startDate, endDate);
        expect(incomeStatement.calculations.netProfit).toBe(500);
    });

    it('should export reports to different formats', () => {
        const balanceSheet = reports.generateBalanceSheet();
        
        const json = reports.exportToJSON(balanceSheet);
        expect(JSON.parse(json)).toEqual(balanceSheet);
        
        const csv = reports.exportToCSV(balanceSheet, 'balanceSheet');
        expect(csv).toContain('Balance Sheet');
        
        const html = reports.exportToHTML(balanceSheet, 'balanceSheet');
        expect(html).toContain('<table>');
    });
});
```

## 📦 Dependencies
- [ ] No new runtime dependencies
- [ ] Consider adding export libraries for PDF generation in future

## 📚 Documentation Updates
- [ ] Add financial reports documentation
- [ ] Include examples of each report type
- [ ] Document report customization options
- [ ] Add glossary of financial terms

## ⚠️ Risks & Considerations
- Report accuracy depends on correct account categorization
- Performance with large datasets
- Regulatory compliance for different jurisdictions
- Rounding and precision in calculations

## 🔗 Related Improvements
- Depends on: General Ledger (003)
- Enhanced by: Money Value Object (002)
- Enables: Dashboard Analytics

## 🎯 Example Usage
```javascript
import { GeneralLedger, FinancialReports, Asset, Income, Expense } from 'balancebookjs';

// Setup ledger with accounts
const ledger = new GeneralLedger();
// ... add accounts and transactions

// Initialize reports
const reports = new FinancialReports(ledger);

// Generate Balance Sheet
const balanceSheet = reports.generateBalanceSheet(new Date());
console.log('Total Assets:', balanceSheet.assets.total);
console.log('Total Liabilities:', balanceSheet.liabilities.total);
console.log('Total Equity:', balanceSheet.equity.total);
console.log('Balanced:', balanceSheet.validation.balanced);

// Generate Income Statement for the month
const startDate = new Date('2025-01-01');
const endDate = new Date('2025-01-31');
const incomeStatement = reports.generateIncomeStatement(startDate, endDate);
console.log('Revenue:', incomeStatement.revenue.total);
console.log('Expenses:', incomeStatement.expenses.total);
console.log('Net Profit:', incomeStatement.calculations.netProfit);

// Generate comparative Income Statement
const prevStart = new Date('2024-01-01');
const prevEnd = new Date('2024-01-31');
const comparativeIS = reports.generateIncomeStatement(
    startDate, endDate, prevStart, prevEnd
);

// Export reports
const jsonReport = reports.exportToJSON(balanceSheet);
const csvReport = reports.exportToCSV(incomeStatement, 'incomeStatement');
const htmlReport = reports.exportToHTML(balanceSheet, 'balanceSheet');

// Save or display reports as needed
```

---
*Status: Not Started*  
*Assigned: Unassigned*  
*PR: N/A*
