/******/ // The require scope
/******/ var __webpack_require__ = {};
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ !function() {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = function(exports, definition) {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ }();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ !function() {
/******/ 	__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ }();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  gD: function() { return /* reexport */ accounts_Account; },
  Vd: function() { return /* reexport */ accounts_Asset; },
  ul: function() { return /* reexport */ accounts_Equity; },
  X2: function() { return /* reexport */ accounts_Expense; },
  a$: function() { return /* reexport */ accounts_Income; },
  Wo: function() { return /* reexport */ transactions_JournalEntry; },
  eu: function() { return /* reexport */ accounts_Liability; }
});

;// CONCATENATED MODULE: ./src/classes/accounts/Account.js
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Account.js
/**
 * Class representing a generic account.
 */
var Account = /*#__PURE__*/function () {
  /**
   * Create an account.
   * @param {string} name - The name of the account.
   * @param {number} initialBalance - The initial balance of the account.
   * @param {boolean} isDebitPositive - Determines if debits increase or decrease the balance.
   */
  function Account(name, initialBalance, isDebitPositive) {
    _classCallCheck(this, Account);
    this.name = name;
    this.balance = initialBalance;
    this.isDebitPositive = isDebitPositive;
  }

  /**
   * Debit an amount to the account.
   * @param {number} amount - The amount to debit.
   */
  return _createClass(Account, [{
    key: "debit",
    value: function debit(amount) {
      this.balance += this.isDebitPositive ? amount : -amount;
    }

    /**
     * Credit an amount to the account.
     * @param {number} amount - The amount to credit.
     */
  }, {
    key: "credit",
    value: function credit(amount) {
      this.balance += this.isDebitPositive ? -amount : amount;
    }

    /**
     * Get the current balance of the account.
     * @return {number} The current balance.
     */
  }, {
    key: "getBalance",
    value: function getBalance() {
      return this.balance;
    }
  }]);
}();
/* harmony default export */ var accounts_Account = (Account);
;// CONCATENATED MODULE: ./src/classes/accounts/Asset.js
function Asset_typeof(o) { "@babel/helpers - typeof"; return Asset_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, Asset_typeof(o); }
function Asset_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, Asset_toPropertyKey(descriptor.key), descriptor); } }
function Asset_createClass(Constructor, protoProps, staticProps) { if (protoProps) Asset_defineProperties(Constructor.prototype, protoProps); if (staticProps) Asset_defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function Asset_toPropertyKey(t) { var i = Asset_toPrimitive(t, "string"); return "symbol" == Asset_typeof(i) ? i : i + ""; }
function Asset_toPrimitive(t, r) { if ("object" != Asset_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != Asset_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Asset_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(self, call) { if (call && (Asset_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
// En tu archivo src/classes/Asset.js



/**
 * Class representing an asset account.
 * Inherits from Account.
 */
var Asset = /*#__PURE__*/function (_Account) {
  /**
   * Create an asset account.
   * @param {string} name - The name of the asset account.
   * @param {number} initialBalance - The initial balance of the asset account.
   */
  function Asset(name, initialBalance) {
    Asset_classCallCheck(this, Asset);
    return _callSuper(this, Asset, [name, initialBalance, true]); // Assets increase on debit, hence isDebitPositive is true
  }

  // Here you can add any methods specific to Asset accounts if needed in the future
  _inherits(Asset, _Account);
  return Asset_createClass(Asset);
}(accounts_Account);
/* harmony default export */ var accounts_Asset = (Asset);
;// CONCATENATED MODULE: ./src/classes/accounts/Liability.js
function Liability_typeof(o) { "@babel/helpers - typeof"; return Liability_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, Liability_typeof(o); }
function Liability_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, Liability_toPropertyKey(descriptor.key), descriptor); } }
function Liability_createClass(Constructor, protoProps, staticProps) { if (protoProps) Liability_defineProperties(Constructor.prototype, protoProps); if (staticProps) Liability_defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function Liability_toPropertyKey(t) { var i = Liability_toPrimitive(t, "string"); return "symbol" == Liability_typeof(i) ? i : i + ""; }
function Liability_toPrimitive(t, r) { if ("object" != Liability_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != Liability_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Liability_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function Liability_callSuper(t, o, e) { return o = Liability_getPrototypeOf(o), Liability_possibleConstructorReturn(t, Liability_isNativeReflectConstruct() ? Reflect.construct(o, e || [], Liability_getPrototypeOf(t).constructor) : o.apply(t, e)); }
function Liability_possibleConstructorReturn(self, call) { if (call && (Liability_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return Liability_assertThisInitialized(self); }
function Liability_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function Liability_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (Liability_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function Liability_getPrototypeOf(o) { Liability_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return Liability_getPrototypeOf(o); }
function Liability_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) Liability_setPrototypeOf(subClass, superClass); }
function Liability_setPrototypeOf(o, p) { Liability_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return Liability_setPrototypeOf(o, p); }
// En tu archivo src/classes/Liability.js



/**
 * Class representing a liability account.
 * Inherits from Account.
 */
var Liability = /*#__PURE__*/function (_Account) {
  /**
   * Create a liability account.
   * @param {string} name - The name of the liability account.
   * @param {number} initialBalance - The initial balance of the liability account.
   */
  function Liability(name, initialBalance) {
    Liability_classCallCheck(this, Liability);
    return Liability_callSuper(this, Liability, [name, initialBalance, false]); // Liabilities increase on credit, hence isDebitPositive is false
  }

  // Additional methods specific to Liability accounts can be added here if needed in the future
  Liability_inherits(Liability, _Account);
  return Liability_createClass(Liability);
}(accounts_Account);
/* harmony default export */ var accounts_Liability = (Liability);
;// CONCATENATED MODULE: ./src/classes/accounts/Equity.js
function Equity_typeof(o) { "@babel/helpers - typeof"; return Equity_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, Equity_typeof(o); }
function Equity_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, Equity_toPropertyKey(descriptor.key), descriptor); } }
function Equity_createClass(Constructor, protoProps, staticProps) { if (protoProps) Equity_defineProperties(Constructor.prototype, protoProps); if (staticProps) Equity_defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function Equity_toPropertyKey(t) { var i = Equity_toPrimitive(t, "string"); return "symbol" == Equity_typeof(i) ? i : i + ""; }
function Equity_toPrimitive(t, r) { if ("object" != Equity_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != Equity_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Equity_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function Equity_callSuper(t, o, e) { return o = Equity_getPrototypeOf(o), Equity_possibleConstructorReturn(t, Equity_isNativeReflectConstruct() ? Reflect.construct(o, e || [], Equity_getPrototypeOf(t).constructor) : o.apply(t, e)); }
function Equity_possibleConstructorReturn(self, call) { if (call && (Equity_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return Equity_assertThisInitialized(self); }
function Equity_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function Equity_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (Equity_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function Equity_getPrototypeOf(o) { Equity_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return Equity_getPrototypeOf(o); }
function Equity_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) Equity_setPrototypeOf(subClass, superClass); }
function Equity_setPrototypeOf(o, p) { Equity_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return Equity_setPrototypeOf(o, p); }


/**
 * Class representing an equity account.
 * Inherits from Account.
 */
var Equity = /*#__PURE__*/function (_Account) {
  /**
   * Create an equity account.
   * @param {string} name - The name of the equity account.
   * @param {number} initialBalance - The initial balance of the equity account.
   */
  function Equity(name, initialBalance) {
    Equity_classCallCheck(this, Equity);
    return Equity_callSuper(this, Equity, [name, initialBalance, false]); // Equity increases on credit, hence isDebitPositive is false
  }

  // Additional methods specific to Equity accounts can be added here if needed in the future
  Equity_inherits(Equity, _Account);
  return Equity_createClass(Equity);
}(accounts_Account);
/* harmony default export */ var accounts_Equity = (Equity);
;// CONCATENATED MODULE: ./src/classes/accounts/Income.js
function Income_typeof(o) { "@babel/helpers - typeof"; return Income_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, Income_typeof(o); }
function Income_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, Income_toPropertyKey(descriptor.key), descriptor); } }
function Income_createClass(Constructor, protoProps, staticProps) { if (protoProps) Income_defineProperties(Constructor.prototype, protoProps); if (staticProps) Income_defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function Income_toPropertyKey(t) { var i = Income_toPrimitive(t, "string"); return "symbol" == Income_typeof(i) ? i : i + ""; }
function Income_toPrimitive(t, r) { if ("object" != Income_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != Income_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Income_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function Income_callSuper(t, o, e) { return o = Income_getPrototypeOf(o), Income_possibleConstructorReturn(t, Income_isNativeReflectConstruct() ? Reflect.construct(o, e || [], Income_getPrototypeOf(t).constructor) : o.apply(t, e)); }
function Income_possibleConstructorReturn(self, call) { if (call && (Income_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return Income_assertThisInitialized(self); }
function Income_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function Income_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (Income_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function Income_getPrototypeOf(o) { Income_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return Income_getPrototypeOf(o); }
function Income_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) Income_setPrototypeOf(subClass, superClass); }
function Income_setPrototypeOf(o, p) { Income_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return Income_setPrototypeOf(o, p); }


/**
 * Class representing an income account.
 * Inherits from Account.
 */
var Income = /*#__PURE__*/function (_Account) {
  /**
   * Create an income account.
   * @param {string} name - The name of the income account.
   * @param {number} initialBalance - The initial balance of the income account, often starts at 0.
   */
  function Income(name) {
    var initialBalance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    Income_classCallCheck(this, Income);
    return Income_callSuper(this, Income, [name, initialBalance, false]); // Income increases on credit, hence isDebitPositive is false
  }

  // Additional methods specific to Income accounts can be added here if needed in the future
  Income_inherits(Income, _Account);
  return Income_createClass(Income);
}(accounts_Account);
/* harmony default export */ var accounts_Income = (Income);
;// CONCATENATED MODULE: ./src/classes/accounts/Expense.js
function Expense_typeof(o) { "@babel/helpers - typeof"; return Expense_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, Expense_typeof(o); }
function Expense_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, Expense_toPropertyKey(descriptor.key), descriptor); } }
function Expense_createClass(Constructor, protoProps, staticProps) { if (protoProps) Expense_defineProperties(Constructor.prototype, protoProps); if (staticProps) Expense_defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function Expense_toPropertyKey(t) { var i = Expense_toPrimitive(t, "string"); return "symbol" == Expense_typeof(i) ? i : i + ""; }
function Expense_toPrimitive(t, r) { if ("object" != Expense_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != Expense_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Expense_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function Expense_callSuper(t, o, e) { return o = Expense_getPrototypeOf(o), Expense_possibleConstructorReturn(t, Expense_isNativeReflectConstruct() ? Reflect.construct(o, e || [], Expense_getPrototypeOf(t).constructor) : o.apply(t, e)); }
function Expense_possibleConstructorReturn(self, call) { if (call && (Expense_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return Expense_assertThisInitialized(self); }
function Expense_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function Expense_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (Expense_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function Expense_getPrototypeOf(o) { Expense_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return Expense_getPrototypeOf(o); }
function Expense_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) Expense_setPrototypeOf(subClass, superClass); }
function Expense_setPrototypeOf(o, p) { Expense_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return Expense_setPrototypeOf(o, p); }


/**
 * Class representing an expense account.
 * Inherits from Account.
 */
var Expense = /*#__PURE__*/function (_Account) {
  /**
   * Create an expense account.
   * @param {string} name - The name of the expense account.
   * @param {number} initialBalance - The initial balance of the expense account, often starts at 0.
   */
  function Expense(name) {
    var initialBalance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    Expense_classCallCheck(this, Expense);
    return Expense_callSuper(this, Expense, [name, initialBalance, true]); // Expenses increase on debit, hence isDebitPositive is true
  }

  // Additional methods specific to Expense accounts can be added here if needed in the future
  Expense_inherits(Expense, _Account);
  return Expense_createClass(Expense);
}(accounts_Account);
/* harmony default export */ var accounts_Expense = (Expense);
;// CONCATENATED MODULE: ./src/classes/transactions/JournalEntry.js
function JournalEntry_typeof(o) { "@babel/helpers - typeof"; return JournalEntry_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, JournalEntry_typeof(o); }
function JournalEntry_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function JournalEntry_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, JournalEntry_toPropertyKey(descriptor.key), descriptor); } }
function JournalEntry_createClass(Constructor, protoProps, staticProps) { if (protoProps) JournalEntry_defineProperties(Constructor.prototype, protoProps); if (staticProps) JournalEntry_defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function JournalEntry_toPropertyKey(t) { var i = JournalEntry_toPrimitive(t, "string"); return "symbol" == JournalEntry_typeof(i) ? i : i + ""; }
function JournalEntry_toPrimitive(t, r) { if ("object" != JournalEntry_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != JournalEntry_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var JournalEntry = /*#__PURE__*/function () {
  /**
   * Creates a journal entry for recording transactions.
   * @param {string} description - Description of the journal entry.
   * @param {Date} [date=new Date()] - Date of the journal entry, defaults to the current date.
   */
  function JournalEntry(description) {
    var date = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Date();
    JournalEntry_classCallCheck(this, JournalEntry);
    this.description = description;
    this.date = date;
    this.entries = [];
  }

  /**
   * Adds a transaction entry to the journal.
   * @param {Account} account - The account affected by this entry.
   * @param {number} amount - The monetary amount of the entry.
   * @param {'debit'|'credit'} type - The type of the entry, either 'debit' or 'credit'.
   */
  return JournalEntry_createClass(JournalEntry, [{
    key: "addEntry",
    value: function addEntry(account, amount, type) {
      if (!account || typeof account.debit !== 'function' || typeof account.credit !== 'function') {
        throw new Error('Invalid account passed to JournalEntry.');
      }
      this.entries.push({
        account: account,
        amount: amount,
        type: type
      });
    }

    /**
     * Commits the journal entry by applying all recorded transactions to their respective accounts.
     * Ensures that the total debits equal the total credits before committing.
     * @throws {Error} if the debits and credits are not balanced.
     */
  }, {
    key: "commit",
    value: function commit() {
      var totalDebits = this.entries.filter(function (e) {
        return e.type === 'debit';
      }).reduce(function (sum, e) {
        return sum + e.amount;
      }, 0);
      var totalCredits = this.entries.filter(function (e) {
        return e.type === 'credit';
      }).reduce(function (sum, e) {
        return sum + e.amount;
      }, 0);
      if (totalDebits !== totalCredits) {
        throw new Error('Debits and credits must balance before committing a journal entry.');
      }

      // Apply all the recorded transactions to their respective accounts
      this.entries.forEach(function (entry) {
        entry.account[entry.type](entry.amount);
      });
    }

    /**
     * Returns details of all entries in the journal entry.
     * @return {Object[]} An array of entry details including account name, amount, type, date, and description.
     */
  }, {
    key: "getDetails",
    value: function getDetails() {
      var _this = this;
      return this.entries.map(function (entry) {
        return {
          accountName: entry.account.name,
          amount: entry.amount,
          type: entry.type,
          date: _this.date,
          description: _this.description
        };
      });
    }
  }]);
}();
/* harmony default export */ var transactions_JournalEntry = (JournalEntry);
;// CONCATENATED MODULE: ./src/index.js
// Importing classes using ES Modules syntax








var __webpack_exports__Account = __webpack_exports__.gD;
var __webpack_exports__Asset = __webpack_exports__.Vd;
var __webpack_exports__Equity = __webpack_exports__.ul;
var __webpack_exports__Expense = __webpack_exports__.X2;
var __webpack_exports__Income = __webpack_exports__.a$;
var __webpack_exports__JournalEntry = __webpack_exports__.Wo;
var __webpack_exports__Liability = __webpack_exports__.eu;
export { __webpack_exports__Account as Account, __webpack_exports__Asset as Asset, __webpack_exports__Equity as Equity, __webpack_exports__Expense as Expense, __webpack_exports__Income as Income, __webpack_exports__JournalEntry as JournalEntry, __webpack_exports__Liability as Liability };
