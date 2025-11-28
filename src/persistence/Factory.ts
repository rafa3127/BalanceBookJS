import { IAdapter } from './interfaces.ts';
import { PersistableMixin } from './PersistableMixin.ts';
import Account from '../classes/accounts/Account.ts';
import Asset from '../classes/accounts/Asset.ts';
import Liability from '../classes/accounts/Liability.ts';
import Equity from '../classes/accounts/Equity.ts';
import Income from '../classes/accounts/Income.ts';
import Expense from '../classes/accounts/Expense.ts';
import JournalEntry from '../classes/transactions/JournalEntry.ts';
import { Money } from '../classes/value-objects/Money.ts';

// Map of stored type to account class
// Using 'any' for constructor type since subclasses have different signatures
const accountTypeMap: Record<string, new (name: string, initialBalance?: number | Money, defaultCurrency?: string) => Account> = {
    'ASSET': Asset,
    'LIABILITY': Liability,
    'EQUITY': Equity,
    'INCOME': Income,
    'EXPENSE': Expense,
    'ACCOUNT': Account as any,
};

/**
 * Factory to create persistable classes bound to a specific adapter
 */
export class Factory {
    private adapter: IAdapter;

    constructor(adapter: IAdapter) {
        this.adapter = adapter;
    }

    /**
     * Create persistable versions of all core classes
     */
    createClasses() {
        const classes = {
            Account: this.createPersistable(Account, 'accounts'),
            Asset: this.createPersistable(Asset, 'accounts'),
            Liability: this.createPersistable(Liability, 'accounts'),
            Equity: this.createPersistable(Equity, 'accounts'),
            Income: this.createPersistable(Income, 'accounts'),
            Expense: this.createPersistable(Expense, 'accounts'),
            JournalEntry: this.createPersistable(JournalEntry, 'journal_entries'),
        };

        // Override Account.fromData to return the correct subclass based on stored type
        (classes.Account as any).fromData = function(data: any) {
            const storedType = data.type || 'ACCOUNT';
            const AccountClass = accountTypeMap[storedType] || Account;

            let initialBalance: number | Money = 0;
            if (data.balance) {
                if (data.initialMode === 'number') {
                    initialBalance = data.balance.amount;
                } else {
                    initialBalance = new Money(
                        data.balance.amount,
                        data.balance.currency || data.currency
                    );
                }
            }

            const currency = data.currency || 'CURR';

            // Account base class has different constructor signature than subclasses
            // Account: (name, balance, isDebitPositive, currency)
            // Subclasses: (name, balance, currency)
            let account;
            if (storedType === 'ACCOUNT') {
                account = new (AccountClass as any)(
                    data.name,
                    initialBalance,
                    data.isDebitPositive,
                    currency
                );
            } else {
                account = new (AccountClass as any)(
                    data.name,
                    initialBalance,
                    currency
                );
            }

            return account;
        };

        // Inject Account model into JournalEntry for hydration
        classes.JournalEntry.AccountModel = classes.Account;

        return classes;
    }

    /**
     * Helper to create a single persistable class
     * @param Base The base class
     * @param collectionName The collection name
     */
    createPersistable<T extends new (...args: any[]) => any>(Base: T, collectionName: string) {
        return PersistableMixin(Base, this.adapter, collectionName);
    }
}
