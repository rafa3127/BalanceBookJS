class JournalEntry {
    /**
     * Creates a journal entry for recording transactions.
     * @param {string} description - Description of the journal entry.
     * @param {Date} [date=new Date()] - Date of the journal entry, defaults to the current date.
     */
    constructor(description, date = new Date()) {
        this.description = description;
        this.date = date;
        this.entries = [];
    }

    /**
     * Adds a transaction entry to the journal.
     * @param {Account} account - The account affected by this entry.
     * @param {number} amount - The monetary amount of the entry.
     * @param {'debit'|'credit'} type - The type of the entry, either 'debit' or 'credit'.
     */
    addEntry(account, amount, type) {
        if (!account || typeof account.debit !== 'function' || typeof account.credit !== 'function') {
            throw new Error('Invalid account passed to JournalEntry.');
        }
        this.entries.push({ account, amount, type });
    }
    

    /**
     * Commits the journal entry by applying all recorded transactions to their respective accounts.
     * Ensures that the total debits equal the total credits before committing.
     * @throws {Error} if the debits and credits are not balanced.
     */
    commit() {
        const totalDebits = this.entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
        const totalCredits = this.entries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);

        if (totalDebits !== totalCredits) {
            throw new Error('Debits and credits must balance before committing a journal entry.');
        }

        // Apply all the recorded transactions to their respective accounts
        this.entries.forEach(entry => {
            entry.account[entry.type](entry.amount);
        });
    }

    /**
     * Returns details of all entries in the journal entry.
     * @return {Object[]} An array of entry details including account name, amount, type, date, and description.
     */
    getDetails() {
        return this.entries.map(entry => ({
            accountName: entry.account.name,
            amount: entry.amount,
            type: entry.type,
            date: this.date,
            description: this.description
        }));
    }
}

export default JournalEntry