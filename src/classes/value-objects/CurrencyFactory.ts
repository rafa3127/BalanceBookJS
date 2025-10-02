import { Money } from './Money.js';
import type { 
  ICurrencyConfig, 
  IMoneyOptions,
  ICurrencyConstructor,
  ICurrencyFactory 
} from '../../types/money.types.js';
import { CURRENCY_CONFIG } from './Money.js';

/**
 * Creates a currency class and factory function dynamically.
 * Returns both a class (e.g., USD) and a factory function (e.g., usd).
 * 
 * @param currencyCode - The currency code (e.g., 'USD', 'EUR', 'BTC')
 * @param options - Optional configuration for the currency
 * @returns An object with the currency class and factory function
 * 
 * @example
 * ```typescript
 * const { USD, usd } = createCurrency('USD');
 * const payment = new USD(100);
 * const quick = usd(50);
 * ```
 */
export function createCurrency<T extends string>(
  currencyCode: T,
  options?: IMoneyOptions
): Record<T, ICurrencyConstructor> & Record<Lowercase<T>, ICurrencyFactory> {
  // Check if this currency exists in predefined configs
  const predefinedConfig = CURRENCY_CONFIG[currencyCode];
  
  // Convert predefined config to options if it exists
  const defaultOptions: IMoneyOptions = predefinedConfig ? {
    displayScale: predefinedConfig.decimals,
    symbol: predefinedConfig.symbol
  } : {};
  
  // Merge with provided options (provided options take precedence)
  const finalOptions = {
    ...defaultOptions,
    ...options
  };

  // Create the currency class dynamically
  class Currency extends Money {
    constructor(amount: number) {
      super(amount, currencyCode, finalOptions);
    }

    /**
     * Get the currency code for this class
     */
    static get code(): string {
      return currencyCode;
    }

    /**
     * Create a zero-value instance
     */
    static zero(): Currency {
      return new this(0);
    }

    /**
     * Create from a number or string value
     */
    static from(value: number | string): Currency {
      if (typeof value === 'string') {
        // Parse string values like "$100.50" or "100.50"
        const cleanValue = value.replace(/[^0-9.-]/g, '');
        const numericValue = parseFloat(cleanValue);
        if (isNaN(numericValue)) {
          throw new Error(`Cannot parse "${value}" as a monetary amount`);
        }
        return new this(numericValue);
      }
      return new this(value);
    }

    /**
     * Override toString for better debugging
     */
    toString(): string {
      return `${currencyCode} ${this.toNumber()}`;
    }

    /**
     * Get a descriptive name for debugging
     */
    get [Symbol.toStringTag](): string {
      return currencyCode;
    }
  }

  // Set the class name dynamically for better debugging
  Object.defineProperty(Currency, 'name', {
    value: currencyCode,
    configurable: true
  });

  // Create the factory function
  const factory: ICurrencyFactory = Object.assign(
    (amount: number): Currency => new Currency(amount),
    {
      zero: (): Currency => new Currency(0),
      from: (value: number | string): Currency => Currency.from(value),
      Class: Currency as ICurrencyConstructor
    }
  );

  // Return object with both class and factory function
  // Using computed property names for dynamic keys
  return {
    [currencyCode]: Currency as ICurrencyConstructor,
    [currencyCode.toLowerCase()]: factory
  } as Record<T, ICurrencyConstructor> & Record<Lowercase<T>, ICurrencyFactory>;
}

/**
 * Creates a factory function from an existing Money-based class.
 * Useful when you have custom currency classes with additional methods.
 * 
 * @param CurrencyClass - A class that extends Money
 * @returns A factory function with utility methods
 * 
 * @example
 * ```typescript
 * class USD extends Money {
 *   constructor(amount: number) {
 *     super(amount, 'USD');
 *   }
 *   
 *   formatForInvoice(): string {
 *     return `$${this.toNumber().toFixed(2)} USD`;
 *   }
 * }
 * 
 * const usd = createFactory(USD);
 * const payment = usd(100);
 * ```
 */
export function createFactory<T extends new (amount: number) => Money>(
  CurrencyClass: T
): ((amount: number) => InstanceType<T>) & {
  zero: () => InstanceType<T>;
  from: (value: number | string) => InstanceType<T>;
  Class: T;
} {
  // Create the base factory function
  const factory = (amount: number): InstanceType<T> => {
    return new CurrencyClass(amount) as InstanceType<T>;
  };

  // Add utility methods
  factory.zero = (): InstanceType<T> => {
    return new CurrencyClass(0) as InstanceType<T>;
  };

  factory.from = (value: number | string): InstanceType<T> => {
    if (typeof value === 'string') {
      // Parse string values
      const cleanValue = value.replace(/[^0-9.-]/g, '');
      const numericValue = parseFloat(cleanValue);
      if (isNaN(numericValue)) {
        throw new Error(`Cannot parse "${value}" as a monetary amount`);
      }
      return new CurrencyClass(numericValue) as InstanceType<T>;
    }
    return new CurrencyClass(value) as InstanceType<T>;
  };

  // Expose the class for instanceof checks or extension
  factory.Class = CurrencyClass;

  return factory;
}

/**
 * Optional: Registry for managing currency definitions
 * Useful when you want to ensure singleton behavior or manage currencies centrally
 * 
 * @example
 * ```typescript
 * const registry = new CurrencyRegistry();
 * const { USD, usd } = registry.define('USD');
 * const { USD: USD2 } = registry.get('USD'); // Returns the same class
 * ```
 */
export class CurrencyRegistry {
  private currencies = new Map<string, { class: ICurrencyConstructor; factory: ICurrencyFactory }>();

  /**
   * Define a new currency or return existing one
   */
  define<T extends string>(currencyCode: T, options?: IMoneyOptions): Record<T, ICurrencyConstructor> & Record<Lowercase<T>, ICurrencyFactory> {
    // Return existing if already defined
    if (this.currencies.has(currencyCode)) {
      return this.get(currencyCode);
    }

    // Create new currency using createCurrency
    const result = createCurrency(currencyCode, options);
    // Use type assertion to access properties safely
    const Currency = result[currencyCode as T] as ICurrencyConstructor;
    const factory = result[currencyCode.toLowerCase() as Lowercase<T>] as ICurrencyFactory;

    // Store for future retrieval
    this.currencies.set(currencyCode, {
      class: Currency,
      factory: factory
    });

    return result;
  }

  /**
   * Get an existing currency definition
   */
  get<T extends string>(currencyCode: T): Record<T, ICurrencyConstructor> & Record<Lowercase<T>, ICurrencyFactory> {
    const entry = this.currencies.get(currencyCode);
    if (!entry) {
      throw new Error(`Currency ${currencyCode} not defined in registry`);
    }

    return {
      [currencyCode]: entry.class,
      [currencyCode.toLowerCase()]: entry.factory
    } as Record<T, ICurrencyConstructor> & Record<Lowercase<T>, ICurrencyFactory>;
  }

  /**
   * Check if a currency is defined
   */
  has(currencyCode: string): boolean {
    return this.currencies.has(currencyCode);
  }

  /**
   * Get all defined currency codes
   */
  getCodes(): string[] {
    return Array.from(this.currencies.keys());
  }

  /**
   * Clear all definitions
   */
  clear(): void {
    this.currencies.clear();
  }
}

/**
 * Helper function to register a custom currency configuration
 * This extends the CURRENCY_CONFIG constant with new currencies
 * 
 * @example
 * ```typescript
 * registerCurrencyConfig('BTC', {
 *   code: 'BTC',
 *   symbol: '₿',
 *   name: 'Bitcoin',
 *   decimals: 8
 * });
 * 
 * const { BTC, btc } = createCurrency('BTC');
 * ```
 */
export function registerCurrencyConfig(
  code: string,
  config: ICurrencyConfig
): void {
  // Add to CURRENCY_CONFIG for future use
  (CURRENCY_CONFIG as any)[code] = config;
}
