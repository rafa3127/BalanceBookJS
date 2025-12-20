import Account from '../src/classes/accounts/Account';
import Asset from '../src/classes/accounts/Asset';
import { Money } from '../src/classes/value-objects/Money';
import { ERROR_MESSAGES } from '../src/Constants';

describe('Account with Money integration', () => {
  describe('Transparent Mode', () => {
    test('should return number when initialized with number', () => {
      const account = new Account({ name: 'Test Account', balance: 1000, isDebitPositive: true });
      expect(typeof account.getBalance()).toBe('number');
      expect(account.getBalance()).toBe(1000);
      expect(account.isNumberMode()).toBe(true);
      expect(account.isMoneyMode()).toBe(false);
    });

    test('should return Money when initialized with Money', () => {
      const initialMoney = new Money(1000, 'USD');
      const account = new Account({ name: 'Test Account', balance: initialMoney, isDebitPositive: true });
      const balance = account.getBalance();

      expect(Money.isMoney(balance)).toBe(true);
      if (Money.isMoney(balance)) {
        expect(balance.toNumber()).toBe(1000);
        expect(balance.currency).toBe('USD');
      }
      expect(account.isNumberMode()).toBe(false);
      expect(account.isMoneyMode()).toBe(true);
    });

    test('should use CURR as default currency for number mode', () => {
      const account = new Account({ name: 'Test Account', balance: 100, isDebitPositive: true });
      expect(account.getCurrency()).toBe('CURR');
    });

    test('should allow custom default currency for number mode', () => {
      const account = new Account({ name: 'Test Account', balance: 100, isDebitPositive: true, currency: 'EUR' });
      expect(account.getCurrency()).toBe('EUR');
    });
  });

  describe('Mixed Operations', () => {
    test('should accept both numbers and Money in debit when initialized with number', () => {
      const account = new Account({ name: 'Test Account', balance: 1000, isDebitPositive: true });

      // Debit with number
      account.debit(500);
      expect(account.getBalance()).toBe(1500);

      // Debit with Money (same currency)
      account.debit(new Money(300, 'CURR'));
      expect(account.getBalance()).toBe(1800);
    });

    test('should accept both numbers and Money in debit when initialized with Money', () => {
      const account = new Account({ name: 'Test Account', balance: new Money(1000, 'USD'), isDebitPositive: true });

      // Debit with Money
      account.debit(new Money(500, 'USD'));
      let balance = account.getBalance();
      expect(Money.isMoney(balance) && balance.toNumber()).toBe(1500);

      // Debit with number (converted to USD)
      account.debit(300);
      balance = account.getBalance();
      expect(Money.isMoney(balance) && balance.toNumber()).toBe(1800);
    });

    test('should throw error on currency mismatch', () => {
      const account = new Account({ name: 'Test Account', balance: new Money(1000, 'USD'), isDebitPositive: true });

      expect(() => {
        account.debit(new Money(100, 'EUR'));
      }).toThrow('Currency mismatch: Account uses USD, but received EUR');
    });
  });

  describe('Precision with Money', () => {
    test('should handle decimal precision correctly', () => {
      const account = new Account({ name: 'Test Account', balance: new Money(0.1, 'USD'), isDebitPositive: true });
      account.debit(new Money(0.2, 'USD'));

      const balance = account.getBalance();
      if (Money.isMoney(balance)) {
        expect(balance.toNumber()).toBe(0.3); // Exact, not 0.30000000000000004
      }
    });

    test('should maintain precision through multiple operations', () => {
      const account = new Account({ name: 'Test Account', balance: 0, isDebitPositive: true });

      // Multiple operations that would cause floating point errors
      for (let i = 0; i < 100; i++) {
        account.debit(0.01);
      }

      expect(account.getBalance()).toBe(1); // Exact
    });
  });

  describe('Subclasses compatibility', () => {
    test('Asset should work with number mode', () => {
      const asset = new Asset({ name: 'Cash', balance: 1000 });
      expect(asset.getBalance()).toBe(1000);
      asset.debit(500);
      expect(asset.getBalance()).toBe(1500);
    });

    test('Asset should work with Money mode', () => {
      const asset = new Asset({ name: 'Bank Account', balance: new Money(1000, 'EUR') });
      const balance = asset.getBalance();

      expect(Money.isMoney(balance)).toBe(true);
      if (Money.isMoney(balance)) {
        expect(balance.toNumber()).toBe(1000);
        expect(balance.currency).toBe('EUR');
      }
    });
  });

  describe('Error handling', () => {
    test('should throw error for negative initial balance with number', () => {
      expect(() => {
        new Account({ name: 'Test', balance: -100, isDebitPositive: true });
      }).toThrow(ERROR_MESSAGES.NEGATIVE_AMOUNT);
    });

    test('should throw error for negative initial balance with Money', () => {
      expect(() => {
        new Account({ name: 'Test', balance: new Money(-100, 'USD'), isDebitPositive: true });
      }).toThrow(ERROR_MESSAGES.NEGATIVE_AMOUNT);
    });

    test('should throw error for negative debit amount', () => {
      const account = new Account({ name: 'Test', balance: 100, isDebitPositive: true });
      expect(() => {
        account.debit(-50);
      }).toThrow(ERROR_MESSAGES.NEGATIVE_AMOUNT);
    });

    test('should throw error for negative Money debit', () => {
      const account = new Account({ name: 'Test', balance: new Money(100, 'USD'), isDebitPositive: true });
      expect(() => {
        account.debit(new Money(-50, 'USD'));
      }).toThrow(ERROR_MESSAGES.NEGATIVE_AMOUNT);
    });
  });
});
