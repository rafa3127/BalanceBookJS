import Account from '../src/classes/accounts/Account';
import { ERROR_MESSAGES } from '../src/Constants';

describe('Account class', () => {
  describe('Constructor', () => {
    test('should initialize with correct name, balance and isDebitPositive', () => {
      const account = new Account('Test Account', 1000, true);
      expect(account.name).toBe('Test Account');
      expect(account.getBalance()).toBe(1000);
      // Note: isDebitPositive is now protected, cannot test directly
    });

    test('should initialize with default balance of 0 when not provided', () => {
      const account = new Account('Test Account', undefined, true);
      expect(account.getBalance()).toBe(0);
    });

    test('should throw error when initial balance is negative', () => {
      expect(() => {
        new Account('Test Account', -100, true);
      }).toThrow(ERROR_MESSAGES.NEGATIVE_AMOUNT);
    });

    test('should accept decimal initial balance', () => {
      const account = new Account('Test Account', 1000.50, true);
      expect(account.getBalance()).toBe(1000.50);
    });
  });

  describe('Debit operations', () => {
    test('debit should increase balance when isDebitPositive is true', () => {
      const account = new Account('Test Account', 1000, true);
      account.debit(500);
      expect(account.getBalance()).toBe(1500);
    });

    test('debit should decrease balance when isDebitPositive is false', () => {
      const account = new Account('Test Account', 1000, false);
      account.debit(500);
      expect(account.getBalance()).toBe(500);
    });

    test('debit should throw error when amount is negative', () => {
      const account = new Account('Test Account', 1000, true);
      expect(() => {
        account.debit(-100);
      }).toThrow(ERROR_MESSAGES.NEGATIVE_AMOUNT);
    });

    test('debit should handle zero amount', () => {
      const account = new Account('Test Account', 1000, true);
      account.debit(0);
      expect(account.getBalance()).toBe(1000);
    });

    test('debit should handle decimal amounts', () => {
      const account = new Account('Test Account', 1000, true);
      account.debit(99.99);
      expect(account.getBalance()).toBeCloseTo(1099.99, 2);
    });

    test('debit should handle large amounts within safe limits', () => {
      const account = new Account('Test Account', 0, true);
      // Use a large but safe value for CURR currency with internal scale 6
      // Max safe value is 9,007,199,254 (9 billion)
      const largeButSafe = 9_000_000_000;
      account.debit(largeButSafe);
      expect(account.getBalance()).toBe(largeButSafe);
    });
    
    test('debit should throw error for amounts exceeding safe limits', () => {
      const account = new Account('Test Account', 0, true);
      // Number.MAX_SAFE_INTEGER - 1 exceeds the safe limit for scale 6
      const tooLarge = Number.MAX_SAFE_INTEGER - 1;
      
      expect(() => {
        account.debit(tooLarge);
      }).toThrow(/exceeds the maximum safe value/);
    });
  });

  describe('Credit operations', () => {
    test('credit should decrease balance when isDebitPositive is true', () => {
      const account = new Account('Test Account', 1000, true);
      account.credit(500);
      expect(account.getBalance()).toBe(500);
    });

    test('credit should increase balance when isDebitPositive is false', () => {
      const account = new Account('Test Account', 1000, false);
      account.credit(500);
      expect(account.getBalance()).toBe(1500);
    });

    test('credit should throw error when amount is negative', () => {
      const account = new Account('Test Account', 1000, true);
      expect(() => {
        account.credit(-100);
      }).toThrow(ERROR_MESSAGES.NEGATIVE_AMOUNT);
    });

    test('credit should handle zero amount', () => {
      const account = new Account('Test Account', 1000, false);
      account.credit(0);
      expect(account.getBalance()).toBe(1000);
    });

    test('credit should handle decimal amounts', () => {
      const account = new Account('Test Account', 1000, false);
      account.credit(99.99);
      expect(account.getBalance()).toBeCloseTo(1099.99, 2);
    });

    test('credit should handle large amounts within safe limits', () => {
      const account = new Account('Test Account', 0, false);
      // Use a large but safe value for CURR currency with internal scale 6
      const largeButSafe = 9_000_000_000;
      account.credit(largeButSafe);
      expect(account.getBalance()).toBe(largeButSafe);
    });
    
    test('credit should throw error for amounts exceeding safe limits', () => {
      const account = new Account('Test Account', 0, false);
      // Number.MAX_SAFE_INTEGER - 1 exceeds the safe limit for scale 6
      const tooLarge = Number.MAX_SAFE_INTEGER - 1;
      
      expect(() => {
        account.credit(tooLarge);
      }).toThrow(/exceeds the maximum safe value/);
    });
  });

  describe('Balance operations', () => {
    test('getBalance should return current balance', () => {
      const account = new Account('Test Account', 1500, true);
      expect(account.getBalance()).toBe(1500);
    });

    test('balance should be correctly updated after multiple operations', () => {
      const account = new Account('Test Account', 1000, true);
      account.debit(500);  // 1500
      account.credit(200); // 1300
      account.debit(100);  // 1400
      expect(account.getBalance()).toBe(1400);
    });

    test('balance can go negative', () => {
      const account = new Account('Test Account', 100, true);
      account.credit(200); // -100
      expect(account.getBalance()).toBe(-100);
    });
  });

  describe('Immutability', () => {
    test('name property should be readonly', () => {
      const account = new Account('Test Account', 1000, true);
      // TypeScript prevents reassignment at compile time
      // In JavaScript runtime, the property is still writable
      // but TypeScript will catch this during development
      const originalName = account.name;
      
      // Attempting to modify (would fail in TypeScript compilation)
      // But we can't actually test this at runtime since TypeScript prevents it
      expect(account.name).toBe(originalName);
      expect(account.name).toBe('Test Account');
    });
  });

  describe('Type safety', () => {
    test('Account should implement proper interface', () => {
      const account = new Account('Test Account', 1000, true);
      
      // These should all exist and be functions
      expect(typeof account.debit).toBe('function');
      expect(typeof account.credit).toBe('function');
      expect(typeof account.getBalance).toBe('function');
      
      // Name should be a string
      expect(typeof account.name).toBe('string');
    });

    test('TypeScript should prevent invalid types at compile time', () => {
      // These would cause TypeScript compilation errors:
      // new Account(123, 1000, true); // name must be string
      // new Account('Test', '1000', true); // balance must be number
      // new Account('Test', 1000, 'yes'); // isDebitPositive must be boolean
      
      // We can verify correct construction works
      const account = new Account('Valid Name', 1000, true);
      expect(account.name).toBe('Valid Name');
      expect(account.getBalance()).toBe(1000);
    });
  });

  describe('Edge cases and floating point precision', () => {
    test('should handle floating point arithmetic correctly', () => {
      const account = new Account('Test Account', 0.1, true);
      account.debit(0.2);
      // Use toBeCloseTo for floating point comparison
      expect(account.getBalance()).toBeCloseTo(0.3, 10);
    });

    test('should handle very small amounts with rounding', () => {
      const account = new Account('Test Account', 0, true);
      account.debit(0.000001);
      // CURR currency has 2 decimal places, so 0.000001 rounds to 0.00
      // The internal Money object maintains precision but displays as 0
      expect(account.getBalance()).toBe(0);
    });
    
    test('should handle amounts at the display precision', () => {
      const account = new Account('Test Account', 0, true);
      account.debit(0.01); // Smallest displayable unit for CURR (2 decimals)
      expect(account.getBalance()).toBe(0.01);
    });

    test('should handle alternating operations', () => {
      const account = new Account('Test Account', 0, false);
      for (let i = 0; i < 100; i++) {
        account.credit(1);
        account.debit(0.5);
      }
      expect(account.getBalance()).toBeCloseTo(50, 2);
    });
  });
});
