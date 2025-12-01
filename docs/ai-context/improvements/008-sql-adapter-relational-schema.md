# Improvement: SQLAdapter Relational Schema Redesign

## AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature. This improvement involves redesigning the SQLAdapter to use a proper relational schema instead of serialized JSON, enabling efficient SQL queries for accounting operations.

## Overview
**Priority**: High
**Category**: Refactor/Enhancement
**Complexity**: High
**Breaking Change**: Yes (for SQLAdapter users only - requires data migration)
**Status**: Planned (SQLAdapter temporarily disabled in v2.3.0)

### Brief Description
Redesign the SQLAdapter to use a normalized relational schema with separate tables for accounts, journal entries, and journal entry lines. This enables efficient SQL JOINs, proper indexing, and native database queries for operations like "find all transactions involving account X" or generating T-accounts.

### Why This Is Needed
The current SQLAdapter implementation stores `JournalEntry.entries` as serialized JSON in a single column, which:
- Prevents efficient queries like "find transactions involving account X"
- Cannot create indexes on entry fields (accountId, amount, type)
- Cannot use SQL JOINs for reports
- Requires deserializing all entries in memory for T-Account generation
- Has no referential integrity between entries and accounts

## Success Criteria
- [ ] Three-table relational schema (accounts, journal_entries, journal_entry_lines)
- [ ] Foreign key relationships with referential integrity
- [ ] Proper indexes on commonly queried fields
- [ ] Full `IQueryFilters` support with SQL translation
- [ ] `migrate()` method to create tables automatically
- [ ] Efficient queries for transactions by account
- [ ] Support for T-Account generation via SQL
- [ ] Trial balance and financial reports via SQL
- [ ] Data migration utility for existing JSON-based data

## Technical Design

### Proposed Schema

```sql
-- Accounts table
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE')),
    is_debit_positive BOOLEAN NOT NULL,
    balance_amount DECIMAL(20, 6) NOT NULL DEFAULT 0,
    balance_currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_name ON accounts(name);

-- Journal entries table (header only)
CREATE TABLE journal_entries (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    committed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journal_entries_date ON journal_entries(date);
CREATE INDEX idx_journal_entries_committed ON journal_entries(committed);

-- Journal entry lines table (the key improvement)
CREATE TABLE journal_entry_lines (
    id TEXT PRIMARY KEY,
    journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    amount DECIMAL(20, 6) NOT NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
    line_order INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT positive_amount CHECK (amount >= 0)
);

CREATE INDEX idx_jel_journal_entry_id ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_jel_account_id ON journal_entry_lines(account_id);
CREATE INDEX idx_jel_entry_type ON journal_entry_lines(entry_type);
```

### IQueryFilters to SQL Translation

The adapter should translate `IQueryFilters` to efficient SQL:

```typescript
// IQueryFilters input
{
    $where: [
        { field: 'type', operator: '==', value: 'ASSET' },
        { field: 'balance.amount', operator: '>=', value: 1000 },
        { field: 'name', operator: 'startsWith', value: 'Cash' }
    ],
    $orderBy: { field: 'name', direction: 'asc' },
    $limit: 10,
    $offset: 20
}

// Translated SQL
SELECT * FROM accounts
WHERE type = 'ASSET'
  AND balance_amount >= 1000
  AND name LIKE 'Cash%'
ORDER BY name ASC
LIMIT 10 OFFSET 20;
```

**Operator mapping:**
| IQueryFilters | SQL |
|---------------|-----|
| `==` | `=` |
| `!=` | `<>` |
| `>`, `>=`, `<`, `<=` | Same |
| `in` | `IN (...)` |
| `not-in` | `NOT IN (...)` |
| `contains` | Subquery with JOIN for array fields |
| `startsWith` | `LIKE 'value%'` |
| `endsWith` | `LIKE '%value'` |
| `includes` | `LIKE '%value%'` |

### Special Handling for JournalEntry Queries

When querying journal entries with `contains` operator on entries/accounts:

```typescript
// Filter: transactions involving account X
{ field: 'entries.accountId', operator: 'contains', value: 'account-123' }

// Translated to:
SELECT DISTINCT je.* FROM journal_entries je
JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
WHERE jel.account_id = 'account-123';
```

### Schema Migration Support

Add a `migrate()` method to IAdapter interface:

```typescript
interface IAdapter {
    // ... existing methods ...

    /**
     * Optional: Create or update database schema
     * Called once during initialization if schema doesn't exist
     */
    migrate?(): Promise<void>;

    /**
     * Optional: Check if schema exists and is up to date
     */
    checkSchema?(): Promise<{ exists: boolean; version?: string }>;
}
```

Implementation in SQLAdapter:

```typescript
class SQLAdapter implements IAdapter {
    async migrate(): Promise<void> {
        const hasAccounts = await this.tableExists('accounts');
        const hasJournalEntries = await this.tableExists('journal_entries');
        const hasJournalEntryLines = await this.tableExists('journal_entry_lines');

        if (!hasAccounts) await this.createAccountsTable();
        if (!hasJournalEntries) await this.createJournalEntriesTable();
        if (!hasJournalEntryLines) await this.createJournalEntryLinesTable();
    }

    private async createAccountsTable(): Promise<void> {
        await this.db.schema.createTable('accounts', (table) => {
            table.string('id').primary();
            table.string('name').notNullable();
            table.string('type').notNullable();
            table.boolean('is_debit_positive').notNullable();
            table.decimal('balance_amount', 20, 6).notNullable().defaultTo(0);
            table.string('balance_currency').notNullable().defaultTo('USD');
            table.timestamps(true, true);

            table.index('type');
            table.index('name');
        });
    }

    // ... similar for other tables
}
```

## Example SQL Queries

### Find transactions involving a specific account
```sql
SELECT DISTINCT je.*
FROM journal_entries je
JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
WHERE jel.account_id = ?
ORDER BY je.date DESC;
```

### Generate T-Account (debits and credits for an account)
```sql
SELECT
    entry_type,
    SUM(amount) as total,
    COUNT(*) as count
FROM journal_entry_lines
WHERE account_id = ?
GROUP BY entry_type;
```

### Calculate account balance from transactions
```sql
SELECT
    a.id,
    a.name,
    a.type,
    COALESCE(SUM(CASE
        WHEN jel.entry_type = 'debit' AND a.is_debit_positive THEN jel.amount
        WHEN jel.entry_type = 'credit' AND NOT a.is_debit_positive THEN jel.amount
        WHEN jel.entry_type = 'debit' AND NOT a.is_debit_positive THEN -jel.amount
        WHEN jel.entry_type = 'credit' AND a.is_debit_positive THEN -jel.amount
        ELSE 0
    END), 0) as calculated_balance
FROM accounts a
LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.committed = TRUE
GROUP BY a.id, a.name, a.type, a.is_debit_positive;
```

### Account statement with running balance
```sql
WITH movements AS (
    SELECT
        je.id as transaction_id,
        je.description,
        je.date,
        jel.amount,
        jel.entry_type,
        CASE
            WHEN jel.entry_type = 'debit' AND a.is_debit_positive THEN jel.amount
            WHEN jel.entry_type = 'credit' AND NOT a.is_debit_positive THEN jel.amount
            WHEN jel.entry_type = 'debit' AND NOT a.is_debit_positive THEN -jel.amount
            WHEN jel.entry_type = 'credit' AND a.is_debit_positive THEN -jel.amount
        END as signed_amount
    FROM journal_entry_lines jel
    JOIN journal_entries je ON jel.journal_entry_id = je.id
    JOIN accounts a ON jel.account_id = a.id
    WHERE jel.account_id = ? AND je.committed = TRUE
    ORDER BY je.date, je.id
)
SELECT
    *,
    SUM(signed_amount) OVER (ORDER BY date, transaction_id) as running_balance
FROM movements;
```

### Trial Balance
```sql
SELECT
    a.type,
    SUM(CASE WHEN jel.entry_type = 'debit' THEN jel.amount ELSE 0 END) as total_debits,
    SUM(CASE WHEN jel.entry_type = 'credit' THEN jel.amount ELSE 0 END) as total_credits
FROM accounts a
JOIN journal_entry_lines jel ON a.id = jel.account_id
JOIN journal_entries je ON jel.journal_entry_id = je.id
WHERE je.committed = TRUE
GROUP BY a.type;
```

## Implementation Steps

### Phase 1: Schema and Migration
1. [ ] Update SQLAdapter with new relational schema
2. [ ] Implement `migrate()` method with Knex schema builder
3. [ ] Add `checkSchema()` method to verify tables exist
4. [ ] Create indexes for performance

### Phase 2: CRUD Operations
5. [ ] Update `save()` for accounts (simple table insert/update)
6. [ ] Update `save()` for journal entries (insert header + lines)
7. [ ] Update `get()` for accounts
8. [ ] Update `get()` for journal entries (join with lines)
9. [ ] Update `delete()` with cascade handling

### Phase 3: Query Support
10. [ ] Implement IQueryFilters translation to SQL
11. [ ] Handle dot notation for nested fields (e.g., `balance.amount` -> `balance_amount`)
12. [ ] Implement special handling for `entries.accountId` queries via JOINs
13. [ ] Add all operator translations

### Phase 4: Testing
14. [ ] Unit tests for schema migration
15. [ ] Unit tests for CRUD operations
16. [ ] Unit tests for query filters
17. [ ] Integration tests with PostgreSQL
18. [ ] Integration tests with SQLite
19. [ ] Integration tests with MySQL

### Phase 5: Data Migration Utility
20. [ ] Create utility to migrate existing JSON data to relational schema
21. [ ] Document migration process

## Test Cases

```typescript
describe('SQLAdapter with Relational Schema', () => {
    describe('Schema Migration', () => {
        it('should create all tables on migrate()', async () => {
            const adapter = new SQLAdapter(config);
            await adapter.migrate();
            // Verify tables exist
        });

        it('should be idempotent (safe to call multiple times)', async () => {
            await adapter.migrate();
            await adapter.migrate(); // Should not throw
        });
    });

    describe('Account Operations', () => {
        it('should save and retrieve account', async () => {
            const account = new Asset('Cash', 1000);
            await account.save();

            const retrieved = await Account.findById(account.id);
            expect(retrieved.name).toBe('Cash');
            expect(retrieved.getBalance()).toBe(1000);
        });
    });

    describe('JournalEntry Operations', () => {
        it('should save journal entry with lines in separate table', async () => {
            const entry = new JournalEntry('Test');
            entry.addEntry(cash, 100, 'debit');
            entry.addEntry(revenue, 100, 'credit');
            entry.commit();
            await entry.save();

            // Verify lines stored separately
            const lines = await db('journal_entry_lines')
                .where('journal_entry_id', entry.id);
            expect(lines).toHaveLength(2);
        });
    });

    describe('Query Filters', () => {
        it('should find transactions by account via JOIN', async () => {
            const results = await JournalEntry.findAll({
                $where: [
                    { field: 'entries.accountId', operator: 'contains', value: cash.id }
                ]
            });

            expect(results.length).toBeGreaterThan(0);
            results.forEach(tx => {
                const entries = tx.getEntries();
                expect(entries.some(e => e.account.id === cash.id)).toBe(true);
            });
        });

        it('should support all IQueryFilters operators', async () => {
            const results = await Account.findAll({
                $where: [
                    { field: 'type', operator: '==', value: 'ASSET' },
                    { field: 'name', operator: 'startsWith', value: 'Cash' },
                    { field: 'balance.amount', operator: '>=', value: 1000 }
                ],
                $orderBy: { field: 'name', direction: 'asc' },
                $limit: 10
            });

            // Verify results match filters
        });
    });
});
```

## Dependencies
- `knex` - SQL query builder (peer dependency)
- Database driver: `pg`, `mysql2`, or `better-sqlite3`

## Related Improvements
- 003-general-ledger.md - Will benefit from efficient SQL queries
- 004-financial-reports.md - Can use SQL aggregations for reports

## Notes
- The SQLAdapter is currently disabled in v2.3.0 pending this redesign
- Users should use MemoryAdapter or FirebaseAdapter until this is complete
- Consider adding database transaction support for atomicity in future improvement
