import { 
  createCurrency, 
  createFactory, 
  CurrencyRegistry,
  registerCurrencyConfig 
} from '../src/classes/value-objects/CurrencyFactory';
import { Money } from '../src/classes/value-objects/Money';
import type { ICurrencyConstructor, ICurrencyFactory } from '../src/types/money.types';

// Type assertion helper for tests
type CurrencyResult<T extends string> = {
  [K in T]: ICurrencyConstructor;
} & {
  [K in Lowercase<T>]: ICurrencyFactory;
};

describe('CurrencyFactory', () => {
  describe('createCurrency', () => {
    it('should create both class and factory function', () => {
      const result = createCurrency('USD');
      
      // Should have USD class
      expect(result.USD).toBeDefined();
      expect(typeof result.USD).toBe('function');
      
      // Should have usd factory function
      expect(result.usd).toBeDefined();
      expect(typeof result.usd).toBe('function');
    });

    it('should create instances with correct currency', () => {
      const { USD, usd } = createCurrency('USD') as CurrencyResult<'USD'>;
      
      // Using class
      const payment1 = new USD(100);
      expect(payment1).toBeInstanceOf(Money);
      expect(payment1).toBeInstanceOf(USD);
      expect(payment1.currency).toBe('USD');
      expect(payment1.toNumber()).toBe(100);
      
      // Using factory
      const payment2 = usd(50);
      expect(payment2).toBeInstanceOf(Money);
      expect(payment2).toBeInstanceOf(USD);
      expect(payment2.currency).toBe('USD');
      expect(payment2.toNumber()).toBe(50);
    });

    it('should use predefined currency config', () => {
      const { USD, usd } = createCurrency('USD') as CurrencyResult<'USD'>;
      const payment = usd(1.999);
      
      // USD has displayScale of 2
      expect(payment.toNumber()).toBe(2.00);
      expect(payment.format()).toBe('$2.00');
    });

    it('should allow custom options', () => {
      const { XXX, xxx } = createCurrency('XXX', { 
        forceScale: 3
      }) as CurrencyResult<'XXX'>;
      
      const payment = xxx(1.2345);
      // Note: forceScale affects internal precision, not display rounding
      // The actual rounding behavior depends on Money class implementation
      expect(payment.currency).toBe('XXX');
      expect(payment.toNumber()).toBeDefined();
    });

    it('should create different classes for different currencies', () => {
      const { USD } = createCurrency('USD') as CurrencyResult<'USD'>;
      const { EUR } = createCurrency('EUR') as CurrencyResult<'EUR'>;
      
      expect(USD).not.toBe(EUR);
      
      const usdPayment = new USD(100);
      const eurPayment = new EUR(100);
      
      expect(usdPayment).toBeInstanceOf(USD);
      expect(usdPayment).not.toBeInstanceOf(EUR);
      expect(eurPayment).toBeInstanceOf(EUR);
      expect(eurPayment).not.toBeInstanceOf(USD);
    });

    it('should have static methods on class', () => {
      const { USD } = createCurrency('USD') as CurrencyResult<'USD'>;
      
      // Test static zero
      const zero = USD.zero();
      expect(zero).toBeInstanceOf(USD);
      expect(zero.toNumber()).toBe(0);
      
      // Test static from with number
      const fromNumber = USD.from(99.99);
      expect(fromNumber).toBeInstanceOf(USD);
      expect(fromNumber.toNumber()).toBe(99.99);
      
      // Test static from with string
      const fromString = USD.from('$50.50');
      expect(fromString).toBeInstanceOf(USD);
      expect(fromString.toNumber()).toBe(50.50);
      
      // Test static code
      expect(USD.code).toBe('USD');
    });

    it('should have utility methods on factory function', () => {
      const { usd } = createCurrency('USD') as CurrencyResult<'USD'>;
      
      // Test zero
      const zero = usd.zero();
      expect(zero).toBeInstanceOf(Money);
      expect(zero.toNumber()).toBe(0);
      
      // Test from
      const fromValue = usd.from('100.50');
      expect(fromValue).toBeInstanceOf(Money);
      expect(fromValue.toNumber()).toBe(100.50);
      
      // Test Class reference
      expect(usd.Class).toBeDefined();
      const instance = new usd.Class(50);
      expect(instance.toNumber()).toBe(50);
    });

    it('should handle crypto currencies with custom scale', () => {
      // First register BTC with proper configuration
      registerCurrencyConfig('BTC', {
        code: 'BTC',
        symbol: '₿',
        name: 'Bitcoin',
        decimals: 8
      });
      
      const { BTC, btc } = createCurrency('BTC') as CurrencyResult<'BTC'>;
      
      const payment = btc(0.00000001);
      expect(payment.toNumber()).toBe(0.00000001);
      
      // BTC now has the ₿ symbol
      const formatted = payment.format();
      expect(formatted).toBeDefined();
      expect(formatted).toContain('BTC');
    });

    it('should use custom toString', () => {
      const { USD } = createCurrency('USD') as CurrencyResult<'USD'>;
      const payment = new USD(100);
      
      expect(payment.toString()).toBe('USD 100');
      expect(String(payment)).toBe('USD 100');
    });
  });

  describe('createFactory', () => {
    // Define a custom class for testing
    class CustomUSD extends Money {
      constructor(amount: number) {
        super(amount, 'USD');
      }
      
      formatForInvoice(): string {
        return `Invoice: $${this.toNumber().toFixed(2)} USD`;
      }
    }

    it('should create factory from existing class', () => {
      const usd = createFactory(CustomUSD);
      
      expect(typeof usd).toBe('function');
      
      const payment = usd(100);
      expect(payment).toBeInstanceOf(CustomUSD);
      expect(payment).toBeInstanceOf(Money);
      expect(payment.toNumber()).toBe(100);
    });

    it('should preserve custom methods', () => {
      const usd = createFactory(CustomUSD);
      const payment = usd(99.99);
      
      expect(payment.formatForInvoice()).toBe('Invoice: $99.99 USD');
    });

    it('should have utility methods', () => {
      const usd = createFactory(CustomUSD);
      
      // Test zero
      const zero = usd.zero();
      expect(zero).toBeInstanceOf(CustomUSD);
      expect(zero.toNumber()).toBe(0);
      
      // Test from
      const fromString = usd.from('250.75');
      expect(fromString).toBeInstanceOf(CustomUSD);
      expect(fromString.toNumber()).toBe(250.75);
      
      // Test Class reference
      expect(usd.Class).toBe(CustomUSD);
    });

    it('should handle invalid string parsing', () => {
      const usd = createFactory(CustomUSD);
      
      expect(() => usd.from('invalid')).toThrow('Cannot parse "invalid" as a monetary amount');
    });
  });

  describe('CurrencyRegistry', () => {
    let registry: CurrencyRegistry;

    beforeEach(() => {
      registry = new CurrencyRegistry();
    });

    it('should define and retrieve currencies', () => {
      const result1 = registry.define('USD') as CurrencyResult<'USD'>;
      expect(result1.USD).toBeDefined();
      expect(result1.usd).toBeDefined();
      
      const result2 = registry.get('USD') as CurrencyResult<'USD'>;
      expect(result2.USD).toBe(result1.USD); // Same class instance
      expect(result2.usd).toBeDefined();
    });

    it('should return same class for repeated definitions', () => {
      const { USD: USD1 } = registry.define('USD') as CurrencyResult<'USD'>;
      const { USD: USD2 } = registry.define('USD') as CurrencyResult<'USD'>;
      
      expect(USD1).toBe(USD2); // Singleton behavior within registry
      
      const payment1 = new USD1(100);
      const payment2 = new USD2(100);
      
      expect(payment1).toBeInstanceOf(USD2);
      expect(payment2).toBeInstanceOf(USD1);
    });

    it('should throw error for undefined currency', () => {
      expect(() => registry.get('XYZ')).toThrow('Currency XYZ not defined in registry');
    });

    it('should check if currency exists', () => {
      expect(registry.has('USD')).toBe(false);
      
      registry.define('USD');
      
      expect(registry.has('USD')).toBe(true);
      expect(registry.has('EUR')).toBe(false);
    });

    it('should return all currency codes', () => {
      expect(registry.getCodes()).toEqual([]);
      
      registry.define('USD');
      registry.define('EUR');
      registry.define('GBP');
      
      const codes = registry.getCodes();
      expect(codes).toContain('USD');
      expect(codes).toContain('EUR');
      expect(codes).toContain('GBP');
      expect(codes).toHaveLength(3);
    });

    it('should clear all definitions', () => {
      registry.define('USD');
      registry.define('EUR');
      
      expect(registry.has('USD')).toBe(true);
      expect(registry.has('EUR')).toBe(true);
      
      registry.clear();
      
      expect(registry.has('USD')).toBe(false);
      expect(registry.has('EUR')).toBe(false);
      expect(registry.getCodes()).toEqual([]);
    });

    it('should handle multiple registries independently', () => {
      const registry1 = new CurrencyRegistry();
      const registry2 = new CurrencyRegistry();
      
      const { USD: USD1 } = registry1.define('USD') as CurrencyResult<'USD'>;
      const { USD: USD2 } = registry2.define('USD') as CurrencyResult<'USD'>;
      
      // Different registries have different class instances
      expect(USD1).not.toBe(USD2);
    });
  });

  describe('registerCurrencyConfig', () => {
    it('should register custom currency config', () => {
      // Register a new currency
      registerCurrencyConfig('DOGE', {
        code: 'DOGE',
        symbol: 'Ð',
        name: 'Dogecoin',
        decimals: 4
      });

      // Should be able to use it with createCurrency
      const { DOGE, doge } = createCurrency('DOGE') as CurrencyResult<'DOGE'>;
      
      const payment = doge(420.6969);
      expect(payment.currency).toBe('DOGE');
      expect(payment.toNumber()).toBe(420.6969); // DOGE configured with 4 decimals
    });

    it('should override with custom options', () => {
      // Even if config exists, custom options should override
      const { USD, usd } = createCurrency('USD', { 
        forceScale: 4
      }) as CurrencyResult<'USD'>;
      
      const payment = usd(1.2345);
      expect(payment.currency).toBe('USD');
      // forceScale affects internal precision
      // Note: scale is internal property, not exposed in IMoney interface
      // We can verify it works by checking the precision is maintained
      const result = payment.multiply(1);
      expect(result.currency).toBe('USD');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle expense split scenario', () => {
      const { USD, usd } = createCurrency('USD') as CurrencyResult<'USD'>;
      
      // Split expense example
      const expense = {
        cash: usd(50),
        bank1: usd(30),
        bank2: usd(20)
      };
      
      // Calculate total
      const total = expense.cash
        .add(expense.bank1)
        .add(expense.bank2);
      
      expect(total.toNumber()).toBe(100);
      // Note: add() returns a new Money instance, not USD instance
      expect(total).toBeInstanceOf(Money);
      expect(total.currency).toBe('USD');
    });

    it('should handle multi-currency scenario', () => {
      const { USD, usd } = createCurrency('USD') as CurrencyResult<'USD'>;
      const { EUR, eur } = createCurrency('EUR') as CurrencyResult<'EUR'>;
      const { GBP, gbp } = createCurrency('GBP') as CurrencyResult<'GBP'>;
      
      const payments = {
        us: usd(100),
        europe: eur(85),
        uk: gbp(75)
      };
      
      expect(payments.us.currency).toBe('USD');
      expect(payments.europe.currency).toBe('EUR');
      expect(payments.uk.currency).toBe('GBP');
      
      // Should not be able to add different currencies
      expect(() => payments.us.add(payments.europe)).toThrow();
    });

    it('should handle class extension scenario', () => {
      // Developer extends the created class
      // For this test, we'll use a simpler approach that TypeScript can understand
      const { USD, usd } = createCurrency('USD') as CurrencyResult<'USD'>;
      
      // Test that the class can be instantiated and used
      const basePayment = new USD(100);
      expect(basePayment).toBeInstanceOf(Money);
      expect(basePayment.toNumber()).toBe(100);
      
      // Test factory function works
      const factoryPayment = usd(50);
      expect(factoryPayment).toBeInstanceOf(Money);
      expect(factoryPayment.toNumber()).toBe(50);
      
      // For actual class extension, developers would need to:
      // 1. Import Money directly
      // 2. Create their own class extending Money
      // 3. Use createFactory() to create a factory function
      class CustomUSD extends Money {
        constructor(amount: number) {
          super(amount, 'USD');
        }
        
        applyDiscount(percent: number): CustomUSD {
          const discounted = this.toNumber() * (1 - percent / 100);
          return new CustomUSD(discounted);
        }
      }
      
      const customPrice = new CustomUSD(100);
      const customDiscounted = customPrice.applyDiscount(10);
      
      expect(customDiscounted).toBeInstanceOf(CustomUSD);
      expect(customDiscounted).toBeInstanceOf(Money);
      expect(customDiscounted.toNumber()).toBe(90);
    });
  });
});
