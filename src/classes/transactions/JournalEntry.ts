// JournalEntry.ts

import { IJournalEntry, IJournalEntryLine, IEntryDetail } from '../../types/transaction.types.ts';
import { IAccount } from '../../types/account.types.ts';
import { JournalEntryConfig } from '../../types/config.types.ts';
import { IMoney } from '../../types/money.types.ts';
import { EntryType, ENTRY_TYPES, ERROR_MESSAGES, VALIDATION } from '../../Constants.ts';

import { ISerializable } from '../../types/serialization.ts';

/**
 * Known keys in JournalEntryConfig that are handled specially by the constructor.
 * Extra fields (not in this list) are stored directly on the instance.
 */
const KNOWN_CONFIG_KEYS = ['description', 'date', 'id', 'reference'];

/**
 * Class representing a journal entry for recording double-entry bookkeeping transactions.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const entry = new JournalEntry({ description: 'Monthly rent payment' });
 *
 * // With date and reference
 * const invoice = new JournalEntry({
 *     description: 'Invoice #1234',
 *     date: new Date('2024-01-15'),
 *     reference: 'INV-1234'
 * });
 *
 * // Extended with custom fields
 * const payroll = new JournalEntry({
 *     description: 'Payroll January 2024',
 *     date: new Date(),
 *     department: 'HR',
 *     approvedBy: 'John Smith'
 * });
 * ```
 *
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
     * Optional reference number (e.g., invoice number, check number)
     */
    public readonly reference?: string;

    /**
     * Array of individual transaction lines
     */
    private entries: IJournalEntryLine[] = [];

    /**
     * Flag indicating if the journal entry has been committed
     */
    private committed: boolean = false;

    /**
     * Index signature to allow extra fields for extensibility
     */
    [key: string]: unknown;

    /**
     * Creates a journal entry for recording transactions.
     * @param {JournalEntryConfig} config - Configuration object for the journal entry.
     * @throws {Error} If description is empty
     *
     * @example
     * ```typescript
     * new JournalEntry({ description: 'Sale of goods', date: new Date() })
     * ```
     */
    constructor(config: JournalEntryConfig) {
        if (!config.description || config.description.trim().length === 0) {
            throw new Error('Journal entry description cannot be empty');
        }

        this.description = config.description;
        this.date = config.date ?? new Date();
        this.id = config.id;
        this.reference = config.reference;

        // Store extra fields (excluding known config keys)
        for (const [key, value] of Object.entries(config)) {
            if (!KNOWN_CONFIG_KEYS.includes(key)) {
                this[key] = value;
            }
        }
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
     * Serialize the journal entry for persistence.
     * Includes all extra fields stored on the instance.
     */
    public serialize(): Record<string, unknown> {
        const base: Record<string, unknown> = {
            description: this.description,
            date: this.date,
            committed: this.committed,
            reference: this.reference,
            entries: this.entries.map(entry => {
                const accountId = (entry.account as unknown as Record<string, unknown>).id;
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

        // Include extra fields (not in known keys and not private/internal)
        const internalKeys = ['description', 'date', 'id', 'reference', 'entries', 'committed'];
        for (const key of Object.keys(this)) {
            if (!internalKeys.includes(key) && !key.startsWith('_')) {
                base[key] = this[key];
            }
        }

        return base;
    }

    /**
     * Static reference to the Account model for hydration.
     * Injected by the Factory.
     */
    public static AccountModel: unknown = null;

    /**
     * Create a JournalEntry instance from serialized data
     * @param {Record<string, unknown>} data - The serialized journal entry data
     * @returns {Promise<JournalEntry>} A new JournalEntry instance
     */
    public static async fromData(data: Record<string, unknown>): Promise<JournalEntry> {
        // Build config from data, preserving extra fields
        const config: JournalEntryConfig = {
            description: data.description as string,
            date: new Date(data.date as string | number | Date),
            reference: data.reference as string | undefined
        };

        // Copy extra fields to config
        const knownDataKeys = ['description', 'date', 'id', 'reference', 'entries', 'committed'];
        for (const [key, value] of Object.entries(data)) {
            if (!knownDataKeys.includes(key)) {
                config[key] = value;
            }
        }

        const entry = new JournalEntry(config);

        // Restore committed state if needed
        if (data.committed) {
            (entry as Record<string, unknown>).committed = true;
        }

        if (data.entries && Array.isArray(data.entries)) {
            const AccountModel = (this as unknown as Record<string, unknown>).AccountModel || JournalEntry.AccountModel;
            if (!AccountModel) {
                console.warn('AccountModel not injected into JournalEntry. Cannot hydrate entries.');
                return entry;
            }

            for (const entryData of data.entries as Record<string, unknown>[]) {
                const account = await (AccountModel as { findById: (id: string) => Promise<IAccount | null> }).findById(entryData.accountId as string);
                if (account) {
                    try {
                        // If already committed, we might need to bypass addEntry checks
                        if (entry.isCommitted()) {
                            (entry as Record<string, unknown>).entries = [
                                ...(entry as Record<string, unknown>).entries as IJournalEntryLine[],
                                {
                                    account: account,
                                    amount: entryData.amount as number,
                                    type: entryData.type as EntryType
                                }
                            ];
                        } else {
                            entry.addEntry(account, entryData.amount as number, entryData.type as EntryType);
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
