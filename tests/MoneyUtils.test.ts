import { Money } from '../src/classes/value-objects/Money';
import { MoneyUtils } from '../src/classes/value-objects/MoneyUtils';

describe('MoneyUtils class', () => {
  describe('sumNumbers', () => {
    test('should sum array of numbers with precision', () => {
      const amounts = [0.1, 0.2, 0.3];
      const result = MoneyUtils.sumNumbers(amounts);
      expect(result.toNumber()).toBe(0.6); // Exact, no floating point error
    });

    test('should handle empty array', () => {
      const result = MoneyUtils.sumNumbers([]);
      expect(result.toNumber()).toBe(0);
      expect(result.isZero()).toBe(true);
    });

    test('should handle negative numbers', () => {
      const amounts = [100, -30, 20];
      const result = MoneyUtils.sumNumbers(amounts);
      expect(result.toNumber()).toBe(90);
    });

    test('should use specified currency', () => {
      const amounts = [10, 20, 30];
      const result = MoneyUtils.sumNumbers(amounts, 'EUR');
      expect(result.currency).toBe('EUR');
      expect(result.toNumber()).toBe(60);
    });

    test('should handle single element array', () => {
      const result = MoneyUtils.sumNumbers([42.42]);
      expect(result.toNumber()).toBe(42.42);
    });
  });

  describe('sum', () => {
    test('should sum array of Money instances', () => {
      const moneyArray = [
        new Money(100),
        new Money(50),
        new Money(25.50)
      ];
      const result = MoneyUtils.sum(moneyArray);
      expect(result.toNumber()).toBe(175.50);
    });

    test('should return zero for empty array', () => {
      const result = MoneyUtils.sum([]);
      expect(result.toNumber()).toBe(0);
      expect(result.currency).toBe('USD');
    });

    test('should throw error for mixed currencies', () => {
      const moneyArray = [
        new Money(100, 'USD'),
        new Money(50, 'EUR')
      ];
      expect(() => MoneyUtils.sum(moneyArray)).toThrow('Currency mismatch');
    });

    test('should maintain precision through sum', () => {
      const moneyArray = Array(10).fill(null).map(() => new Money(0.1));
      const result = MoneyUtils.sum(moneyArray);
      expect(result.toNumber()).toBe(1); // Exact
    });
  });

  describe('average', () => {
    test('should calculate average correctly', () => {
      const moneyArray = [
        new Money(100),
        new Money(200),
        new Money(300)
      ];
      const result = MoneyUtils.average(moneyArray);
      expect(result.toNumber()).toBe(200);
    });

    test('should throw error for empty array', () => {
      expect(() => MoneyUtils.average([])).toThrow('Cannot calculate average of empty array');
    });

    test('should handle single element', () => {
      const result = MoneyUtils.average([new Money(42)]);
      expect(result.toNumber()).toBe(42);
    });

    test('should handle decimals in average', () => {
      const moneyArray = [
        new Money(10),
        new Money(20),
        new Money(25)
      ];
      const result = MoneyUtils.average(moneyArray);
      // Average of 55/3 = 18.333...
      // With capped scale, should round properly
      expect(result.toNumber()).toBeCloseTo(18.33, 2);
    });

    test('should throw error for mixed currencies', () => {
      const moneyArray = [
        new Money(100, 'USD'),
        new Money(100, 'EUR')
      ];
      expect(() => MoneyUtils.average(moneyArray)).toThrow('Currency mismatch');
    });
  });

  describe('min', () => {
    test('should find minimum value', () => {
      const moneyArray = [
        new Money(100),
        new Money(50),
        new Money(200)
      ];
      const result = MoneyUtils.min(moneyArray);
      expect(result.toNumber()).toBe(50);
    });

    test('should throw error for empty array', () => {
      expect(() => MoneyUtils.min([])).toThrow('Cannot find minimum of empty array');
    });

    test('should handle single element', () => {
      const result = MoneyUtils.min([new Money(42)]);
      expect(result.toNumber()).toBe(42);
    });

    test('should handle negative amounts', () => {
      const moneyArray = [
        new Money(-100),
        new Money(0),
        new Money(50)
      ];
      const result = MoneyUtils.min(moneyArray);
      expect(result.toNumber()).toBe(-100);
    });

    test('should handle equal amounts', () => {
      const moneyArray = [
        new Money(100),
        new Money(100),
        new Money(100)
      ];
      const result = MoneyUtils.min(moneyArray);
      expect(result.toNumber()).toBe(100);
    });
  });

  describe('max', () => {
    test('should find maximum value', () => {
      const moneyArray = [
        new Money(100),
        new Money(50),
        new Money(200)
      ];
      const result = MoneyUtils.max(moneyArray);
      expect(result.toNumber()).toBe(200);
    });

    test('should throw error for empty array', () => {
      expect(() => MoneyUtils.max([])).toThrow('Cannot find maximum of empty array');
    });

    test('should handle single element', () => {
      const result = MoneyUtils.max([new Money(42)]);
      expect(result.toNumber()).toBe(42);
    });

    test('should handle negative amounts', () => {
      const moneyArray = [
        new Money(-100),
        new Money(-50),
        new Money(-200)
      ];
      const result = MoneyUtils.max(moneyArray);
      expect(result.toNumber()).toBe(-50);
    });
  });

  describe('distribute', () => {
    test('should distribute evenly when possible', () => {
      const amount = new Money(100);
      const parts = MoneyUtils.distribute(amount, 4);
      
      expect(parts.length).toBe(4);
      parts.forEach(part => {
        expect(part.toNumber()).toBe(25);
      });
    });

    test('should handle remainder correctly', () => {
      const amount = new Money(100);
      const parts = MoneyUtils.distribute(amount, 3);
      
      expect(parts.length).toBe(3);
      
      // Verify total is exactly preserved
      const total = MoneyUtils.sum(parts);
      expect(total.toNumber()).toBe(100);
      expect(total.getInternalAmount()).toBe(100);
      
      // When dividing 100 by 3, we expect the remainder to be distributed
      // 100 cents / 3 = 33 cents each with 1 cent remainder
      // So one part gets 34 cents, two get 33 cents
      const values = parts.map(p => p.toNumber()).sort();
      expect(values[0]).toBe(33.33);
      expect(values[1]).toBe(33.33);
      expect(values[2]).toBe(33.34);
    });

    test('should throw error for invalid n', () => {
      const amount = new Money(100);
      expect(() => MoneyUtils.distribute(amount, 0)).toThrow('Cannot distribute to less than 1 part');
      expect(() => MoneyUtils.distribute(amount, -1)).toThrow('Cannot distribute to less than 1 part');
    });

    test('should handle single distribution', () => {
      const amount = new Money(100);
      const parts = MoneyUtils.distribute(amount, 1);
      expect(parts.length).toBe(1);
      expect(parts[0]?.toNumber()).toBe(100);
    });

    test('should handle zero amount distribution', () => {
      const amount = new Money(0);
      const parts = MoneyUtils.distribute(amount, 3);
      parts.forEach(part => {
        expect(part.toNumber()).toBe(0);
      });
    });
  });

  describe('percentage', () => {
    test('should calculate percentage correctly', () => {
      const amount = new Money(100);
      const result = MoneyUtils.percentage(amount, 10);
      expect(result.toNumber()).toBe(10);
    });

    test('should handle decimal percentages', () => {
      const amount = new Money(100);
      const result = MoneyUtils.percentage(amount, 8.5);
      expect(result.toNumber()).toBe(8.5);
    });

    test('should handle zero percentage', () => {
      const amount = new Money(100);
      const result = MoneyUtils.percentage(amount, 0);
      expect(result.toNumber()).toBe(0);
    });

    test('should handle percentage over 100', () => {
      const amount = new Money(100);
      const result = MoneyUtils.percentage(amount, 150);
      expect(result.toNumber()).toBe(150);
    });

    test('should maintain currency', () => {
      const amount = new Money(100, 'EUR');
      const result = MoneyUtils.percentage(amount, 10);
      expect(result.currency).toBe('EUR');
    });
  });

  describe('calculateTax', () => {
    test('should calculate tax amount', () => {
      const amount = new Money(100);
      const tax = MoneyUtils.calculateTax(amount, 8.5);
      expect(tax.toNumber()).toBe(8.5);
    });

    test('should handle zero tax rate', () => {
      const amount = new Money(100);
      const tax = MoneyUtils.calculateTax(amount, 0);
      expect(tax.toNumber()).toBe(0);
    });

    test('should maintain precision in tax calculation', () => {
      const amount = new Money(99.99);
      const tax = MoneyUtils.calculateTax(amount, 7.25);
      expect(tax.toNumber()).toBeCloseTo(7.25, 2);
    });
  });

  describe('calculateWithTax', () => {
    test('should calculate total and tax amounts', () => {
      const amount = new Money(100);
      const result = MoneyUtils.calculateWithTax(amount, 10);
      
      expect(result.total.toNumber()).toBe(110);
      expect(result.tax.toNumber()).toBe(10);
    });

    test('should handle complex tax rates', () => {
      const amount = new Money(99.99);
      const result = MoneyUtils.calculateWithTax(amount, 8.875);
      
      expect(result.tax.toNumber()).toBeCloseTo(8.87, 2);
      expect(result.total.toNumber()).toBeCloseTo(108.86, 2);
    });

    test('should maintain currency', () => {
      const amount = new Money(100, 'GBP');
      const result = MoneyUtils.calculateWithTax(amount, 20);
      
      expect(result.total.currency).toBe('GBP');
      expect(result.tax.currency).toBe('GBP');
    });
  });

  describe('calculateDiscount', () => {
    test('should calculate discount amount', () => {
      const amount = new Money(100);
      const discount = MoneyUtils.calculateDiscount(amount, 20);
      expect(discount.toNumber()).toBe(20);
    });

    test('should handle decimal discount percentages', () => {
      const amount = new Money(100);
      const discount = MoneyUtils.calculateDiscount(amount, 12.5);
      expect(discount.toNumber()).toBe(12.5);
    });

    test('should handle zero discount', () => {
      const amount = new Money(100);
      const discount = MoneyUtils.calculateDiscount(amount, 0);
      expect(discount.toNumber()).toBe(0);
    });

    test('should handle 100% discount', () => {
      const amount = new Money(100);
      const discount = MoneyUtils.calculateDiscount(amount, 100);
      expect(discount.toNumber()).toBe(100);
    });
  });

  describe('applyDiscount', () => {
    test('should apply discount correctly', () => {
      const amount = new Money(100);
      const result = MoneyUtils.applyDiscount(amount, 20);
      
      expect(result.final.toNumber()).toBe(80);
      expect(result.discount.toNumber()).toBe(20);
    });

    test('should handle complex discount percentages', () => {
      const amount = new Money(99.99);
      const result = MoneyUtils.applyDiscount(amount, 33.33);
      
      expect(result.discount.toNumber()).toBeCloseTo(33.33, 2);
      expect(result.final.toNumber()).toBeCloseTo(66.66, 2);
    });

    test('should maintain currency', () => {
      const amount = new Money(100, 'EUR');
      const result = MoneyUtils.applyDiscount(amount, 15);
      
      expect(result.final.currency).toBe('EUR');
      expect(result.discount.currency).toBe('EUR');
    });
  });

  describe('toMoneyArray', () => {
    test('should convert number array to Money array', () => {
      const numbers = [100, 50.50, 25.25];
      const moneyArray = MoneyUtils.toMoneyArray(numbers);
      
      expect(moneyArray.length).toBe(3);
      expect(moneyArray[0]?.toNumber()).toBe(100);
      expect(moneyArray[1]?.toNumber()).toBe(50.50);
      expect(moneyArray[2]?.toNumber()).toBe(25.25);
    });

    test('should use specified currency', () => {
      const numbers = [100, 200];
      const moneyArray = MoneyUtils.toMoneyArray(numbers, 'EUR');
      
      moneyArray.forEach(money => {
        expect(money.currency).toBe('EUR');
      });
    });

    test('should handle empty array', () => {
      const moneyArray = MoneyUtils.toMoneyArray([]);
      expect(moneyArray.length).toBe(0);
    });
  });

  describe('toNumberArray', () => {
    test('should convert Money array to number array', () => {
      const moneyArray = [
        new Money(100),
        new Money(50.50),
        new Money(25.25)
      ];
      const numbers = MoneyUtils.toNumberArray(moneyArray);
      
      expect(numbers).toEqual([100, 50.50, 25.25]);
    });

    test('should handle empty array', () => {
      const numbers = MoneyUtils.toNumberArray([]);
      expect(numbers).toEqual([]);
    });
  });

  describe('haveSameCurrency', () => {
    test('should return true for same currencies', () => {
      const moneyArray = [
        new Money(100, 'USD'),
        new Money(200, 'USD'),
        new Money(300, 'USD')
      ];
      expect(MoneyUtils.haveSameCurrency(moneyArray)).toBe(true);
    });

    test('should return false for mixed currencies', () => {
      const moneyArray = [
        new Money(100, 'USD'),
        new Money(200, 'EUR'),
        new Money(300, 'USD')
      ];
      expect(MoneyUtils.haveSameCurrency(moneyArray)).toBe(false);
    });

    test('should return true for empty array', () => {
      expect(MoneyUtils.haveSameCurrency([])).toBe(true);
    });

    test('should return true for single element', () => {
      expect(MoneyUtils.haveSameCurrency([new Money(100)])).toBe(true);
    });
  });

  describe('parse', () => {
    test('should parse simple number string', () => {
      const money = MoneyUtils.parse('100.50');
      expect(money.toNumber()).toBe(100.5);
    });

    test('should parse with dollar sign', () => {
      const money = MoneyUtils.parse('$100.50');
      expect(money.toNumber()).toBe(100.5);
    });

    test('should parse with euro sign', () => {
      const money = MoneyUtils.parse('€100.50');
      expect(money.toNumber()).toBe(100.5);
    });

    test('should parse with currency code prefix', () => {
      const money = MoneyUtils.parse('EUR 100.50');
      expect(money.toNumber()).toBe(100.5);
      expect(money.currency).toBe('EUR');
    });

    test('should parse with currency code suffix', () => {
      const money = MoneyUtils.parse('100.50 GBP');
      expect(money.toNumber()).toBe(100.5);
      expect(money.currency).toBe('GBP');
    });

    test('should parse with commas', () => {
      const money = MoneyUtils.parse('$1,234.56');
      expect(money.toNumber()).toBe(1234.56);
    });

    test('should use default currency when not detected', () => {
      const money = MoneyUtils.parse('100.50', 'EUR');
      expect(money.currency).toBe('EUR');
    });

    test('should throw error for invalid string', () => {
      expect(() => MoneyUtils.parse('invalid')).toThrow('Cannot parse money string: invalid');
    });

    test('should handle whitespace', () => {
      const money = MoneyUtils.parse('  $  100.50  ');
      expect(money.toNumber()).toBe(100.5);
    });
  });

  describe('round', () => {
    test('should round to specified decimal places', () => {
      const money = new Money(100.456);
      const rounded = MoneyUtils.round(money, 2);
      expect(rounded.toNumber()).toBe(100.46);
    });

    test('should round down when appropriate', () => {
      const money = new Money(100.444);
      const rounded = MoneyUtils.round(money, 2);
      expect(rounded.toNumber()).toBe(100.44);
    });

    test('should round to zero decimal places', () => {
      const money = new Money(100.6);
      const rounded = MoneyUtils.round(money, 0);
      expect(rounded.toNumber()).toBe(101);
    });

    test('should maintain currency', () => {
      const money = new Money(100.456, 'EUR');
      const rounded = MoneyUtils.round(money, 2);
      expect(rounded.currency).toBe('EUR');
    });

    test('should handle negative amounts', () => {
      const money = new Money(-100.456);
      const rounded = MoneyUtils.round(money, 2);
      expect(rounded.toNumber()).toBe(-100.46);
    });
  });

  describe('Integration scenarios', () => {
    test('should handle shopping cart calculation', () => {
      // Items in cart
      const items = [
        new Money(29.99),  // Item 1
        new Money(45.50),  // Item 2
        new Money(12.99)   // Item 3
      ];
      
      // Calculate subtotal
      const subtotal = MoneyUtils.sum(items);
      expect(subtotal.toNumber()).toBe(88.48);
      
      // Apply discount
      const discountResult = MoneyUtils.applyDiscount(subtotal, 10);
      expect(discountResult.final.toNumber()).toBeCloseTo(79.63, 2);
      
      // Calculate tax on discounted amount
      const taxResult = MoneyUtils.calculateWithTax(discountResult.final, 8.5);
      expect(taxResult.total.toNumber()).toBeCloseTo(86.40, 2);
    });

    test('should handle salary distribution', () => {
      const totalBudget = new Money(100000);
      
      // Distribute among 3 employees
      const salaries = MoneyUtils.distribute(totalBudget, 3);
      
      // Verify no money is lost
      const total = MoneyUtils.sum(salaries);
      expect(total.equals(totalBudget)).toBe(true);
      
      // Calculate tax for each
      const afterTax = salaries.map(salary => 
        MoneyUtils.calculateWithTax(salary, 25).total
      );
      
      // Verify all have same currency
      expect(MoneyUtils.haveSameCurrency(afterTax)).toBe(true);
    });

    test('should handle invoice calculations', () => {
      // Line items
      const lineItems = [
        new Money(100).multiply(5),  // 5 units at $100
        new Money(50).multiply(10),  // 10 units at $50
        new Money(25).multiply(20)   // 20 units at $25
      ];
      
      const subtotal = MoneyUtils.sum(lineItems);
      expect(subtotal.toNumber()).toBe(1500);
      
      // Apply bulk discount
      const discounted = MoneyUtils.applyDiscount(subtotal, 5);
      
      // Add tax
      const final = MoneyUtils.calculateWithTax(discounted.final, 10);
      
      expect(final.total.toNumber()).toBe(1567.5);
    });
  });
});
