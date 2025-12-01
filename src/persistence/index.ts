export { Factory } from './Factory.ts';
export { MemoryAdapter } from './adapters/MemoryAdapter.ts';
export { PersistableMixin } from './PersistableMixin.ts';
export { FirebaseAdapter } from './adapters/firebase/FirebaseAdapter.ts';
export * from './adapters/firebase/config.ts';

// SQLAdapter is temporarily disabled pending a redesign with proper relational schema.
// The current implementation stores JournalEntry.entries as serialized JSON which prevents
// efficient queries like "find transactions involving account X".
// See docs/ai-context/improvements/008-sql-adapter-relational-schema.md for the planned design.
// TODO: Re-enable after implementing relational schema with journal_entry_lines table
// export { SQLAdapter } from './adapters/sql/SQLAdapter.ts';
// export * from './adapters/sql/config.ts';

export * from './interfaces.ts';
