# Improvement: Validation and Business Rules System

## 🎯 AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature. This improvement adds a robust validation layer to ensure data integrity and business rule compliance.

## 📋 Overview
**Priority**: High  
**Category**: Feature  
**Complexity**: Medium  
**Breaking Change**: No (additive, with opt-in validation)

### Brief Description
Implement a comprehensive validation and business rules system that ensures data integrity, enforces accounting principles, and allows for custom business rules. This system will validate transactions before they're committed and provide clear error messages.

## 🎯 Success Criteria
- [ ] Pre-transaction validation
- [ ] Account balance limits and restrictions
- [ ] Custom validation rules
- [ ] Validation error aggregation and reporting
- [ ] Warning vs Error severity levels
- [ ] Configurable validation policies
- [ ] Audit trail for validation overrides

## 📐 Technical Design

### Proposed Solution
Create a flexible validation framework using the Chain of Responsibility pattern, allowing validators to be composed and configured per organization's needs.

### New Classes
```javascript
// Base Validator Class
class Validator {
    constructor(next = null) {
        this.next = next;
        this.enabled = true;
        this.severity = 'ERROR'; // ERROR, WARNING, INFO
    }

    setNext(validator) {
        this.next = validator;
        return validator;
    }

    validate(context) {
        const results = this.doValidate(context);
        
        if (this.next) {
            const nextResults = this.next.validate(context);
            return [...results, ...nextResults];
        }
        
        return results;
    }

    doValidate(context) {
        // To be implemented by subclasses
        throw new Error('doValidate must be implemented');
    }

    createResult(passed, message, details = {}) {
        return {
            validator: this.constructor.name,
            passed,
            severity: passed ? 'INFO' : this.severity,
            message,
            details,
            timestamp: new Date()
        };
    }
}

// Validation Result Aggregator
class ValidationResult {
    constructor() {
        this.results = [];
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    addResult(result) {
        this.results.push(result);
        
        if (!result.passed) {
            switch (result.severity) {
                case 'ERROR':
                    this.errors.push(result);
                    break;
                case 'WARNING':
                    this.warnings.push(result);
                    break;
                case 'INFO':
                    this.info.push(result);
                    break;
            }
        }
    }

    addResults(results) {
        results.forEach(result => this.addResult(result));
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    hasWarnings() {
        return this.warnings.length > 0;
    }

    isValid() {
        return !this.hasErrors();
    }

    getErrorMessages() {
        return this.errors.map(e => e.message);
    }

    getWarningMessages() {
        return this.warnings.map(w => w.message);
    }

    getSummary() {
        return {
            valid: this.isValid(),
            errorCount: this.errors.length,
            warningCount: this.warnings.length,
            infoCount: this.info.length,
            errors: this.getErrorMessages(),
            warnings: this.getWarningMessages()
        };
    }
}

// Specific Validators

class BalanceValidator extends Validator {
    doValidate(context) {
        const results = [];
        const { entry } = context;
        
        // Calculate total debits and credits
        let totalDebits = 0;
        let totalCredits = 0;
        
        entry.entries.forEach(e => {
            if (e.type === 'debit') {
                totalDebits += e.amount;
            } else {
                totalCredits += e.amount;
            }
        });
        
        const difference = Math.abs(totalDebits - totalCredits);
        const balanced = difference < 0.01;
        
        results.push(this.createResult(
            balanced,
            balanced 
                ? 'Journal entry is balanced'
                : `Journal entry is not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`,
            { totalDebits, totalCredits, difference }
        ));
        
        return results;
    }
}

class MinimumBalanceValidator extends Validator {
    constructor(minimumBalances = new Map(), next = null) {
        super(next);
        this.minimumBalances = minimumBalances;
    }

    setMinimumBalance(accountName, minimum) {
        this.minimumBalances.set(accountName, minimum);
    }

    doValidate(context) {
        const results = [];
        const { entry, ledger } = context;
        
        // Check each account in the entry
        for (const e of entry.entries) {
            const account = e.account;
            const minimum = this.minimumBalances.get(account.name);
            
            if (minimum !== undefined) {
                // Calculate what the balance would be after this transaction
                const currentBalance = account.getBalance();
                let projectedBalance = currentBalance;
                
                if (e.type === 'debit') {
                    projectedBalance += account.isDebitPositive ? e.amount : -e.amount;
                } else {
                    projectedBalance += account.isDebitPositive ? -e.amount : e.amount;
                }
                
                const valid = projectedBalance >= minimum;
                
                if (!valid) {
                    results.push(this.createResult(
                        false,
                        `Account ${account.name} would fall below minimum balance of ${minimum}. Projected balance: ${projectedBalance}`,
                        { 
                            account: account.name,
                            currentBalance,
                            projectedBalance,
                            minimum
                        }
                    ));
                }
            }
        }
        
        return results;
    }
}

class CreditLimitValidator extends Validator {
    constructor(creditLimits = new Map(), next = null) {
        super(next);
        this.creditLimits = creditLimits;
    }

    setCreditLimit(accountName, limit) {
        this.creditLimits.set(accountName, limit);
    }

    doValidate(context) {
        const results = [];
        const { entry } = context;
        
        for (const e of entry.entries) {
            const account = e.account;
            const limit = this.creditLimits.get(account.name);
            
            if (limit !== undefined && account.constructor.name === 'Liability') {
                const currentBalance = account.getBalance();
                let projectedBalance = currentBalance;
                
                if (e.type === 'credit') {
                    projectedBalance += e.amount;
                }
                
                const valid = projectedBalance <= limit;
                
                if (!valid) {
                    results.push(this.createResult(
                        false,
                        `Account ${account.name} would exceed credit limit of ${limit}. Projected balance: ${projectedBalance}`,
                        {
                            account: account.name,
                            currentBalance,
                            projectedBalance,
                            limit
                        }
                    ));
                }
            }
        }
        
        return results;
    }
}

class DateValidator extends Validator {
    constructor(options = {}, next = null) {
        super(next);
        this.allowFutureDates = options.allowFutureDates || false;
        this.allowBackdating = options.allowBackdating || true;
        this.maxBackdatingDays = options.maxBackdatingDays || 90;
    }

    doValidate(context) {
        const results = [];
        const { entry } = context;
        const today = new Date();
        const entryDate = entry.date;
        
        // Check future dates
        if (!this.allowFutureDates && entryDate > today) {
            results.push(this.createResult(
                false,
                `Future dates are not allowed. Entry date: ${entryDate.toISOString()}`,
                { entryDate, today }
            ));
        }
        
        // Check backdating
        if (!this.allowBackdating && entryDate < today) {
            results.push(this.createResult(
                false,
                `Backdating is not allowed. Entry date: ${entryDate.toISOString()}`,
                { entryDate, today }
            ));
        } else if (this.maxBackdatingDays > 0) {
            const maxBackdate = new Date(today);
            maxBackdate.setDate(maxBackdate.getDate() - this.maxBackdatingDays);
            
            if (entryDate < maxBackdate) {
                results.push(this.createResult(
                    false,
                    `Entry date exceeds maximum backdating limit of ${this.maxBackdatingDays} days`,
                    { 
                        entryDate,
                        maxBackdate,
                        daysBack: Math.floor((today - entryDate) / (1000 * 60 * 60 * 24))
                    }
                ));
            }
        }
        
        return results;
    }
}

class AmountValidator extends Validator {
    constructor(options = {}, next = null) {
        super(next);
        this.maxTransactionAmount = options.maxTransactionAmount || Infinity;
        this.minTransactionAmount = options.minTransactionAmount || 0.01;
        this.requireApprovalThreshold = options.requireApprovalThreshold || Infinity;
    }

    doValidate(context) {
        const results = [];
        const { entry } = context;
        
        for (const e of entry.entries) {
            // Check minimum amount
            if (e.amount < this.minTransactionAmount) {
                results.push(this.createResult(
                    false,
                    `Transaction amount ${e.amount} is below minimum of ${this.minTransactionAmount}`,
                    { amount: e.amount, minimum: this.minTransactionAmount }
                ));
            }
            
            // Check maximum amount
            if (e.amount > this.maxTransactionAmount) {
                results.push(this.createResult(
                    false,
                    `Transaction amount ${e.amount} exceeds maximum of ${this.maxTransactionAmount}`,
                    { amount: e.amount, maximum: this.maxTransactionAmount }
                ));
            }
            
            // Check approval threshold
            if (e.amount > this.requireApprovalThreshold) {
                this.severity = 'WARNING';
                results.push(this.createResult(
                    false,
                    `Transaction amount ${e.amount} requires approval (threshold: ${this.requireApprovalThreshold})`,
                    { amount: e.amount, threshold: this.requireApprovalThreshold }
                ));
            }
        }
        
        return results;
    }
}

class AccountTypeValidator extends Validator {
    constructor(rules = [], next = null) {
        super(next);
        this.rules = rules; // Array of { fromType, toType, allowed }
    }

    addRule(fromType, toType, allowed = true) {
        this.rules.push({ fromType, toType, allowed });
    }

    doValidate(context) {
        const results = [];
        const { entry } = context;
        
        // Get all debit and credit accounts
        const debitAccounts = entry.entries
            .filter(e => e.type === 'debit')
            .map(e => e.account);
        const creditAccounts = entry.entries
            .filter(e => e.type === 'credit')
            .map(e => e.account);
        
        // Check each combination
        for (const debitAccount of debitAccounts) {
            for (const creditAccount of creditAccounts) {
                const rule = this.rules.find(r =>
                    r.fromType === creditAccount.constructor.name &&
                    r.toType === debitAccount.constructor.name
                );
                
                if (rule && !rule.allowed) {
                    results.push(this.createResult(
                        false,
                        `Transaction from ${creditAccount.constructor.name} to ${debitAccount.constructor.name} is not allowed`,
                        {
                            from: creditAccount.name,
                            to: debitAccount.name,
                            fromType: creditAccount.constructor.name,
                            toType: debitAccount.constructor.name
                        }
                    ));
                }
            }
        }
        
        return results;
    }
}

class CustomRuleValidator extends Validator {
    constructor(rules = [], next = null) {
        super(next);
        this.rules = rules; // Array of functions that return validation results
    }

    addRule(name, validationFunction, severity = 'ERROR') {
        this.rules.push({ name, validate: validationFunction, severity });
    }

    doValidate(context) {
        const results = [];
        
        for (const rule of this.rules) {
            try {
                const ruleResult = rule.validate(context);
                if (ruleResult !== true) {
                    this.severity = rule.severity;
                    results.push(this.createResult(
                        false,
                        ruleResult.message || `Custom rule '${rule.name}' failed`,
                        ruleResult.details || {}
                    ));
                }
            } catch (error) {
                results.push(this.createResult(
                    false,
                    `Error executing custom rule '${rule.name}': ${error.message}`,
                    { error: error.message }
                ));
            }
        }
        
        return results;
    }
}

// Validation Manager
class ValidationManager {
    constructor(generalLedger) {
        this.ledger = generalLedger;
        this.validatorChain = null;
        this.policies = new Map();
        this.overrideLog = [];
        
        this.setupDefaultValidators();
    }

    setupDefaultValidators() {
        // Create default validation chain
        const balanceValidator = new BalanceValidator();
        const dateValidator = new DateValidator();
        const amountValidator = new AmountValidator();
        const minimumBalanceValidator = new MinimumBalanceValidator();
        const creditLimitValidator = new CreditLimitValidator();
        const accountTypeValidator = new AccountTypeValidator();
        const customRuleValidator = new CustomRuleValidator();
        
        // Chain them together
        balanceValidator
            .setNext(dateValidator)
            .setNext(amountValidator)
            .setNext(minimumBalanceValidator)
            .setNext(creditLimitValidator)
            .setNext(accountTypeValidator)
            .setNext(customRuleValidator);
        
        this.validatorChain = balanceValidator;
    }

    validateJournalEntry(entry, options = {}) {
        const context = {
            entry,
            ledger: this.ledger,
            options
        };
        
        const validationResult = new ValidationResult();
        
        if (this.validatorChain) {
            const results = this.validatorChain.validate(context);
            validationResult.addResults(results);
        }
        
        // Apply policies
        this.applyPolicies(validationResult, context);
        
        // Handle overrides if provided
        if (options.override && options.overrideReason) {
            this.logOverride(validationResult, options);
            validationResult.overridden = true;
        }
        
        return validationResult;
    }

    applyPolicies(validationResult, context) {
        for (const [policyName, policy] of this.policies) {
            if (policy.isApplicable(context)) {
                const policyResults = policy.validate(context);
                validationResult.addResults(policyResults);
            }
        }
    }

    logOverride(validationResult, options) {
        this.overrideLog.push({
            timestamp: new Date(),
            validationResult: validationResult.getSummary(),
            overrideReason: options.overrideReason,
            overriddenBy: options.overriddenBy || 'Unknown',
            entry: options.entry
        });
    }

    addPolicy(name, policy) {
        this.policies.set(name, policy);
    }

    removePolicy(name) {
        this.policies.delete(name);
    }

    getOverrideLog(startDate = null, endDate = null) {
        if (!startDate && !endDate) {
            return this.overrideLog;
        }
        
        return this.overrideLog.filter(log => {
            const logDate = log.timestamp;
            return (!startDate || logDate >= startDate) &&
                   (!endDate || logDate <= endDate);
        });
    }

    // Configuration methods
    setMinimumBalance(accountName, minimum) {
        const validator = this.findValidator('MinimumBalanceValidator');
        if (validator) {
            validator.setMinimumBalance(accountName, minimum);
        }
    }

    setCreditLimit(accountName, limit) {
        const validator = this.findValidator('CreditLimitValidator');
        if (validator) {
            validator.setCreditLimit(accountName, limit);
        }
    }

    addCustomRule(name, validationFunction, severity = 'ERROR') {
        const validator = this.findValidator('CustomRuleValidator');
        if (validator) {
            validator.addRule(name, validationFunction, severity);
        }
    }

    findValidator(className) {
        let current = this.validatorChain;
        while (current) {
            if (current.constructor.name === className) {
                return current;
            }
            current = current.next;
        }
        return null;
    }
}

// Validation Policy Example
class MonthEndPolicy {
    constructor() {
        this.name = 'MonthEndPolicy';
    }

    isApplicable(context) {
        const date = context.entry.date;
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return date.getDate() === lastDayOfMonth.getDate();
    }

    validate(context) {
        const results = [];
        
        // Month-end specific validations
        // Example: Ensure all accruals are recorded
        const hasAccrual = context.entry.description.toLowerCase().includes('accrual');
        
        if (!hasAccrual) {
            results.push({
                validator: this.name,
                passed: false,
                severity: 'WARNING',
                message: 'Month-end entry should include accrual adjustments',
                details: { date: context.entry.date },
                timestamp: new Date()
            });
        }
        
        return results;
    }
}
```

## 🔄 Implementation Steps

1. **Create Base Validator Framework**
   - Validator base class
   - ValidationResult aggregator
   - Chain of Responsibility setup

2. **Implement Core Validators**
   - Balance validator
   - Date validator
   - Amount validator
   - Account type validator

3. **Add Business Rule Validators**
   - Minimum balance
   - Credit limits
   - Custom rules

4. **Build Validation Manager**
   - Validator chain configuration
   - Policy system
   - Override logging

5. **Integrate with Journal Entry**
   - Pre-commit validation
   - Error handling
   - Override mechanism

## 🧪 Testing Requirements

### Unit Tests
```javascript
describe('ValidationSystem', () => {
    let ledger, validationManager;
    
    beforeEach(() => {
        ledger = new GeneralLedger();
        validationManager = new ValidationManager(ledger);
        
        // Setup test accounts
        ledger.addAccount(new Asset('Cash', 1000));
        ledger.addAccount(new Expense('Office Supplies', 0));
        ledger.addAccount(new Liability('Credit Card', 500));
    });

    it('should validate balanced journal entries', () => {
        const entry = new JournalEntry('Test Entry');
        entry.addEntry(ledger.getAccount('Cash'), 100, 'credit');
        entry.addEntry(ledger.getAccount('Office Supplies'), 100, 'debit');
        
        const result = validationManager.validateJournalEntry(entry);
        
        expect(result.isValid()).toBe(true);
        expect(result.hasErrors()).toBe(false);
    });

    it('should reject unbalanced entries', () => {
        const entry = new JournalEntry('Unbalanced Entry');
        entry.addEntry(ledger.getAccount('Cash'), 100, 'credit');
        entry.addEntry(ledger.getAccount('Office Supplies'), 150, 'debit');
        
        const result = validationManager.validateJournalEntry(entry);
        
        expect(result.isValid()).toBe(false);
        expect(result.getErrorMessages()).toContain(
            expect.stringContaining('not balanced')
        );
    });

    it('should enforce minimum balance rules', () => {
        validationManager.setMinimumBalance('Cash', 500);
        
        const entry = new JournalEntry('Large Withdrawal');
        entry.addEntry(ledger.getAccount('Cash'), 600, 'credit');
        entry.addEntry(ledger.getAccount('Office Supplies'), 600, 'debit');
        
        const result = validationManager.validateJournalEntry(entry);
        
        expect(result.isValid()).toBe(false);
        expect(result.getErrorMessages()).toContain(
            expect.stringContaining('below minimum balance')
        );
    });

    it('should enforce credit limits', () => {
        validationManager.setCreditLimit('Credit Card', 1000);
        
        const entry = new JournalEntry('Credit Purchase');
        entry.addEntry(ledger.getAccount('Office Supplies'), 600, 'debit');
        entry.addEntry(ledger.getAccount('Credit Card'), 600, 'credit');
        
        const result = validationManager.validateJournalEntry(entry);
        
        expect(result.isValid()).toBe(false);
        expect(result.getErrorMessages()).toContain(
            expect.stringContaining('exceed credit limit')
        );
    });

    it('should allow validation overrides with logging', () => {
        const entry = new JournalEntry('Unbalanced Entry');
        entry.addEntry(ledger.getAccount('Cash'), 100, 'credit');
        entry.addEntry(ledger.getAccount('Office Supplies'), 150, 'debit');
        
        const result = validationManager.validateJournalEntry(entry, {
            override: true,
            overrideReason: 'Approved by CFO',
            overriddenBy: 'John Doe'
        });
        
        expect(result.overridden).toBe(true);
        
        const overrideLog = validationManager.getOverrideLog();
        expect(overrideLog.length).toBe(1);
        expect(overrideLog[0].overrideReason).toBe('Approved by CFO');
    });

    it('should execute custom validation rules', () => {
        validationManager.addCustomRule(
            'NoWeekendTransactions',
            (context) => {
                const dayOfWeek = context.entry.date.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    return {
                        message: 'Transactions on weekends require approval',
                        details: { date: context.entry.date }
                    };
                }
                return true;
            },
            'WARNING'
        );
        
        const entry = new JournalEntry('Weekend Entry', new Date('2025-01-18')); // Saturday
        entry.addEntry(ledger.getAccount('Cash'), 100, 'credit');
        entry.addEntry(ledger.getAccount('Office Supplies'), 100, 'debit');
        
        const result = validationManager.validateJournalEntry(entry);
        
        expect(result.hasWarnings()).toBe(true);
        expect(result.getWarningMessages()).toContain(
            expect.stringContaining('weekends require approval')
        );
    });
});
```

## 📦 Dependencies
- [ ] No new runtime dependencies

## 📚 Documentation Updates
- [ ] Add validation rules documentation
- [ ] Document override procedures
- [ ] Create validation configuration guide
- [ ] Add custom rule examples

## ⚠️ Risks & Considerations
- Performance impact with many validators
- Complexity of custom rules
- Override audit requirements
- Balance between strictness and usability

## 🔗 Related Improvements
- Enhances: General Ledger (003)
- Related to: Audit Trail
- Complements: Accounting Periods (006)

## 🎯 Example Usage
```javascript
import { GeneralLedger, ValidationManager, JournalEntry } from 'balancebookjs';

// Setup
const ledger = new GeneralLedger();
const validator = new ValidationManager(ledger);

// Configure validation rules
validator.setMinimumBalance('Checking Account', 1000);
validator.setCreditLimit('Company Credit Card', 10000);

// Add custom business rule
validator.addCustomRule(
    'RequireMemoForLargeTransactions',
    (context) => {
        const hasLargeAmount = context.entry.entries.some(e => e.amount > 5000);
        const hasDescription = context.entry.description && 
                             context.entry.description.length > 20;
        
        if (hasLargeAmount && !hasDescription) {
            return {
                message: 'Transactions over $5000 require detailed description',
                details: { description: context.entry.description }
            };
        }
        return true;
    },
    'ERROR'
);

// Create and validate entry
const entry = new JournalEntry('Equipment Purchase');
entry.addEntry(ledger.getAccount('Equipment'), 8000, 'debit');
entry.addEntry(ledger.getAccount('Cash'), 8000, 'credit');

const validationResult = validator.validateJournalEntry(entry);

if (!validationResult.isValid()) {
    console.log('Validation failed:');
    validationResult.getErrorMessages().forEach(msg => console.log(`  - ${msg}`));
    
    // Handle warnings
    if (validationResult.hasWarnings()) {
        console.log('Warnings:');
        validationResult.getWarningMessages().forEach(msg => console.log(`  - ${msg}`));
    }
    
    // Option to override with authorization
    const overrideResult = validator.validateJournalEntry(entry, {
        override: true,
        overrideReason: 'Emergency purchase approved by CEO',
        overriddenBy: 'Jane Smith, CFO'
    });
    
    if (overrideResult.overridden) {
        ledger.postJournalEntry(entry);
        console.log('Entry posted with override');
    }
} else {
    ledger.postJournalEntry(entry);
    console.log('Entry posted successfully');
}

// View override log
const overrides = validator.getOverrideLog();
console.log('Override History:', overrides);

// Add policy for month-end
validator.addPolicy('month-end', new MonthEndPolicy());
```

---
*Status: Not Started*  
*Assigned: Unassigned*  
*PR: N/A*
