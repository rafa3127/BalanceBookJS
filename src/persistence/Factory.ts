import { IAdapter } from './interfaces.ts';
import { PersistableMixin } from './PersistableMixin.ts';
import Account from '../classes/accounts/Account.ts';
import Asset from '../classes/accounts/Asset.ts';
import Liability from '../classes/accounts/Liability.ts';
import Equity from '../classes/accounts/Equity.ts';
import Income from '../classes/accounts/Income.ts';
import Expense from '../classes/accounts/Expense.ts';
import JournalEntry from '../classes/transactions/JournalEntry.ts';

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
