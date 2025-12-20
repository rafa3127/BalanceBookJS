import { Asset, Liability, Equity, Income, Expense } from '../src/classes/accounts';
import { AccountType } from '../src/Constants';

/**
 * Test configuration for all account subclasses
 */
const accountTypes = [
  {
    Class: Asset,
    className: 'Asset',
    type: AccountType.ASSET,
    isDebitPositive: true,
    exampleName: 'Cash'
  },
  {
    Class: Liability,
    className: 'Liability',
    type: AccountType.LIABILITY,
    isDebitPositive: false,
    exampleName: 'Accounts Payable'
  },
  {
    Class: Equity,
    className: 'Equity',
    type: AccountType.EQUITY,
    isDebitPositive: false,
    exampleName: 'Owner\'s Equity'
  },
  {
    Class: Income,
    className: 'Income',
    type: AccountType.INCOME,
    isDebitPositive: false,
    exampleName: 'Sales Revenue'
  },
  {
    Class: Expense,
    className: 'Expense',
    type: AccountType.EXPENSE,
    isDebitPositive: true,
    exampleName: 'Rent Expense'
  }
];

describe.each(accountTypes)(
  '$className Account',
  ({ Class, className, type, isDebitPositive, exampleName }) => {

    describe('Constructor and type', () => {
      test(`should create a ${className} account with correct type`, () => {
        const account = new Class({ name: exampleName, balance: 1000 });

        expect(account.type).toBe(type);
        expect(account.name).toBe(exampleName);
        expect(account.getBalance()).toBe(1000);
      });

      test('should default to zero balance when not provided', () => {
        const account = new Class({ name: exampleName });

        expect(account.getBalance()).toBe(0);
      });

      test('should store extra fields from config', () => {
        const account = new Class({
          name: exampleName,
          balance: 1000,
          department: 'Operations',
          costCenter: 'CC-100'
        });

        expect((account as any).department).toBe('Operations');
        expect((account as any).costCenter).toBe('CC-100');
      });
    });

    describe('Debit/Credit behavior', () => {
      if (isDebitPositive) {
        test('should increase balance on debit (debit positive account)', () => {
          const account = new Class({ name: exampleName, balance: 1000 });

          account.debit(500);
          expect(account.getBalance()).toBe(1500);
        });

        test('should decrease balance on credit (debit positive account)', () => {
          const account = new Class({ name: exampleName, balance: 1000 });

          account.credit(300);
          expect(account.getBalance()).toBe(700);
        });
      } else {
        test('should decrease balance on debit (credit positive account)', () => {
          const account = new Class({ name: exampleName, balance: 1000 });

          account.debit(500);
          expect(account.getBalance()).toBe(500);
        });

        test('should increase balance on credit (credit positive account)', () => {
          const account = new Class({ name: exampleName, balance: 1000 });

          account.credit(300);
          expect(account.getBalance()).toBe(1300);
        });
      }
    });

    describe('Type checking', () => {
      test(`should be an instance of ${className} and Account`, () => {
        const account = new Class({ name: exampleName });

        expect(account).toBeInstanceOf(Class);
        expect(account.constructor.name).toBe(className);
      });

      test('should have all required methods', () => {
        const account = new Class({ name: exampleName });

        expect(typeof account.debit).toBe('function');
        expect(typeof account.credit).toBe('function');
        expect(typeof account.getBalance).toBe('function');
      });
    });

    describe('Integration with parent class', () => {
      test('should inherit validation from Account class', () => {
        const account = new Class({ name: exampleName, balance: 100 });

        // Should throw on negative amounts
        expect(() => account.debit(-50)).toThrow('Amount must be positive');
        expect(() => account.credit(-50)).toThrow('Amount must be positive');
      });

      test('should handle decimal amounts correctly', () => {
        const account = new Class({ name: exampleName, balance: 100.50 });

        account.debit(50.25);
        const expectedBalance = isDebitPositive ? 150.75 : 50.25;

        expect(account.getBalance()).toBeCloseTo(expectedBalance, 2);
      });
    });

    describe('Serialization with extra fields', () => {
      test('should serialize and deserialize extra fields', () => {
        const account = new Class({
          name: exampleName,
          balance: 1000,
          department: 'Operations',
          costCenter: 'CC-100'
        });

        const serialized = account.serialize();
        expect(serialized.department).toBe('Operations');
        expect(serialized.costCenter).toBe('CC-100');

        const restored = Class.fromData(serialized);
        expect((restored as any).department).toBe('Operations');
        expect((restored as any).costCenter).toBe('CC-100');
      });
    });
  }
);

/**
 * Additional tests for specific account type behaviors
 */
describe('Account type-specific behaviors', () => {
  test('Asset and Expense accounts should behave similarly (debit positive)', () => {
    const asset = new Asset({ name: 'Equipment', balance: 1000 });
    const expense = new Expense({ name: 'Utilities', balance: 1000 });

    asset.debit(100);
    expense.debit(100);

    expect(asset.getBalance()).toBe(1100);
    expect(expense.getBalance()).toBe(1100);
  });

  test('Liability, Equity, and Income accounts should behave similarly (credit positive)', () => {
    const liability = new Liability({ name: 'Loan', balance: 1000 });
    const equity = new Equity({ name: 'Capital', balance: 1000 });
    const income = new Income({ name: 'Service Revenue', balance: 1000 });

    liability.credit(100);
    equity.credit(100);
    income.credit(100);

    expect(liability.getBalance()).toBe(1100);
    expect(equity.getBalance()).toBe(1100);
    expect(income.getBalance()).toBe(1100);
  });
});
