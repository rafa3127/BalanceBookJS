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
        const account = new Class(exampleName, 1000);
        
        expect(account.type).toBe(type);
        expect(account.name).toBe(exampleName);
        expect(account.getBalance()).toBe(1000);
      });

      test('should default to zero balance when not provided', () => {
        const account = new Class(exampleName);
        
        expect(account.getBalance()).toBe(0);
      });
    });

    describe('Debit/Credit behavior', () => {
      if (isDebitPositive) {
        test('should increase balance on debit (debit positive account)', () => {
          const account = new Class(exampleName, 1000);
          
          account.debit(500);
          expect(account.getBalance()).toBe(1500);
        });

        test('should decrease balance on credit (debit positive account)', () => {
          const account = new Class(exampleName, 1000);
          
          account.credit(300);
          expect(account.getBalance()).toBe(700);
        });
      } else {
        test('should decrease balance on debit (credit positive account)', () => {
          const account = new Class(exampleName, 1000);
          
          account.debit(500);
          expect(account.getBalance()).toBe(500);
        });

        test('should increase balance on credit (credit positive account)', () => {
          const account = new Class(exampleName, 1000);
          
          account.credit(300);
          expect(account.getBalance()).toBe(1300);
        });
      }
    });

    describe('Type checking', () => {
      test(`should be an instance of ${className} and Account`, () => {
        const account = new Class(exampleName);
        
        expect(account).toBeInstanceOf(Class);
        expect(account.constructor.name).toBe(className);
      });

      test('should have all required methods', () => {
        const account = new Class(exampleName);
        
        expect(typeof account.debit).toBe('function');
        expect(typeof account.credit).toBe('function');
        expect(typeof account.getBalance).toBe('function');
      });
    });

    describe('Integration with parent class', () => {
      test('should inherit validation from Account class', () => {
        const account = new Class(exampleName, 100);
        
        // Should throw on negative amounts
        expect(() => account.debit(-50)).toThrow('Amount must be positive');
        expect(() => account.credit(-50)).toThrow('Amount must be positive');
      });

      test('should handle decimal amounts correctly', () => {
        const account = new Class(exampleName, 100.50);
        
        account.debit(50.25);
        const expectedBalance = isDebitPositive ? 150.75 : 50.25;
        
        expect(account.getBalance()).toBeCloseTo(expectedBalance, 2);
      });
    });
  }
);

/**
 * Additional tests for specific account type behaviors
 */
describe('Account type-specific behaviors', () => {
  test('Asset and Expense accounts should behave similarly (debit positive)', () => {
    const asset = new Asset('Equipment', 1000);
    const expense = new Expense('Utilities', 1000);
    
    asset.debit(100);
    expense.debit(100);
    
    expect(asset.getBalance()).toBe(1100);
    expect(expense.getBalance()).toBe(1100);
  });

  test('Liability, Equity, and Income accounts should behave similarly (credit positive)', () => {
    const liability = new Liability('Loan', 1000);
    const equity = new Equity('Capital', 1000);
    const income = new Income('Service Revenue', 1000);
    
    liability.credit(100);
    equity.credit(100);
    income.credit(100);
    
    expect(liability.getBalance()).toBe(1100);
    expect(equity.getBalance()).toBe(1100);
    expect(income.getBalance()).toBe(1100);
  });
});
