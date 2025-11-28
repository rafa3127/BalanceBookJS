/**
 * Utility functions for Money operations
 * Provides convenient methods for common monetary calculations
 */

import { Money } from './Money.ts';
import { CurrencyCode } from '../../types/money.types.ts';

/**
 * MoneyUtils class providing static helper methods for Money operations
 */
export class MoneyUtils {
  /**
   * Sum an array of numbers and return a Money instance
   * @param {number[]} amounts - Array of numeric amounts
   * @param {CurrencyCode} currency - Currency code (default: 'USD')
   * @returns {Money} Sum as Money instance
   */
  static sumNumbers(amounts: number[], currency: CurrencyCode = 'USD'): Money {
    if (amounts.length === 0) {
      return Money.zero(currency);
    }
    
    // Use Money internally for precision
    let result = Money.zero(currency);
    for (const amount of amounts) {
      result = result.add(new Money(amount, currency));
    }
    return result;
  }

  /**
   * Sum an array of Money instances
   * @param {Money[]} moneyArray - Array of Money instances
   * @returns {Money} Sum of all Money values
   * @throws {Error} If currencies don't match
   */
  static sum(moneyArray: Money[]): Money {
    if (moneyArray.length === 0) {
      return Money.zero();
    }
    
    return moneyArray.reduce((sum, money) => sum.add(money));
  }

  /**
   * Calculate the average of Money values
   * @param {Money[]} moneyArray - Array of Money instances
   * @returns {Money} Average value
   * @throws {Error} If array is empty or currencies don't match
   */
  static average(moneyArray: Money[]): Money {
    if (moneyArray.length === 0) {
      throw new Error('Cannot calculate average of empty array');
    }
    
    const sum = MoneyUtils.sum(moneyArray);
    return sum.divide(moneyArray.length);
  }

  /**
   * Find the minimum Money value
   * @param {Money[]} moneyArray - Array of Money instances
   * @returns {Money} Minimum value
   * @throws {Error} If array is empty or currencies don't match
   */
  static min(moneyArray: Money[]): Money {
    if (moneyArray.length === 0) {
      throw new Error('Cannot find minimum of empty array');
    }
    
    return moneyArray.reduce((min, money) => 
      money.isLessThan(min) ? money : min
    );
  }

  /**
   * Find the maximum Money value
   * @param {Money[]} moneyArray - Array of Money instances
   * @returns {Money} Maximum value
   * @throws {Error} If array is empty or currencies don't match
   */
  static max(moneyArray: Money[]): Money {
    if (moneyArray.length === 0) {
      throw new Error('Cannot find maximum of empty array');
    }
    
    return moneyArray.reduce((max, money) => 
      money.isGreaterThan(max) ? money : max
    );
  }

  /**
   * Distribute an amount evenly, handling remainder
   * @param {Money} amount - Amount to distribute
   * @param {number} n - Number of parts
   * @returns {Money[]} Array of Money instances
   * @throws {Error} If n is less than 1
   */
  static distribute(amount: Money, n: number): Money[] {
    if (n < 1) {
      throw new Error('Cannot distribute to less than 1 part');
    }
    
    if (n === 1) {
      return [amount];
    }
    
    const results: Money[] = [];
    
    // Convert to display units (e.g., cents for USD)
    const displayScale = amount.displayScale;
    const displayFactor = Math.pow(10, displayScale);
    const totalDisplayUnits = Math.round(amount.getInternalAmount() * displayFactor);
    
    // Calculate base amount per part in display units
    const baseDisplayUnits = Math.floor(totalDisplayUnits / n);
    const remainderDisplayUnits = totalDisplayUnits - (baseDisplayUnits * n);
    
    // Distribute base amount to all parts
    for (let i = 0; i < n; i++) {
      // Add 1 display unit to the first 'remainder' parts
      const extraUnit = i < remainderDisplayUnits ? 1 : 0;
      const partDisplayUnits = baseDisplayUnits + extraUnit;
      
      // Convert back to major units (dollars)
      const partAmount = partDisplayUnits / displayFactor;
      
      // Create a Money instance with the calculated amount
      const part = new Money(partAmount, amount.currency);
      results.push(part);
    }
    
    return results;
  }

  /**
   * Apply a percentage to a Money amount
   * @param {Money} amount - Base amount
   * @param {number} percentage - Percentage (e.g., 10 for 10%)
   * @returns {Money} Calculated percentage amount
   */
  static percentage(amount: Money, percentage: number): Money {
    return amount.multiply(percentage / 100);
  }

  /**
   * Calculate tax amount
   * @param {Money} amount - Base amount
   * @param {number} taxRate - Tax rate as percentage (e.g., 8.5 for 8.5%)
   * @returns {Money} Tax amount
   */
  static calculateTax(amount: Money, taxRate: number): Money {
    return MoneyUtils.percentage(amount, taxRate);
  }

  /**
   * Calculate total with tax
   * @param {Money} amount - Base amount
   * @param {number} taxRate - Tax rate as percentage
   * @returns {{ total: Money, tax: Money }} Object with total and tax amounts
   */
  static calculateWithTax(amount: Money, taxRate: number): { total: Money, tax: Money } {
    const tax = MoneyUtils.calculateTax(amount, taxRate);
    const total = amount.add(tax);
    return { total, tax };
  }

  /**
   * Calculate discount amount
   * @param {Money} amount - Original amount
   * @param {number} discountPercentage - Discount percentage
   * @returns {Money} Discount amount
   */
  static calculateDiscount(amount: Money, discountPercentage: number): Money {
    return MoneyUtils.percentage(amount, discountPercentage);
  }

  /**
   * Apply discount to amount
   * @param {Money} amount - Original amount
   * @param {number} discountPercentage - Discount percentage
   * @returns {{ final: Money, discount: Money }} Final amount and discount
   */
  static applyDiscount(amount: Money, discountPercentage: number): { final: Money, discount: Money } {
    const discount = MoneyUtils.calculateDiscount(amount, discountPercentage);
    const final = amount.subtract(discount);
    return { final, discount };
  }

  /**
   * Convert array of numbers to array of Money instances
   * @param {number[]} amounts - Array of numbers
   * @param {CurrencyCode} currency - Currency code
   * @returns {Money[]} Array of Money instances
   */
  static toMoneyArray(amounts: number[], currency: CurrencyCode = 'USD'): Money[] {
    return amounts.map(amount => new Money(amount, currency));
  }

  /**
   * Convert array of Money instances to array of numbers
   * @param {Money[]} moneyArray - Array of Money instances
   * @returns {number[]} Array of numbers
   */
  static toNumberArray(moneyArray: Money[]): number[] {
    return moneyArray.map(money => money.toNumber());
  }

  /**
   * Check if all Money instances have the same currency
   * @param {Money[]} moneyArray - Array of Money instances
   * @returns {boolean} True if all have same currency
   */
  static haveSameCurrency(moneyArray: Money[]): boolean {
    if (moneyArray.length <= 1) {
      return true;
    }
    
    const firstCurrency = moneyArray[0]?.currency;
    return moneyArray.every(money => money.currency === firstCurrency);
  }

  /**
   * Parse a money string (e.g., "$100.50" or "EUR 99.99")
   * @param {string} moneyString - String to parse
   * @param {CurrencyCode} defaultCurrency - Default currency if not detected
   * @returns {Money} Parsed Money instance
   */
  static parse(moneyString: string, defaultCurrency: CurrencyCode = 'USD'): Money {
    // Remove common currency symbols and whitespace
    const cleanString = moneyString.replace(/[$€£¥,\s]/g, '');
    
    // Try to detect currency code (e.g., "USD 100" or "100 EUR")
    const currencyMatch = moneyString.match(/([A-Z]{3})/);
    const currency = currencyMatch ? currencyMatch[1] as CurrencyCode : defaultCurrency;
    
    // Extract numeric value
    const numericMatch = cleanString.match(/[\d.]+/);
    if (!numericMatch) {
      throw new Error(`Cannot parse money string: ${moneyString}`);
    }
    
    const amount = parseFloat(numericMatch[0]);
    return new Money(amount, currency);
  }

  /**
   * Round Money to specified decimal places
   * @param {Money} money - Money to round
   * @param {number} decimals - Number of decimal places
   * @returns {Money} Rounded Money instance
   */
  static round(money: Money, decimals: number): Money {
    const factor = Math.pow(10, decimals);
    const rounded = Math.round(money.toNumber() * factor) / factor;
    return new Money(rounded, money.currency);
  }
}

export default MoneyUtils;
