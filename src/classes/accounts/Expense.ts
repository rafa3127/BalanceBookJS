// Expense.ts

import Account from './Account.ts';
import type { IExpense } from '../../types/account.types.ts';
import type { ExpenseConfig } from '../../types/config.types.ts';
import { Money } from '../value-objects/Money.ts';
import { AccountType } from '../../Constants.ts';

/**
 * Class representing an expense account.
 * Expenses increase on debit and decrease on credit.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const rent = new Expense({ name: 'Rent Expense', balance: 0 });
 *
 * // With Money object
 * const utilities = new Expense({ name: 'Utilities', balance: new Money(200, 'USD') });
 *
 * // Extended with custom fields
 * const salaries = new Expense({
 *     name: 'Salaries Expense',
 *     balance: 0,
 *     department: 'Operations',
 *     deductible: true
 * });
 * ```
 *
 * @extends Account
 * @implements {IExpense}
 */
class Expense extends Account implements IExpense {
    /**
     * The account type identifier
     */
    public readonly type: 'EXPENSE' = AccountType.EXPENSE as 'EXPENSE';

    /**
     * Create an expense account.
     * @param {ExpenseConfig} config - Configuration object for the expense account.
     */
    constructor(config: ExpenseConfig) {
        // Expenses increase on debit, hence isDebitPositive is true
        super({
            ...config,
            isDebitPositive: true
        } as import('../../types/config.types.ts').AccountConfig);
    }

    /**
     * Create an Expense instance from serialized data.
     * @param {Record<string, unknown>} data - The serialized expense data
     * @returns {Expense} A new Expense instance
     */
    public static override fromData(data: Record<string, unknown>): Expense {
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

        // Build config from data, preserving extra fields
        const config: ExpenseConfig = {
            name: data.name as string,
            balance,
            currency: (data.currency as string) || 'CURR'
        };

        // Copy extra fields to config
        const knownDataKeys = ['name', 'balance', 'isDebitPositive', 'currency', 'type', 'initialMode', 'id'];
        for (const [key, value] of Object.entries(data)) {
            if (!knownDataKeys.includes(key)) {
                config[key] = value;
            }
        }

        return new Expense(config);
    }
}

export default Expense;
