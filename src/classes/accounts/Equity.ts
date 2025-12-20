// Equity.ts

import Account from './Account.ts';
import type { IEquity } from '../../types/account.types.ts';
import type { EquityConfig } from '../../types/config.types.ts';
import { Money } from '../value-objects/Money.ts';
import { AccountType } from '../../Constants.ts';

/**
 * Class representing an equity account.
 * Equity increases on credit and decreases on debit.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const capital = new Equity({ name: "Owner's Capital", balance: 50000 });
 *
 * // With Money object
 * const retained = new Equity({ name: 'Retained Earnings', balance: new Money(25000, 'USD') });
 *
 * // Extended with custom fields
 * const shares = new Equity({
 *     name: 'Common Stock',
 *     balance: 100000,
 *     sharesIssued: 10000,
 *     parValue: 10
 * });
 * ```
 *
 * @extends Account
 * @implements {IEquity}
 */
class Equity extends Account implements IEquity {
    /**
     * The account type identifier
     */
    public readonly type: 'EQUITY' = AccountType.EQUITY as 'EQUITY';

    /**
     * Create an equity account.
     * @param {EquityConfig} config - Configuration object for the equity account.
     */
    constructor(config: EquityConfig) {
        // Equity increases on credit, hence isDebitPositive is false
        super({
            ...config,
            isDebitPositive: false
        } as import('../../types/config.types.ts').AccountConfig);
    }

    /**
     * Create an Equity instance from serialized data.
     * @param {Record<string, unknown>} data - The serialized equity data
     * @returns {Equity} A new Equity instance
     */
    public static override fromData(data: Record<string, unknown>): Equity {
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
        const config: EquityConfig = {
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

        return new Equity(config);
    }
}

export default Equity;
