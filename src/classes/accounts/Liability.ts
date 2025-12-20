// Liability.ts

import Account from './Account.ts';
import type { ILiability } from '../../types/account.types.ts';
import type { LiabilityConfig } from '../../types/config.types.ts';
import { Money } from '../value-objects/Money.ts';
import { AccountType } from '../../Constants.ts';

/**
 * Class representing a liability account.
 * Liabilities increase on credit and decrease on debit.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const payable = new Liability({ name: 'Accounts Payable', balance: 5000 });
 *
 * // With Money object
 * const loan = new Liability({ name: 'Bank Loan', balance: new Money(50000, 'USD') });
 *
 * // Extended with custom fields
 * const mortgage = new Liability({
 *     name: 'Mortgage',
 *     balance: 200000,
 *     dueDate: new Date('2045-01-01'),
 *     interestRate: 0.045
 * });
 * ```
 *
 * @extends Account
 * @implements {ILiability}
 */
class Liability extends Account implements ILiability {
    /**
     * The account type identifier
     */
    public readonly type: 'LIABILITY' = AccountType.LIABILITY as 'LIABILITY';

    /**
     * Create a liability account.
     * @param {LiabilityConfig} config - Configuration object for the liability account.
     */
    constructor(config: LiabilityConfig) {
        // Liabilities increase on credit, hence isDebitPositive is false
        super({
            ...config,
            isDebitPositive: false
        } as import('../../types/config.types.ts').AccountConfig);
    }

    /**
     * Create a Liability instance from serialized data.
     * @param {Record<string, unknown>} data - The serialized liability data
     * @returns {Liability} A new Liability instance
     */
    public static override fromData(data: Record<string, unknown>): Liability {
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
        const config: LiabilityConfig = {
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

        return new Liability(config);
    }
}

export default Liability;
