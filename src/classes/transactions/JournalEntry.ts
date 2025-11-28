// JournalEntry.ts

import { IJournalEntry, IJournalEntryLine, IEntryDetail } from '../../types/transaction.types.ts';
import { IAccount } from '../../types/account.types.ts';
import { IMoney } from '../../types/money.types.ts';
import { EntryType, ENTRY_TYPES, ERROR_MESSAGES, VALIDATION } from '../../Constants.ts';

import { ISerializable } from '../../types/serialization.ts';

/**
 * Class representing a journal entry for recording double-entry bookkeeping transactions.
 * @implements {IJournalEntry}
 */
class JournalEntry implements IJournalEntry, ISerializable {
    /**
     * Description of the journal entry
     */
    public readonly description: string;

    /**
     * Date of the journal entry
     */
    public readonly date: Date;

    /**
     * Optional unique identifier for the journal entry
     */
    public readonly id?: string;

    /**
     * Array of individual transaction lines
     */
    private entries: IJournalEntryLine[] = [];

    /**
     * Flag indicating if the journal entry has been committed
     */
    private committed: boolean = false;

    /**
     * Creates a journal entry for recording transactions.
     * @param {string} description - Description of the journal entry.
     * @param {Date} date - Date of the journal entry, defaults to the current date.
     * @param {string} id - Optional unique identifier for the journal entry.
     */
    constructor(description: string, date: Date = new Date(), id?: string) {
        if (!description || description.trim().length === 0) {
            throw new Error('Journal entry description cannot be empty');
        }

        this.description = description;
        this.date = date;
        this.id = id;
    }

    /**
     * Helper method to get numeric amount from number or Money
     */
    private getNumericAmount(amount: number | IMoney): number {
        if (typeof amount === 'number') {
            return amount;
        }
        // It's an IMoney object
        return amount.toNumber();
    }

    /**
     * Adds a transaction entry to the journal.
     * @param {IAccount} account - The account affected by this entry.
     * @param {number | IMoney} amount - The monetary amount of the entry.
     * @param {EntryType} type - The type of the entry, either 'debit' or 'credit'.
     * @throws {Error} If the journal entry has already been committed.
     * @throws {Error} If the account is invalid.
     * @throws {Error} If the amount is negative.
     * @throws {Error} If the entry type is invalid.
     */
    public addEntry(account: IAccount, amount: number | IMoney, type: EntryType): void {
        // Check if already committed
        if (this.committed) {
            throw new Error('Cannot modify a committed journal entry');
        }

        // Validate account
        if (!account || !account.debit || !account.credit || !account.getBalance) {
            throw new Error('Invalid account passed to JournalEntry');
        }

        // Validate amount
        const numericAmount = this.getNumericAmount(amount);
        if (numericAmount < 0) {
            throw new Error(ERROR_MESSAGES.NEGATIVE_AMOUNT);
        }

        // Validate entry type
        if (type !== ENTRY_TYPES.DEBIT && type !== ENTRY_TYPES.CREDIT) {
            throw new Error(ERROR_MESSAGES.INVALID_ENTRY_TYPE);
        }

        this.entries.push({ account, amount, type });
    }

    /**
     * Checks if the journal entry is balanced (debits equal credits).
     * @return {boolean} True if balanced, false otherwise.
     */
    public isBalanced(): boolean {
        const debitTotal = this.getDebitTotal();
        const creditTotal = this.getCreditTotal();

        // Use tolerance for floating point comparison
        return Math.abs(debitTotal - creditTotal) < VALIDATION.BALANCE_TOLERANCE;
    }

    /**
     * Gets the total amount of all debit entries.
     * @return {number} The sum of all debit amounts.
     */
    public getDebitTotal(): number {
        return this.entries
            .filter(e => e.type === ENTRY_TYPES.DEBIT)
            .reduce((sum, e) => sum + this.getNumericAmount(e.amount), 0);
    }

    /**
     * Gets the total amount of all credit entries.
     * @return {number} The sum of all credit amounts.
     */
    public getCreditTotal(): number {
        return this.entries
            .filter(e => e.type === ENTRY_TYPES.CREDIT)
            .reduce((sum, e) => sum + this.getNumericAmount(e.amount), 0);
    }

    /**
     * Commits the journal entry by applying all recorded transactions to their respective accounts.
     * Ensures that the total debits equal the total credits before committing.
     * @throws {Error} If the journal entry has already been committed.
     * @throws {Error} If the journal entry is empty.
     * @throws {Error} If the debits and credits are not balanced.
     */
    public commit(): void {
        // Check if already committed
        if (this.committed) {
            throw new Error('Journal entry has already been committed');
        }

        // Check if entry is empty
        if (this.entries.length === 0) {
            throw new Error(ERROR_MESSAGES.EMPTY_JOURNAL_ENTRY);
        }

        // Check if there's at least one debit and one credit
        const hasDebit = this.entries.some(e => e.type === ENTRY_TYPES.DEBIT);
        const hasCredit = this.entries.some(e => e.type === ENTRY_TYPES.CREDIT);

        if (!hasDebit || !hasCredit) {
            throw new Error(ERROR_MESSAGES.EMPTY_JOURNAL_ENTRY);
        }

        // Check if balanced
        if (!this.isBalanced()) {
            const debitTotal = this.getDebitTotal();
            const creditTotal = this.getCreditTotal();
            throw new Error(
                `${ERROR_MESSAGES.UNBALANCED_ENTRY}. Debits: ${debitTotal}, Credits: ${creditTotal}`
            );
        }

        // Apply all the recorded transactions to their respective accounts
        this.entries.forEach(entry => {
            if (entry.type === ENTRY_TYPES.DEBIT) {
                entry.account.debit(entry.amount);
            } else {
                entry.account.credit(entry.amount);
            }
        });

        // Mark as committed
        this.committed = true;
    }

    /**
     * Returns details of all entries in the journal entry.
     * @return {IEntryDetail[]} An array of entry details including account name, amount, type, date, and description.
     */
    public getDetails(): IEntryDetail[] {
        return this.entries.map(entry => ({
            accountName: entry.account.name,
            amount: this.getNumericAmount(entry.amount),
            type: entry.type,
            date: this.date,
            description: this.description
        }));
    }

    /**
     * Gets the current status of the journal entry.
     * @return {boolean} True if committed, false otherwise.
     */
    public isCommitted(): boolean {
        return this.committed;
    }

    /**
     * Gets the number of entries in the journal entry.
     * @return {number} The count of entries.
     */
    public getEntryCount(): number {
        return this.entries.length;
    }

    /**
     * Gets a copy of the entries array to prevent external modification.
     * @return {IJournalEntryLine[]} A copy of the entries array.
     */
    public getEntries(): IJournalEntryLine[] {
        return [...this.entries];
    }

    /**
     * Serialize the journal entry for persistence
     */
    public serialize(): any {
        return {
            description: this.description,
            date: this.date,
            committed: this.committed,
            entries: this.entries.map(entry => {
                const accountId = (entry.account as any).id;
                if (!accountId) {
                    throw new Error(`Cannot serialize JournalEntry: Referenced Account '${entry.account.name}' must be saved first`);
                }
                return {
                    accountId: accountId,
                    amount: this.getNumericAmount(entry.amount),
                    type: entry.type
                };
            })
        };
    }

    /**
     * Static reference to the Account model for hydration.
     * Injected by the Factory.
     */
    public static AccountModel: any = null;

    /**
     * Create a JournalEntry instance from serialized data
     */
    public static async fromData(data: any): Promise<JournalEntry> {
        const entry = new JournalEntry(
            data.description,
            new Date(data.date)
        );

        // Restore committed state if needed (though usually we shouldn't modify private state directly)
        // Ideally, we replay the commit, but for hydration we might need to bypass checks
        if (data.committed) {
            (entry as any).committed = true;
        }

        if (data.entries && Array.isArray(data.entries)) {
            const AccountModel = (this as any).AccountModel || JournalEntry.AccountModel;
            if (!AccountModel) {
                console.warn('AccountModel not injected into JournalEntry. Cannot hydrate entries.');
                return entry;
            }

            for (const entryData of data.entries) {
                const account = await AccountModel.findById(entryData.accountId);
                if (account) {
                    // We use addEntry which validates everything again
                    // This is safer than direct array manipulation
                    try {
                        // If already committed, we might need to bypass addEntry checks
                        if (entry.isCommitted()) {
                            (entry as any).entries.push({
                                account: account,
                                amount: entryData.amount,
                                type: entryData.type
                            });
                        } else {
                            entry.addEntry(account, entryData.amount, entryData.type);
                        }
                    } catch (e) {
                        console.warn(`Failed to restore entry line: ${e}`);
                    }
                } else {
                    console.warn(`Account not found for ID: ${entryData.accountId}`);
                }
            }
        }

        return entry;
    }
}

export default JournalEntry;
