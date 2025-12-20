// Income.ts

import Account from './Account.ts';
import type { IIncome } from '../../types/account.types.ts';
import type { IncomeConfig } from '../../types/config.types.ts';
import { Money } from '../value-objects/Money.ts';
import { AccountType } from '../../Constants.ts';

/**
 * Class representing an income account.
 * Income increases on credit and decreases on debit.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const sales = new Income({ name: 'Sales Revenue', balance: 0 });
 *
 * // With Money object
 * const interest = new Income({ name: 'Interest Income', balance: new Money(500, 'USD') });
 *
 * // Extended with custom fields
 * const consulting = new Income({
 *     name: 'Consulting Revenue',
 *     balance: 0,
 *     category: 'Services',
 *     taxable: true
 * });
 * ```
 *
 * @extends Account
 * @implements {IIncome}
 */
class Income extends Account implements IIncome {
    /**
     * The account type identifier
     */
    public readonly type: 'INCOME' = AccountType.INCOME as 'INCOME';

    /**
     * Create an income account.
     * @param {IncomeConfig} config - Configuration object for the income account.
     */
    constructor(config: IncomeConfig) {
        // Income increases on credit, hence isDebitPositive is false
        super({
            ...config,
            isDebitPositive: false
        } as import('../../types/config.types.ts').AccountConfig);
    }

    /**
     * Create an Income instance from serialized data.
     * @param {Record<string, unknown>} data - The serialized income data
     * @returns {Income} A new Income instance
     */
    public static override fromData(data: Record<string, unknown>): Income {
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
        const config: IncomeConfig = {
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

        return new Income(config);
    }
}

export default Income;
