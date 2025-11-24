/**
 * Core type definitions for Money value objects
 */

/**
 * Supported currency codes (ISO 4217)
 * Can be extended as needed
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'MXN' | string;

/**
 * Currency configuration
 */
export interface ICurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
}

/**
 * Money value object interface
 */
export interface IMoney {
  readonly currency: CurrencyCode;
  readonly amount: number;
  
  // Arithmetic operations
  add(other: IMoney): IMoney;
  subtract(other: IMoney): IMoney;
  multiply(factor: number): IMoney;
  divide(divisor: number): IMoney;
  negate(): IMoney;
  
  // Comparison operations
  equals(other: IMoney): boolean;
  isGreaterThan(other: IMoney): boolean;
  isGreaterThanOrEqual(other: IMoney): boolean;
  isLessThan(other: IMoney): boolean;
  isLessThanOrEqual(other: IMoney): boolean;
  isZero(): boolean;
  isPositive(): boolean;
  isNegative(): boolean;
  
  // Conversion methods
  toNumber(): number;
  toString(): string;
  format(locale?: string): string;
  toJSON(): IMoneyJSON;
  getInternalAmount(): number;  // New method for internal precision
}

/**
 * JSON representation of Money
 */
export interface IMoneyJSON {
  amount: number;
  currency: CurrencyCode;
}

/**
 * Money constructor parameters
 */
export interface MoneyConstructorParams {
  amount: number | string;
  currency?: CurrencyCode;
}

/**
 * Options for Money operations
 */
export interface IMoneyOptions {
  /**
   * Rounding mode for division operations
   * Default: 'HALF_UP'
   */
  roundingMode?: 'UP' | 'DOWN' | 'HALF_UP' | 'HALF_DOWN' | 'HALF_EVEN';
  
  /**
   * Number of decimal places for the currency
   * Default: determined by currency code
   */
  decimals?: number;
  
  /**
   * Minimum internal scale for precision
   */
  minInternalScale?: number;
  
  /**
   * Force specific scale (overrides auto-detection)
   */
  forceScale?: number;
  
  /**
   * Display scale for the currency
   */
  displayScale?: number;
  
  /**
   * Currency symbol override
   */
  symbol?: string;
}

/**
 * Money arithmetic result with remainder (for division)
 */
export interface IMoneyDivisionResult {
  quotient: IMoney;
  remainder: IMoney;
}

/**
 * Factory methods for creating Money instances
 */
export interface IMoneyFactory {
  fromCents(cents: number, currency?: CurrencyCode): IMoney;
  fromAmount(amount: number, currency?: CurrencyCode): IMoney;
  fromString(value: string, currency?: CurrencyCode): IMoney;
  zero(currency?: CurrencyCode): IMoney;
  of(amount: number | string, currency?: CurrencyCode): IMoney;
}

/**
 * Currency registry interface
 */
export interface ICurrencyRegistry {
  getCurrency(code: CurrencyCode): ICurrencyConfig | undefined;
  registerCurrency(config: ICurrencyConfig): void;
  getSupportedCurrencies(): CurrencyCode[];
}

/**
 * Type guard to check if a value is a Money instance
 */
export interface IMoneyTypeGuard {
  isMoney(value: any): value is IMoney;
}

/**
 * Extended Money interface with internal methods
 */
export interface IMoneyInternal extends IMoney {
  readonly minorUnits: bigint;
  readonly scale: number;
  getInternalAmount(): number;
}

/**
 * Currency class constructor interface for CurrencyFactory
 */
export interface ICurrencyConstructor {
  new (amount: number): IMoney;
  code: string;
  zero(): IMoney;
  from(value: number | string): IMoney;
}

/**
 * Currency factory function interface for CurrencyFactory
 */
export interface ICurrencyFactory {
  (amount: number): IMoney;
  zero(): IMoney;
  from(value: number | string): IMoney;
  Class: ICurrencyConstructor;
}
