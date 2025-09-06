# Improvement: General Ledger Implementation

## 🎯 AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature. The General Ledger is a fundamental accounting concept that will serve as the central record-keeping system.

## 📋 Overview
**Priority**: High  
**Category**: Feature  
**Complexity**: Medium  
**Breaking Change**: No (additive feature)

### Brief Description
Implement a General Ledger class that serves as the central repository for all accounts and journal entries. This will provide a single source of truth for the accounting system, enable transaction history tracking, and support the generation of financial reports.

## 🎯 Success Criteria
- [ ] Central registry for all accounts (Chart of Accounts)
- [ ] Record and store all journal entries chronologically
- [ ] Query account history and transactions
- [ ] Generate trial balance
- [ ] Support for account numbering/coding system
- [ ] Filter transactions by date range
- [ ] Search transactions by description or account

## 📐 Technical Design

### Proposed Solution
Create a GeneralLedger class that manages accounts and journal entries, providing methods for registration, posting, and querying.

### New Classes
```javascript
class GeneralLedger {
    constructor() {
        this.accounts = new Map(); // accountId -> Account
        this.journalEntries = [];
        this.accountCodes = new Map(); // code -> accountId
        this.nextEntryId = 1;
    }

    // Account Management
    addAccount(account, code = null) {
        if (this.accounts.has(account.name)) {
            throw new Error(`Account ${account.name} already exists`);
        }
        
        this.accounts.set(account.name, account);
        
        if (code) {
            if (this.accountCodes.has(code)) {
                throw new Error(`Account code ${code} already in use`);
            }
            this.accountCodes.set(code, account.name);
        }
        
        return account;
    }

    getAccount(identifier) {
        // Support lookup by name or code
        if (this.accounts.has(identifier)) {
            return this.accounts.get(identifier);
        }
        
        const accountName = this.accountCodes.get(identifier);
        if (accountName) {
            return this.accounts.get(accountName);
        }
        
        throw new Error(`Account ${identifier} not found`);
    }

    getAllAccounts() {
        return Array.from(this.accounts.values());
    }

    // Journal Entry Management
    postJournalEntry(journalEntry) {
        // Validate all accounts exist
        const details = journalEntry.getDetails();
        for (const detail of details) {
            if (!this.accounts.has(detail.accountName)) {
                throw new Error(`Account ${detail.accountName} not found in ledger`);
            }
        }
        
        // Commit the entry
        journalEntry.commit();
        
        // Store with metadata
        const ledgerEntry = {
            id: this.nextEntryId++,
            entry: journalEntry,
            posted: new Date(),
            details: journalEntry.getDetails()
        };
        
        this.journalEntries.push(ledgerEntry);
        return ledgerEntry.id;
    }

    // Query Methods
    getJournalEntries(options = {}) {
        let entries = [...this.journalEntries];
        
        // Filter by date range
        if (options.startDate) {
            entries = entries.filter(e => e.entry.date >= options.startDate);
        }
        if (options.endDate) {
            entries = entries.filter(e => e.entry.date <= options.endDate);
        }
        
        // Filter by account
        if (options.accountName) {
            entries = entries.filter(e => 
                e.details.some(d => d.accountName === options.accountName)
            );
        }
        
        // Search by description
        if (options.searchTerm) {
            const term = options.searchTerm.toLowerCase();
            entries = entries.filter(e => 
                e.entry.description.toLowerCase().includes(term)
            );
        }
        
        return entries;
    }

    getAccountHistory(accountName, startDate = null, endDate = null) {
        const entries = this.getJournalEntries({
            accountName,
            startDate,
            endDate
        });
        
        return entries.map(e => {
            const detail = e.details.find(d => d.accountName === accountName);
            return {
                date: e.entry.date,
                description: e.entry.description,
                type: detail.type,
                amount: detail.amount,
                journalEntryId: e.id
            };
        });
    }

    // Reporting Methods
    generateTrialBalance(date = new Date()) {
        const trialBalance = {
            date,
            accounts: [],
            totalDebits: 0,
            totalCredits: 0
        };
        
        for (const [name, account] of this.accounts) {
            const balance = account.getBalance();
            const entry = {
                accountName: name,
                balance: Math.abs(balance),
                type: account.constructor.name,
                debit: 0,
                credit: 0
            };
            
            // Determine if balance is debit or credit
            if (account.isDebitPositive) {
                if (balance >= 0) {
                    entry.debit = balance;
                    trialBalance.totalDebits += balance;
                } else {
                    entry.credit = Math.abs(balance);
                    trialBalance.totalCredits += Math.abs(balance);
                }
            } else {
                if (balance >= 0) {
                    entry.credit = balance;
                    trialBalance.totalCredits += balance;
                } else {
                    entry.debit = Math.abs(balance);
                    trialBalance.totalDebits += Math.abs(balance);
                }
            }
            
            trialBalance.accounts.push(entry);
        }
        
        trialBalance.isBalanced = 
            Math.abs(trialBalance.totalDebits - trialBalance.totalCredits) < 0.01;
        
        return trialBalance;
    }

    // Chart of Accounts
    getChartOfAccounts() {
        const chart = {
            assets: [],
            liabilities: [],
            equity: [],
            income: [],
            expenses: []
        };
        
        for (const [name, account] of this.accounts) {
            const code = this.getAccountCode(name);
            const accountInfo = {
                name,
                code,
                type: account.constructor.name,
                balance: account.getBalance()
            };
            
            switch (account.constructor.name) {
                case 'Asset':
                    chart.assets.push(accountInfo);
                    break;
                case 'Liability':
                    chart.liabilities.push(accountInfo);
                    break;
                case 'Equity':
                    chart.equity.push(accountInfo);
                    break;
                case 'Income':
                    chart.income.push(accountInfo);
                    break;
                case 'Expense':
                    chart.expenses.push(accountInfo);
                    break;
            }
        }
        
        return chart;
    }

    getAccountCode(accountName) {
        for (const [code, name] of this.accountCodes) {
            if (name === accountName) return code;
        }
        return null;
    }

    // Utility Methods
    closeBooks(closingDate = new Date()) {
        // Reset temporary accounts (income and expenses)
        const retainedEarnings = this.getAccount('Retained Earnings');
        let netIncome = 0;
        
        for (const [name, account] of this.accounts) {
            if (account.constructor.name === 'Income' || 
                account.constructor.name === 'Expense') {
                const balance = account.getBalance();
                netIncome += account.constructor.name === 'Income' ? balance : -balance;
                
                // Create closing entry
                const closingEntry = new JournalEntry(
                    `Closing ${name}`, 
                    closingDate
                );
                
                if (balance !== 0) {
                    if (account.constructor.name === 'Income') {
                        closingEntry.addEntry(account, balance, 'debit');
                    } else {
                        closingEntry.addEntry(account, balance, 'credit');
                    }
                }
                
                // Reset account balance to zero
                account.balance = 0;
            }
        }
        
        // Transfer net income to retained earnings
        if (netIncome !== 0) {
            const incomeEntry = new JournalEntry(
                'Transfer Net Income to Retained Earnings',
                closingDate
            );
            
            if (netIncome > 0) {
                retainedEarnings.credit(netIncome);
            } else {
                retainedEarnings.debit(Math.abs(netIncome));
            }
        }
        
        return {
            closingDate,
            netIncome,
            accountsClosed: this.accounts.size
        };
    }
}
```

### Integration Example
```javascript
// Create ledger
const ledger = new GeneralLedger();

// Add accounts with codes
ledger.addAccount(new Asset('Cash', 1000), '1010');
ledger.addAccount(new Asset('Accounts Receivable', 0), '1020');
ledger.addAccount(new Liability('Accounts Payable', 0), '2010');
ledger.addAccount(new Income('Sales Revenue', 0), '4010');
ledger.addAccount(new Expense('Rent Expense', 0), '5010');

// Create and post journal entry
const entry = new JournalEntry('Monthly Rent Payment');
entry.addEntry(ledger.getAccount('5010'), 1500, 'debit'); // Rent Expense
entry.addEntry(ledger.getAccount('1010'), 1500, 'credit'); // Cash

const entryId = ledger.postJournalEntry(entry);
```

## 🔄 Implementation Steps

1. **Create GeneralLedger Class**
   - Basic structure with account and entry storage
   - Account registration methods
   - Journal entry posting

2. **Add Query Capabilities**
   - Filter by date range
   - Filter by account
   - Search by description

3. **Implement Trial Balance**
   - Calculate debit/credit totals
   - Check if balanced
   - Format for display

4. **Add Chart of Accounts**
   - Account categorization
   - Code assignment
   - Hierarchical structure support

5. **Implement Book Closing**
   - Reset temporary accounts
   - Transfer to retained earnings
   - Generate closing entries

## 🧪 Testing Requirements

### Unit Tests
```javascript
describe('GeneralLedger', () => {
    it('should register accounts with unique names', () => {
        const ledger = new GeneralLedger();
        const cash = new Asset('Cash', 1000);
        ledger.addAccount(cash, '1010');
        
        expect(ledger.getAccount('Cash')).toBe(cash);
        expect(ledger.getAccount('1010')).toBe(cash);
    });

    it('should post journal entries and update balances', () => {
        const ledger = new GeneralLedger();
        const cash = new Asset('Cash', 1000);
        const revenue = new Income('Revenue', 0);
        
        ledger.addAccount(cash);
        ledger.addAccount(revenue);
        
        const entry = new JournalEntry('Sale');
        entry.addEntry(cash, 500, 'debit');
        entry.addEntry(revenue, 500, 'credit');
        
        ledger.postJournalEntry(entry);
        
        expect(cash.getBalance()).toBe(1500);
        expect(revenue.getBalance()).toBe(500);
    });

    it('should generate balanced trial balance', () => {
        const ledger = new GeneralLedger();
        // ... setup accounts and entries
        
        const trialBalance = ledger.generateTrialBalance();
        expect(trialBalance.isBalanced).toBe(true);
    });
});
```

## 📦 Dependencies
- [ ] No new dependencies required

## 📚 Documentation Updates
- [ ] Add GeneralLedger documentation
- [ ] Document Chart of Accounts structure
- [ ] Add examples for common workflows
- [ ] Document closing process

## ⚠️ Risks & Considerations
- Memory usage with large number of entries
- Need for persistence layer in future
- Performance of filtering operations
- Concurrent access considerations

## 🔗 Related Improvements
- Enables: Financial Reports (004)
- Enables: Audit Trail
- Benefits from: TypeScript Migration (001)

## 🎯 Example Usage
```javascript
import { GeneralLedger, Asset, Expense, JournalEntry } from 'balancebookjs';

// Initialize ledger with chart of accounts
const ledger = new GeneralLedger();

// Set up accounts with codes
ledger.addAccount(new Asset('Cash', 10000), '1010');
ledger.addAccount(new Asset('Inventory', 5000), '1030');
ledger.addAccount(new Expense('Cost of Goods Sold', 0), '5010');

// Record a sale
const saleEntry = new JournalEntry('Sold inventory');
saleEntry.addEntry(ledger.getAccount('1010'), 3000, 'debit'); // Cash
saleEntry.addEntry(ledger.getAccount('1030'), 2000, 'credit'); // Inventory
saleEntry.addEntry(ledger.getAccount('5010'), 2000, 'debit'); // COGS

ledger.postJournalEntry(saleEntry);

// Query account history
const cashHistory = ledger.getAccountHistory('Cash', startDate, endDate);

// Generate trial balance
const trialBalance = ledger.generateTrialBalance();
console.log('Total Debits:', trialBalance.totalDebits);
console.log('Total Credits:', trialBalance.totalCredits);
console.log('Balanced:', trialBalance.isBalanced);

// View chart of accounts
const chart = ledger.getChartOfAccounts();
console.log('Assets:', chart.assets);
```

---
*Status: Not Started*  
*Assigned: Unassigned*  
*PR: N/A*
