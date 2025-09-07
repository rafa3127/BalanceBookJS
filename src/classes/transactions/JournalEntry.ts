// JournalEntry.ts

import { IJournalEntry, IJournalEntryLine, IEntryDetail } from '../../types/transaction.types';
import { IAccount } from '../../types/account.types';
import { EntryType, ENTRY_TYPES, ERROR_MESSAGES, VALIDATION } from '../../Constants';

/**
 * Class representing a journal entry for recording double-entry bookkeeping transactions.
 * @implements {IJournalEntry}
 */
class JournalEntry implements IJournalEntry {
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
     * Adds a transaction entry to the journal.
     * @param {IAccount} account - The account affected by this entry.
     * @param {number} amount - The monetary amount of the entry.
     * @param {EntryType} type - The type of the entry, either 'debit' or 'credit'.
     * @throws {Error} If the journal entry has already been committed.
     * @throws {Error} If the account is invalid.
     * @throws {Error} If the amount is negative.
     * @throws {Error} If the entry type is invalid.
     */
    public addEntry(account: IAccount, amount: number, type: EntryType): void {
        // Check if already committed
        if (this.committed) {
            throw new Error('Cannot modify a committed journal entry');
        }

        // Validate account
        if (!account || !account.debit || !account.credit || !account.getBalance) {
            throw new Error('Invalid account passed to JournalEntry');
        }

        // Validate amount
        if (amount < 0) {
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
            .reduce((sum, e) => sum + e.amount, 0);
    }

    /**
     * Gets the total amount of all credit entries.
     * @return {number} The sum of all credit amounts.
     */
    public getCreditTotal(): number {
        return this.entries
            .filter(e => e.type === ENTRY_TYPES.CREDIT)
            .reduce((sum, e) => sum + e.amount, 0);
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
            amount: entry.amount,
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
}

export default JournalEntry;
