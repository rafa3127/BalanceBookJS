// Asset.ts

import Account from './Account.ts';
import type { IAsset } from '../../types/account.types.ts';
import type { AssetConfig } from '../../types/config.types.ts';
import { Money } from '../value-objects/Money.ts';
import { AccountType } from '../../Constants.ts';

/**
 * Class representing an asset account.
 * Assets increase on debit and decrease on credit.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const cash = new Asset({ name: 'Cash', balance: 1000, currency: 'USD' });
 *
 * // With Money object
 * const bank = new Asset({ name: 'Bank', balance: new Money(5000, 'USD') });
 *
 * // Extended with custom fields
 * const equipment = new Asset({
 *     name: 'Equipment',
 *     balance: 10000,
 *     category: 'Fixed Assets',
 *     department: 'Operations'
 * });
 * ```
 *
 * @extends Account
 * @implements {IAsset}
 */
class Asset extends Account implements IAsset {
    /**
     * The account type identifier
     */
    public readonly type: 'ASSET' = AccountType.ASSET as 'ASSET';

    /**
     * Create an asset account.
     * @param {AssetConfig} config - Configuration object for the asset account.
     */
    constructor(config: AssetConfig) {
        // Assets increase on debit, hence isDebitPositive is true
        super({
            ...config,
            isDebitPositive: true
        } as import('../../types/config.types.ts').AccountConfig);
    }

    /**
     * Create an Asset instance from serialized data.
     * @param {Record<string, unknown>} data - The serialized asset data
     * @returns {Asset} A new Asset instance
     */
    public static override fromData(data: Record<string, unknown>): Asset {
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
        const config: AssetConfig = {
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

        return new Asset(config);
    }
}

export default Asset;
