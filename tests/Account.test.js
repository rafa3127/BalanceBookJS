import Account from '../src/classes/accounts/Account.js';

describe('Account class', () => {
  test('should initialize with correct name, balance and isDebitPositive', () => {
    const account = new Account('Test Account', 1000, true);
    expect(account.name).toBe('Test Account');
    expect(account.balance).toBe(1000);
    expect(account.isDebitPositive).toBe(true);
  });

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
});