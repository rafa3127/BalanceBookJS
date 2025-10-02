import { Money } from '../src/classes/value-objects/Money';
import { MoneyUtils } from '../src/classes/value-objects/MoneyUtils';

describe('Money class', () => {
  describe('Constructor', () => {
    test('should create Money with default USD currency', () => {
      const money = new Money(100);
      expect(money.toNumber()).toBe(100);
      expect(money.currency).toBe('USD');
    });

    test('should create Money with specified currency', () => {
      const money = new Money(100, 'EUR');
      expect(money.toNumber()).toBe(100);
      expect(money.currency).toBe('EUR');
    });

    test('should create Money from string amount', () => {
      const money = new Money('100.50');
      expect(money.toNumber()).toBe(100.5);
    });

    test('should handle zero amount', () => {
      const money = new Money(0);
      expect(money.toNumber()).toBe(0);
      expect(money.isZero()).toBe(true);
    });

    test('should handle negative amounts', () => {
      const money = new Money(-100);
      expect(money.toNumber()).toBe(-100);
      expect(money.isNegative()).toBe(true);
    });

    test('should throw error for invalid string amount', () => {
      expect(() => new Money('invalid')).toThrow('Invalid amount: invalid');
    });

    test('should handle large numbers within safe limits', () => {
      // With internal scale 6, max safe value is ~9 billion
      const money = new Money(9000000000);
      expect(money.toNumber()).toBe(9000000000);
    });
    
    test('should throw error for numbers exceeding safe limits', () => {
      // 999,999,999,999.99 exceeds the safe limit for scale 6
      expect(() => new Money(999999999999.99)).toThrow(/exceeds the maximum safe value/);
    });

    test('should handle very small decimal numbers', () => {
      const money = new Money(0.01);
      expect(money.toNumber()).toBe(0.01);
    });

    test('should handle currencies with different decimal places', () => {
      const jpy = new Money(100, 'JPY'); // JPY has 0 decimal places
      expect(jpy.currency).toBe('JPY');
      // Internal scale is higher for precision, but display should respect currency
      expect(jpy.scale).toBeGreaterThanOrEqual(6); // Internal precision
      expect(jpy.toNumber()).toBe(100); // Display respects currency decimals
      expect(jpy.toString()).toBe('JPY 100'); // No decimal places in display
    });
  });

  describe('Arithmetic operations', () => {
    describe('Addition', () => {
      test('should add two Money amounts correctly', () => {
        const money1 = new Money(100);
        const money2 = new Money(50);
        const result = money1.add(money2);
        expect(result.toNumber()).toBe(150);
      });

      test('should handle floating point precision correctly', () => {
        const money1 = new Money(0.1);
        const money2 = new Money(0.2);
        const result = money1.add(money2);
        expect(result.toNumber()).toBe(0.3); // Exact, no floating point error!
      });

      test('should throw error when adding different currencies', () => {
        const usd = new Money(100, 'USD');
        const eur = new Money(50, 'EUR');
        expect(() => usd.add(eur)).toThrow('Currency mismatch: Cannot perform operation between USD and EUR');
      });

      test('should throw error when adding non-Money object', () => {
        const money = new Money(100);
        const fakeMoney = {
          currency: 'USD',
          amount: 50,
          toNumber: () => 50
        } as any;
        expect(() => money.add(fakeMoney)).toThrow('Invalid operation: The provided value must be a Money instance');
      });

      test('should maintain immutability', () => {
        const money1 = new Money(100);
        const money2 = new Money(50);
        const result = money1.add(money2);
        expect(money1.toNumber()).toBe(100); // Original unchanged
        expect(result.toNumber()).toBe(150);
      });

      test('should handle negative amounts in addition', () => {
        const money1 = new Money(100);
        const money2 = new Money(-30);
        const result = money1.add(money2);
        expect(result.toNumber()).toBe(70);
      });
    });

    describe('Subtraction', () => {
      test('should subtract two Money amounts correctly', () => {
        const money1 = new Money(100);
        const money2 = new Money(30);
        const result = money1.subtract(money2);
        expect(result.toNumber()).toBe(70);
      });

      test('should handle result becoming negative', () => {
        const money1 = new Money(50);
        const money2 = new Money(100);
        const result = money1.subtract(money2);
        expect(result.toNumber()).toBe(-50);
        expect(result.isNegative()).toBe(true);
      });

      test('should throw error when subtracting different currencies', () => {
        const usd = new Money(100, 'USD');
        const eur = new Money(50, 'EUR');
        expect(() => usd.subtract(eur)).toThrow('Currency mismatch');
      });

      test('should handle floating point precision in subtraction', () => {
        const money1 = new Money(1);
        const money2 = new Money(0.9);
        const result = money1.subtract(money2);
        expect(result.toNumber()).toBe(0.1); // Exact!
      });

      test('should throw error when subtracting non-Money object', () => {
        const money = new Money(100);
        const fakeMoney = {
          currency: 'USD',
          amount: 50,
          toNumber: () => 50
        } as any;
        expect(() => money.subtract(fakeMoney)).toThrow('Invalid operation: The provided value must be a Money instance');
      });
    });

    describe('Multiplication', () => {
      test('should multiply by integer correctly', () => {
        const money = new Money(100);
        const result = money.multiply(3);
        expect(result.toNumber()).toBe(300);
      });

      test('should multiply by decimal correctly', () => {
        const money = new Money(100);
        const result = money.multiply(1.5);
        expect(result.toNumber()).toBe(150);
      });

      test('should handle percentage calculations precisely', () => {
        const money = new Money(100);
        const result = money.multiply(0.085); // 8.5%
        expect(result.getInternalAmount()).toBe(8.5); // Internal precision
        expect(result.toNumber()).toBe(8.50); // Display precision
      });

      test('should multiply by zero', () => {
        const money = new Money(100);
        const result = money.multiply(0);
        expect(result.toNumber()).toBe(0);
        expect(result.isZero()).toBe(true);
      });

      test('should handle negative multiplier', () => {
        const money = new Money(100);
        const result = money.multiply(-1);
        expect(result.toNumber()).toBe(-100);
      });
    });

    describe('Division', () => {
      test('should divide by integer correctly', () => {
        const money = new Money(100);
        const result = money.divide(2);
        expect(result.toNumber()).toBe(50);
      });

      test('should divide with remainder handling', () => {
        const money = new Money(100);
        const result = money.divide(3);
        // Result should be 33.33 when rounded to 2 decimals
        expect(result.toNumber()).toBeCloseTo(33.33, 2);
      });

      test('should throw error when dividing by zero', () => {
        const money = new Money(100);
        expect(() => money.divide(0)).toThrow('Division by zero');
      });

      test('should handle negative divisor', () => {
        const money = new Money(100);
        const result = money.divide(-2);
        expect(result.toNumber()).toBe(-50);
      });

      test('should handle division of negative amount', () => {
        const money = new Money(-100);
        const result = money.divide(2);
        expect(result.toNumber()).toBe(-50);
      });
    });

    describe('Negate', () => {
      test('should negate positive amount', () => {
        const money = new Money(100);
        const result = money.negate();
        expect(result.toNumber()).toBe(-100);
      });

      test('should negate negative amount', () => {
        const money = new Money(-100);
        const result = money.negate();
        expect(result.toNumber()).toBe(100);
      });

      test('should negate zero', () => {
        const money = new Money(0);
        const result = money.negate();
        expect(result.toNumber()).toBe(0);
        expect(result.isZero()).toBe(true);
      });
    });
  });

  describe('Comparison operations', () => {
    describe('Equals', () => {
      test('should return true for equal amounts and currencies', () => {
        const money1 = new Money(100, 'USD');
        const money2 = new Money(100, 'USD');
        expect(money1.equals(money2)).toBe(true);
      });

      test('should return false for different amounts', () => {
        const money1 = new Money(100);
        const money2 = new Money(200);
        expect(money1.equals(money2)).toBe(false);
      });

      test('should return false for different currencies', () => {
        const money1 = new Money(100, 'USD');
        const money2 = new Money(100, 'EUR');
        expect(money1.equals(money2)).toBe(false);
      });

      test('should handle floating point arithmetic correctly', () => {
        // In JavaScript, 0.1 + 0.2 = 0.30000000000000004
        // Money should handle this by storing each value with proper precision
        const money1 = new Money(0.1);
        const money2 = new Money(0.2);
        const money3 = new Money(0.3);
        
        // When we add 0.1 + 0.2 using Money, we should get exactly 0.3
        const result = money1.add(money2);
        expect(result.getInternalAmount()).toBe(0.3);
        expect(result.toNumber()).toBe(0.30);
        
        // The result of addition should equal a Money created with 0.3
        // They might have different scales but same value
        expect(result.getInternalAmount()).toBe(money3.getInternalAmount());
      });

      test('should compare internal amounts precisely', () => {
        const money1 = new Money(0.001);
        const money2 = new Money(0.002);
        expect(money1.equals(money2)).toBe(false); // Different internally
        
        // Even if they display the same
        expect(money1.toNumber()).toBe(0.00);
        expect(money2.toNumber()).toBe(0.00);
      });

      test('should return false when comparing with non-Money object', () => {
        const money = new Money(100);
        const fakeMoney = {
          currency: 'USD',
          amount: 100,
          toNumber: () => 100
        } as any;
        expect(money.equals(fakeMoney)).toBe(false);
      });

      test('should return false when comparing with null or undefined', () => {
        const money = new Money(100);
        expect(money.equals(null as any)).toBe(false);
        expect(money.equals(undefined as any)).toBe(false);
      });
    });

    describe('Greater than', () => {
      test('should return true when first is greater', () => {
        const money1 = new Money(100);
        const money2 = new Money(50);
        expect(money1.isGreaterThan(money2)).toBe(true);
      });

      test('should return false when first is smaller', () => {
        const money1 = new Money(50);
        const money2 = new Money(100);
        expect(money1.isGreaterThan(money2)).toBe(false);
      });

      test('should return false when amounts are equal', () => {
        const money1 = new Money(100);
        const money2 = new Money(100);
        expect(money1.isGreaterThan(money2)).toBe(false);
      });

      test('should throw error for different currencies', () => {
        const usd = new Money(100, 'USD');
        const eur = new Money(50, 'EUR');
        expect(() => usd.isGreaterThan(eur)).toThrow('Currency mismatch');
      });

      test('should throw error when comparing with non-Money object', () => {
        const money = new Money(100);
        const fakeMoney = {
          currency: 'USD',
          amount: 50,
          toNumber: () => 50
        } as any;
        expect(() => money.isGreaterThan(fakeMoney)).toThrow('Invalid operation: The provided value must be a Money instance');
      });
    });

    describe('Greater than or equal', () => {
      test('should return true when first is greater', () => {
        const money1 = new Money(100);
        const money2 = new Money(50);
        expect(money1.isGreaterThanOrEqual(money2)).toBe(true);
      });

      test('should return true when amounts are equal', () => {
        const money1 = new Money(100);
        const money2 = new Money(100);
        expect(money1.isGreaterThanOrEqual(money2)).toBe(true);
      });

      test('should return false when first is smaller', () => {
        const money1 = new Money(50);
        const money2 = new Money(100);
        expect(money1.isGreaterThanOrEqual(money2)).toBe(false);
      });
    });

    describe('Less than', () => {
      test('should return true when first is smaller', () => {
        const money1 = new Money(50);
        const money2 = new Money(100);
        expect(money1.isLessThan(money2)).toBe(true);
      });

      test('should return false when first is greater', () => {
        const money1 = new Money(100);
        const money2 = new Money(50);
        expect(money1.isLessThan(money2)).toBe(false);
      });

      test('should return false when amounts are equal', () => {
        const money1 = new Money(100);
        const money2 = new Money(100);
        expect(money1.isLessThan(money2)).toBe(false);
      });
    });

    describe('Less than or equal', () => {
      test('should return true when first is smaller', () => {
        const money1 = new Money(50);
        const money2 = new Money(100);
        expect(money1.isLessThanOrEqual(money2)).toBe(true);
      });

      test('should return true when amounts are equal', () => {
        const money1 = new Money(100);
        const money2 = new Money(100);
        expect(money1.isLessThanOrEqual(money2)).toBe(true);
      });

      test('should return false when first is greater', () => {
        const money1 = new Money(100);
        const money2 = new Money(50);
        expect(money1.isLessThanOrEqual(money2)).toBe(false);
      });
    });

    describe('State checks', () => {
      test('isZero should identify zero amounts', () => {
        expect(new Money(0).isZero()).toBe(true);
        expect(new Money(0.00).isZero()).toBe(true);
        expect(new Money(1).isZero()).toBe(false);
        expect(new Money(-1).isZero()).toBe(false);
      });

      test('isPositive should identify positive amounts', () => {
        expect(new Money(100).isPositive()).toBe(true);
        expect(new Money(0.01).isPositive()).toBe(true);
        expect(new Money(0).isPositive()).toBe(false);
        expect(new Money(-1).isPositive()).toBe(false);
      });

      test('isNegative should identify negative amounts', () => {
        expect(new Money(-100).isNegative()).toBe(true);
        expect(new Money(-0.01).isNegative()).toBe(true);
        expect(new Money(0).isNegative()).toBe(false);
        expect(new Money(1).isNegative()).toBe(false);
      });
    });
  });

  describe('Conversion and formatting', () => {
    test('toNumber should return numeric value', () => {
      const money = new Money(123.45);
      expect(money.toNumber()).toBe(123.45);
      expect(typeof money.toNumber()).toBe('number');
    });

    test('toString should return formatted string', () => {
      const money = new Money(100, 'USD');
      expect(money.toString()).toBe('USD 100.00');
    });

    test('toString should respect currency decimal places', () => {
      const jpy = new Money(100, 'JPY');
      expect(jpy.toString()).toBe('JPY 100');
    });

    test('format should use locale formatting', () => {
      const money = new Money(1234.56, 'USD');
      const formatted = money.format('en-US');
      expect(formatted).toContain('1,234.56');
    });

    test('format should handle different locales', () => {
      const money = new Money(1234.56, 'EUR');
      const formatted = money.format('de-DE');
      // German formatting uses comma as decimal separator
      expect(formatted).toMatch(/1\.234,56|1234,56/);
    });

    test('format should fallback for unsupported locales', () => {
      const money = new Money(100, 'USD');
      const formatted = money.format('invalid-locale');
      expect(formatted).toContain('100');
    });

    test('toJSON should return JSON representation', () => {
      const money = new Money(100.50, 'EUR');
      const json = money.toJSON();
      expect(json).toEqual({
        amount: 100.5,
        currency: 'EUR'
      });
    });
  });

  describe('Static factory methods', () => {
    test('fromCents should create Money from cents', () => {
      const money = Money.fromCents(1050);
      expect(money.toNumber()).toBe(10.5);
    });

    test('fromCents should handle currency', () => {
      const money = Money.fromCents(1050, 'EUR');
      expect(money.toNumber()).toBe(10.5);
      expect(money.currency).toBe('EUR');
    });

    test('fromAmount should create Money', () => {
      const money = Money.fromAmount(100.50);
      expect(money.toNumber()).toBe(100.5);
    });

    test('fromString should parse string amount', () => {
      const money = Money.fromString('100.50');
      expect(money.toNumber()).toBe(100.5);
    });

    test('zero should create zero Money', () => {
      const money = Money.zero();
      expect(money.toNumber()).toBe(0);
      expect(money.isZero()).toBe(true);
    });

    test('zero should accept currency', () => {
      const money = Money.zero('EUR');
      expect(money.currency).toBe('EUR');
      expect(money.isZero()).toBe(true);
    });

    test('of should create Money (alias for constructor)', () => {
      const money = Money.of(100, 'GBP');
      expect(money.toNumber()).toBe(100);
      expect(money.currency).toBe('GBP');
    });

    test('isMoney should identify Money instances', () => {
      const money = new Money(100);
      const notMoney = { amount: 100 };
      
      expect(Money.isMoney(money)).toBe(true);
      expect(Money.isMoney(notMoney)).toBe(false);
      expect(Money.isMoney(100)).toBe(false);
      expect(Money.isMoney(null)).toBe(false);
      expect(Money.isMoney(undefined)).toBe(false);
    });

    test('sum should sum array of Money', () => {
      const moneyArray = [
        new Money(100),
        new Money(50),
        new Money(25)
      ];
      const result = Money.sum(moneyArray);
      expect(result.toNumber()).toBe(175);
    });

    test('sum should return zero for empty array', () => {
      const result = Money.sum([]);
      expect(result.toNumber()).toBe(0);
      expect(result.currency).toBe('USD');
    });

    test('sum should use provided default currency for empty array', () => {
      const result = Money.sum([], 'EUR');
      expect(result.currency).toBe('EUR');
    });

    test('sum should throw error for mixed currencies', () => {
      const moneyArray = [
        new Money(100, 'USD'),
        new Money(50, 'EUR')
      ];
      expect(() => Money.sum(moneyArray)).toThrow('Currency mismatch');
    });
  });

  describe('Edge cases and precision', () => {
    test('should handle maximum safe value for scale', () => {
      // For scale 6, max safe value is ~9 billion
      const maxSafeForScale6 = 9_007_199_254;
      const money = new Money(maxSafeForScale6);
      expect(money.toNumber()).toBe(maxSafeForScale6);
    });
    
    test('should throw error for MAX_SAFE_INTEGER', () => {
      // MAX_SAFE_INTEGER exceeds safe limit for scale 6
      expect(() => new Money(Number.MAX_SAFE_INTEGER)).toThrow(/exceeds the maximum safe value/);
    });

    test('should handle small decimals with internal precision', () => {
      // Money maintains internal precision higher than display precision
      const money = new Money(0.001);
      const result = money.add(new Money(0.002));
      
      // Internal precision is maintained
      expect(result.getInternalAmount()).toBe(0.003);
      
      // Display rounds to currency precision (USD = 2 decimals)
      expect(result.toNumber()).toBe(0.00);
    });

    test('should accumulate small amounts correctly', () => {
      // Even though each amount rounds to 0.00 for display,
      // internal precision maintains the real values
      let total = new Money(0);
      for (let i = 0; i < 1000; i++) {
        total = total.add(new Money(0.001));
      }
      
      // Internal amount is precise
      expect(total.getInternalAmount()).toBe(1);
      // Display amount rounds correctly
      expect(total.toNumber()).toBe(1.00);
    });

    test('should handle complex arithmetic chains', () => {
      const money = new Money(100);
      const result = money
        .multiply(1.1)  // 110
        .add(new Money(15))  // 125
        .divide(5)  // 25
        .subtract(new Money(5));  // 20
      expect(result.toNumber()).toBe(20);
    });

    test('should maintain precision through multiple operations', () => {
      let result = new Money(0);
      for (let i = 0; i < 100; i++) {
        result = result.add(new Money(0.01));
      }
      expect(result.toNumber()).toBe(1); // Exactly 1, not 0.9999999999999999
      expect(result.getInternalAmount()).toBe(1); // Internal is also exact
    });

    test('should handle currency with zero decimal places correctly', () => {
      const jpy1 = new Money(100, 'JPY');
      const jpy2 = new Money(50, 'JPY');
      const result = jpy1.add(jpy2);
      expect(result.toNumber()).toBe(150);
      expect(result.toString()).toBe('JPY 150');
    });
  });

  describe('Currency configurations', () => {
    test('should handle known currencies', () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'MXN'];
      
      currencies.forEach(currency => {
        const money = new Money(100, currency);
        expect(money.currency).toBe(currency);
        expect(() => money.format()).not.toThrow();
      });
    });

    test('should default to 2 decimal places for unknown currencies', () => {
      const money = new Money(100.123, 'XXX');
      expect(money.toString()).toBe('XXX 100.12');
    });

    test('should respect currency-specific decimal places', () => {
      // USD: 2 decimals (cents) for display
      const usd = new Money(100.999, 'USD');
      expect(usd.toNumber()).toBe(101); // Display rounds to nearest cent
      expect(usd.getInternalAmount()).toBe(100.999); // Internal maintains precision
      
      // JPY: 0 decimals (no fractional yen) for display
      const jpy = new Money(100.5, 'JPY');
      expect(jpy.toNumber()).toBe(101); // Display rounds to nearest yen
      expect(jpy.getInternalAmount()).toBe(100.5); // Internal maintains precision
      
      // For micro-transactions, internal precision is maintained
      const micro = new Money(0.000001, 'USD');
      expect(micro.getInternalAmount()).toBe(0.000001);
      expect(micro.toNumber()).toBe(0); // Display rounds to cents
    });
  });
});
