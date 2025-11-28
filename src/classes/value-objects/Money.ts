/**
 * Money value object for precise monetary calculations
 */

import {
  IMoney,
  IMoneyJSON,
  CurrencyCode,
  ICurrencyConfig,
  IMoneyInternal
} from '../../types/money.types.ts';

/**
 * Default currency configurations
 */
export const CURRENCY_CONFIG: Record<string, ICurrencyConfig> = {
  CURR: { code: 'CURR', symbol: '¤', name: 'Generic Currency', decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimals: 2 }
};

/**
 * Default minimum internal scale for precision
 */
const DEFAULT_MIN_INTERNAL_SCALE = 6;

/**
 * Safe value limits by scale to prevent precision loss
 * These limits ensure that value * 10^scale <= Number.MAX_SAFE_INTEGER
 */
const SAFE_VALUE_LIMITS: Record<number, number> = {
  0: Number.MAX_SAFE_INTEGER,           // 9,007,199,254,740,991
  1: 900_719_925_474_099,               // 900 trillion
  2: 90_071_992_547_409,                // 90 trillion (USD, EUR)
  3: 9_007_199_254_740,                 // 9 trillion
  4: 900_719_925_474,                   // 900 billion
  5: 90_071_992_547,                    // 90 billion
  6: 9_007_199_254,                     // 9 billion (default internal scale)
  7: 900_719_925,                       // 900 million
  8: 90_071_992,                        // 90 million (BTC max ~21M)
  9: 9_007_199,                         // 9 million
  10: 900_719,                          // 900 thousand
  11: 90_071,                           // 90 thousand
  12: 9_007                             // 9 thousand
};

/**
 * Calculate safe value limit for any scale
 */
function getSafeValueLimit(scale: number): number {
  if (scale in SAFE_VALUE_LIMITS) {
    return SAFE_VALUE_LIMITS[scale]!;
  }
  // For scales not in the map, calculate dynamically
  // but cap at a reasonable scale to prevent overflow
  if (scale > 15) {
    return Math.floor(Number.MAX_SAFE_INTEGER / Math.pow(10, 15));
  }
  return Math.floor(Number.MAX_SAFE_INTEGER / Math.pow(10, scale));
}

/**
 * Money class for handling monetary values with precision
 * Uses integer arithmetic internally to avoid floating point errors
 * Maintains higher internal precision than display precision
 * @implements {IMoneyInternal}
 */
export class Money implements IMoneyInternal {
  /**
   * Internal representation as minor units with full precision
   */
  public readonly minorUnits: bigint;
  
  /**
   * Currency code (ISO 4217)
   */
  public readonly currency: CurrencyCode;
  
  /**
   * Internal scale for calculations (higher precision)
   */
  public readonly scale: number;
  
  /**
   * Display scale for the currency (e.g., 2 for USD)
   */
  public readonly displayScale: number;
  
  /**
   * Amount as a regular number (for compatibility)
   */
  public readonly amount: number;

  /**
   * Creates a new Money instance
   * @param {number | string} amount - The monetary amount
   * @param {CurrencyCode} currency - The currency code (default: 'USD')
   * @param {object} options - Optional configuration
   * @param {number} options.minInternalScale - Minimum internal precision (default: 6)
   * @param {number} options.forceScale - Force specific scale (overrides auto-detection)
   */
  constructor(
    amount: number | string, 
    currency: CurrencyCode = 'USD',
    options?: {
      minInternalScale?: number;
      forceScale?: number;
    }
  ) {
    this.currency = currency;
    this.displayScale = this.getCurrencyScale(currency);
    
    // Convert to number for processing
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numericAmount)) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    
    // Determine internal scale
    if (options?.forceScale !== undefined) {
      this.scale = options.forceScale;
    } else {
      const minScale = options?.minInternalScale ?? DEFAULT_MIN_INTERNAL_SCALE;
      const inputScale = this.detectDecimalPlaces(numericAmount);
      this.scale = Math.max(inputScale, this.displayScale, minScale);
    }
    
    // Validate against safe value limits
    const safeLimit = getSafeValueLimit(this.scale);
    if (Math.abs(numericAmount) > safeLimit) {
      throw new Error(
        `Amount ${numericAmount} exceeds the maximum safe value ` +
        `(${safeLimit.toLocaleString()}) for ${currency} with ${this.scale} decimal places. ` +
        `This limit ensures numerical precision.`
      );
    }
    
    // Store as bigint with full precision
    const scaleFactor = Math.pow(10, this.scale);
    this.minorUnits = BigInt(Math.round(numericAmount * scaleFactor));
    
    // Store the display amount for easy access
    this.amount = this.toNumber();
  }

  /**
   * Detect the number of decimal places in a number
   * @private
   */
  private detectDecimalPlaces(num: number): number {
    const str = num.toString();
    const decimalIndex = str.indexOf('.');
    if (decimalIndex === -1) return 0;
    
    // Handle scientific notation
    if (str.includes('e')) {
      const parts = str.split('e');
      const mantissa = parts[0];
      const exponentStr = parts[1];
      
      if (!mantissa || !exponentStr) return 0;
      
      const exponent = parseInt(exponentStr, 10);
      const mantissaParts = mantissa.split('.');
      const mantissaDecimals = (mantissaParts[1] || '').length;
      return Math.max(0, mantissaDecimals - exponent);
    }
    
    return str.length - decimalIndex - 1;
  }

  /**
   * Get the number of decimal places for a currency
   * @private
   */
  private getCurrencyScale(currency: CurrencyCode): number {
    const config = CURRENCY_CONFIG[currency];
    return config ? config.decimals : 2; // Default to 2 decimal places
  }

  /**
   * Create a Money instance from minor units
   * @static
   */
  static fromMinorUnits(
    minorUnits: bigint, 
    currency: CurrencyCode, 
    scale: number,
    displayScale: number
  ): Money {
    const instance = Object.create(Money.prototype);
    instance.minorUnits = minorUnits;
    instance.currency = currency;
    instance.scale = scale;
    instance.displayScale = displayScale;
    instance.amount = instance.toNumber();
    return instance;
  }

  /**
   * Get the internal amount with full precision
   * @returns {number} The internal amount with full precision
   */
  public getInternalAmount(): number {
    return Number(this.minorUnits) / Math.pow(10, this.scale);
  }

  /**
   * Add another Money amount
   * @param {IMoney} other - The amount to add
   * @returns {Money} A new Money instance with the sum
   * @throws {Error} If currencies don't match or if other is not a Money instance
   */
  add(other: IMoney): Money {
    this.assertSameCurrency(other);
    this.assertIsMoney(other);
    
    // Use the higher scale for precision
    const newScale = Math.max(this.scale, other.scale);
    
    // Convert both to the same scale
    const thisScaled = this.convertToScale(newScale);
    const otherScaled = this.convertMoneyToScale(other, newScale);
    
    return Money.fromMinorUnits(
      thisScaled + otherScaled,
      this.currency,
      newScale,
      this.displayScale
    );
  }

  /**
   * Subtract another Money amount
   * @param {IMoney} other - The amount to subtract
   * @returns {Money} A new Money instance with the difference
   * @throws {Error} If currencies don't match or if other is not a Money instance
   */
  subtract(other: IMoney): Money {
    this.assertSameCurrency(other);
    this.assertIsMoney(other);
    
    // Use the higher scale for precision
    const newScale = Math.max(this.scale, other.scale);
    
    // Convert both to the same scale
    const thisScaled = this.convertToScale(newScale);
    const otherScaled = this.convertMoneyToScale(other, newScale);
    
    return Money.fromMinorUnits(
      thisScaled - otherScaled,
      this.currency,
      newScale,
      this.displayScale
    );
  }

  /**
   * Convert another Money instance's minor units to a different scale
   * @private
   */
  private convertMoneyToScale(money: Money, newScale: number): bigint {
    if (newScale === money.scale) {
      return money.minorUnits;
    }
    
    if (newScale > money.scale) {
      const factor = BigInt(Math.pow(10, newScale - money.scale));
      return money.minorUnits * factor;
    } else {
      const factor = BigInt(Math.pow(10, money.scale - newScale));
      return money.minorUnits / factor;
    }
  }

  /**
   * Convert minor units to a different scale
   * @private
   */
  private convertToScale(newScale: number): bigint {
    if (newScale === this.scale) {
      return this.minorUnits;
    }
    
    if (newScale > this.scale) {
      const factor = BigInt(Math.pow(10, newScale - this.scale));
      return this.minorUnits * factor;
    } else {
      const factor = BigInt(Math.pow(10, this.scale - newScale));
      return this.minorUnits / factor;
    }
  }

  /**
   * Multiply by a factor
   * @param {number} factor - The multiplication factor
   * @returns {Money} A new Money instance with the product
   */
  multiply(factor: number): Money {
    // Use internal amount for precise multiplication
    const internalAmount = this.getInternalAmount();
    const result = internalAmount * factor;
    
    // Create new Money with the result, but cap the internal scale
    // Use the current scale as max, don't increase it unnecessarily
    return new Money(result, this.currency, {
      forceScale: this.scale  // Keep same scale, don't auto-detect from result
    });
  }

  /**
   * Divide by a divisor
   * @param {number} divisor - The divisor
   * @returns {Money} A new Money instance with the quotient
   * @throws {Error} If divisor is zero
   */
  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Division by zero');
    }
    
    // Use internal amount for precise division
    const internalAmount = this.getInternalAmount();
    const result = internalAmount / divisor;
    
    // Create new Money with the result
    // Keep the same scale, don't auto-detect from result to avoid excessive decimals
    return new Money(result, this.currency, {
      forceScale: this.scale  // Keep same scale, don't auto-detect from result
    });
  }

  /**
   * Negate the amount
   * @returns {Money} A new Money instance with negated amount
   */
  negate(): Money {
    return Money.fromMinorUnits(-this.minorUnits, this.currency, this.scale, this.displayScale);
  }

  /**
   * Check equality with another Money amount
   * @param {IMoney} other - The amount to compare
   * @returns {boolean} True if amounts and currencies are equal
   */
  equals(other: IMoney): boolean {
    if (!Money.isMoney(other)) {
      return false;
    }
    
    if (this.currency !== other.currency) {
      return false;
    }
    
    // Compare internal amounts exactly
    // Both should have been created with proper precision
    return this.minorUnits === other.minorUnits && this.scale === other.scale;
  }

  /**
   * Check if greater than another Money amount
   * @param {IMoney} other - The amount to compare
   * @returns {boolean} True if this amount is greater
   * @throws {Error} If currencies don't match or if other is not a Money instance
   */
  isGreaterThan(other: IMoney): boolean {
    this.assertSameCurrency(other);
    this.assertIsMoney(other);
    
    // Use the higher scale for comparison
    const compareScale = Math.max(this.scale, other.scale);
    const thisScaled = this.convertToScale(compareScale);
    const otherScaled = this.convertMoneyToScale(other, compareScale);
    
    return thisScaled > otherScaled;
  }

  /**
   * Check if greater than or equal to another Money amount
   * @param {IMoney} other - The amount to compare
   * @returns {boolean} True if this amount is greater or equal
   * @throws {Error} If currencies don't match or if other is not a Money instance
   */
  isGreaterThanOrEqual(other: IMoney): boolean {
    this.assertSameCurrency(other);
    this.assertIsMoney(other);
    
    const compareScale = Math.max(this.scale, other.scale);
    const thisScaled = this.convertToScale(compareScale);
    const otherScaled = this.convertMoneyToScale(other, compareScale);
    
    return thisScaled >= otherScaled;
  }

  /**
   * Check if less than another Money amount
   * @param {IMoney} other - The amount to compare
   * @returns {boolean} True if this amount is less
   * @throws {Error} If currencies don't match or if other is not a Money instance
   */
  isLessThan(other: IMoney): boolean {
    this.assertSameCurrency(other);
    this.assertIsMoney(other);
    
    const compareScale = Math.max(this.scale, other.scale);
    const thisScaled = this.convertToScale(compareScale);
    const otherScaled = this.convertMoneyToScale(other, compareScale);
    
    return thisScaled < otherScaled;
  }

  /**
   * Check if less than or equal to another Money amount
   * @param {IMoney} other - The amount to compare
   * @returns {boolean} True if this amount is less or equal
   * @throws {Error} If currencies don't match or if other is not a Money instance
   */
  isLessThanOrEqual(other: IMoney): boolean {
    this.assertSameCurrency(other);
    this.assertIsMoney(other);
    
    const compareScale = Math.max(this.scale, other.scale);
    const thisScaled = this.convertToScale(compareScale);
    const otherScaled = this.convertMoneyToScale(other, compareScale);
    
    return thisScaled <= otherScaled;
  }

  /**
   * Check if the amount is zero
   * @returns {boolean} True if amount is zero
   */
  isZero(): boolean {
    return this.minorUnits === 0n;
  }

  /**
   * Check if the amount is positive
   * @returns {boolean} True if amount is positive
   */
  isPositive(): boolean {
    return this.minorUnits > 0n;
  }

  /**
   * Check if the amount is negative
   * @returns {boolean} True if amount is negative
   */
  isNegative(): boolean {
    return this.minorUnits < 0n;
  }

  /**
   * Convert to a regular number (rounded to display scale)
   * @returns {number} The amount as a number with display precision
   */
  toNumber(): number {
    const internal = this.getInternalAmount();
    const factor = Math.pow(10, this.displayScale);
    return Math.round(internal * factor) / factor;
  }

  /**
   * Convert to string representation
   * @returns {string} String representation of the amount
   */
  toString(): string {
    return `${this.currency} ${this.toNumber().toFixed(this.displayScale)}`;
  }

  /**
   * Format the amount for display
   * @param {string} locale - The locale for formatting (default: 'en-US')
   * @returns {string} Formatted money string
   */
  format(locale: string = 'en-US'): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: this.currency,
        minimumFractionDigits: this.displayScale,
        maximumFractionDigits: this.displayScale
      }).format(this.toNumber());
    } catch (error) {
      // Fallback for unsupported locales or currencies
      const config = CURRENCY_CONFIG[this.currency];
      const symbol = config ? config.symbol : this.currency;
      return `${symbol}${this.toNumber().toFixed(this.displayScale)}`;
    }
  }

  /**
   * Convert to JSON representation
   * @returns {IMoneyJSON} JSON representation
   */
  toJSON(): IMoneyJSON {
    return {
      amount: this.getInternalAmount(), // Use internal precision for serialization
      currency: this.currency
    };
  }

  /**
   * Assert that currencies match
   * @private
   * @throws {Error} If currencies don't match
   */
  private assertSameCurrency(other: IMoney): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: Cannot perform operation between ${this.currency} and ${other.currency}`
      );
    }
  }

  /**
   * Assert that the other value is a Money instance
   * @private
   * @throws {Error} If other is not a Money instance
   */
  private assertIsMoney(other: IMoney): asserts other is Money {
    if (!Money.isMoney(other)) {
      throw new Error(
        'Invalid operation: The provided value must be a Money instance'
      );
    }
  }

  /**
   * Create a Money instance from cents
   * @static
   * @param {number} cents - Amount in cents
   * @param {CurrencyCode} currency - Currency code (default: 'USD')
   * @returns {Money} New Money instance
   */
  static fromCents(cents: number, currency: CurrencyCode = 'USD'): Money {
    return new Money(cents / 100, currency);
  }

  /**
   * Create a Money instance from amount
   * @static
   * @param {number} amount - The amount
   * @param {CurrencyCode} currency - Currency code (default: 'USD')
   * @returns {Money} New Money instance
   */
  static fromAmount(amount: number, currency: CurrencyCode = 'USD'): Money {
    return new Money(amount, currency);
  }

  /**
   * Create a Money instance from string
   * @static
   * @param {string} value - String representation of amount
   * @param {CurrencyCode} currency - Currency code (default: 'USD')
   * @returns {Money} New Money instance
   */
  static fromString(value: string, currency: CurrencyCode = 'USD'): Money {
    return new Money(value, currency);
  }

  /**
   * Create a zero Money instance
   * @static
   * @param {CurrencyCode} currency - Currency code (default: 'USD')
   * @returns {Money} New Money instance with zero amount
   */
  static zero(currency: CurrencyCode = 'USD'): Money {
    return new Money(0, currency);
  }

  /**
   * Create a Money instance (alias for constructor)
   * @static
   * @param {number | string} amount - The amount
   * @param {CurrencyCode} currency - Currency code (default: 'USD')
   * @returns {Money} New Money instance
   */
  static of(amount: number | string, currency: CurrencyCode = 'USD'): Money {
    return new Money(amount, currency);
  }

  /**
   * Check if a value is a Money instance
   * @static
   * @param {any} value - Value to check
   * @returns {boolean} True if value is a Money instance
   */
  static isMoney(value: any): value is Money {
    return value instanceof Money;
  }

  /**
   * Sum an array of Money values
   * @static
   * @param {Money[]} moneyArray - Array of Money instances
   * @param {CurrencyCode} defaultCurrency - Default currency if array is empty
   * @returns {Money} Sum of all Money values
   * @throws {Error} If currencies don't match
   */
  static sum(moneyArray: Money[], defaultCurrency: CurrencyCode = 'USD'): Money {
    if (moneyArray.length === 0) {
      return Money.zero(defaultCurrency);
    }
    
    return moneyArray.reduce((sum, money) => sum.add(money));
  }
}

export default Money;
