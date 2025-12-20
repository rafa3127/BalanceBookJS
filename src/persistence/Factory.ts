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
import type { AccountConfig, AssetConfig, LiabilityConfig, EquityConfig, IncomeConfig, ExpenseConfig } from '../types/config.types.ts';

// Type for account class constructors with config-based API
type AccountClassConstructor = new (config: AccountConfig | AssetConfig | LiabilityConfig | EquityConfig | IncomeConfig | ExpenseConfig) => Account;

// Map of stored type to account class
const accountTypeMap: Record<string, AccountClassConstructor> = {
    'ASSET': Asset as unknown as AccountClassConstructor,
    'LIABILITY': Liability as unknown as AccountClassConstructor,
    'EQUITY': Equity as unknown as AccountClassConstructor,
    'INCOME': Income as unknown as AccountClassConstructor,
    'EXPENSE': Expense as unknown as AccountClassConstructor,
    'ACCOUNT': Account as unknown as AccountClassConstructor,
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
        (classes.Account as unknown as Record<string, unknown>).fromData = function(data: Record<string, unknown>) {
            const storedType = (data.type as string) || 'ACCOUNT';
            const AccountClass = accountTypeMap[storedType] || Account;

            let balance: number | Money = 0;
            if (data.balance) {
                const balanceData = data.balance as Record<string, unknown>;
                if (data.initialMode === 'number') {
                    balance = balanceData.amount as number;
                } else {
                    balance = new Money(
                        balanceData.amount as number,
                        (balanceData.currency as string) || (data.currency as string)
                    );
                }
            }

            const currency = (data.currency as string) || 'CURR';

            // Build config from data, preserving extra fields
            const config: AccountConfig = {
                name: data.name as string,
                balance,
                isDebitPositive: data.isDebitPositive as boolean,
                currency
            };

            // Copy extra fields to config
            const knownDataKeys = ['name', 'balance', 'isDebitPositive', 'currency', 'type', 'initialMode', 'id'];
            for (const [key, value] of Object.entries(data)) {
                if (!knownDataKeys.includes(key)) {
                    config[key] = value;
                }
            }

            // All account types now use config-based constructors
            const account = new AccountClass(config);

            return account;
        };

        // Inject Account model into JournalEntry for hydration
        (classes.JournalEntry as unknown as Record<string, unknown>).AccountModel = classes.Account;

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
