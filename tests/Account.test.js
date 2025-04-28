import Account from '../src/classes/accounts/Account.js';

describe('Account class', () => {
  // Test for account initialization
  test('should initialize with correct name, balance and isDebitPositive', () => {
    const name = 'Test Account';
    const initialBalance = 1000;
    const isDebitPositive = true;
    
    const account = new Account(name, initialBalance, isDebitPositive);
    
    expect(account.name).toBe(name);
    expect(account.balance).toBe(initialBalance);
    expect(account.isDebitPositive).toBe(isDebitPositive);
  });

  // Test for debit method when isDebitPositive is true
  test('debit should increase balance when isDebitPositive is true', () => {
    const account = new Account('Debit Test', 500, true);
    const debitAmount = 250;
    
    account.debit(debitAmount);
    
    expect(account.getBalance()).toBe(750);
  });

  // Test for debit method when isDebitPositive is false
  test('debit should decrease balance when isDebitPositive is false', () => {
    const account = new Account('Debit Test', 500, false);
    const debitAmount = 250;
    
    account.debit(debitAmount);
    
    expect(account.getBalance()).toBe(250);
  });

  // Test for credit method when isDebitPositive is true
  test('credit should decrease balance when isDebitPositive is true', () => {
    const account = new Account('Credit Test', 500, true);
    const creditAmount = 250;
    
    account.credit(creditAmount);
    
    expect(account.getBalance()).toBe(250);
  });

  // Test for credit method when isDebitPositive is false
  test('credit should increase balance when isDebitPositive is false', () => {
    const account = new Account('Credit Test', 500, false);
    const creditAmount = 250;
    
    account.credit(creditAmount);
    
    expect(account.getBalance()).toBe(750);
  });

  // Test for getBalance method
  test('getBalance should return the current balance', () => {
    const initialBalance = 750;
    const account = new Account('Balance Test', initialBalance, true);
    
    expect(account.getBalance()).toBe(initialBalance);
    
    account.debit(250);
    expect(account.getBalance()).toBe(1000);
    
    account.credit(500);
    expect(account.getBalance()).toBe(500);
  });
});
