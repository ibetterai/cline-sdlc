/**
 * AI-Generated Tests for src/utils.js
 * Generated on: 2025-12-17T22:42:07.582Z
 */

const { add, formatString, validateEmail, Calculator } = require('../src/utils');
const { expect, test, describe } = require('@jest/globals');

describe('utils', () => {
  describe('add', () => {
    test('should exist', () => {
      expect(typeof add).toBe('function');
    });

    test('should handle valid inputs', () => {
      const result = add(2, 3);
      expect(result).toBe(5);
    });

    test('should handle edge cases', () => {
      expect(() => add('a', 'b')).toThrow();
      expect(() => add(null, 5)).toThrow();
    });
  });

  describe('formatString', () => {
    test('should exist', () => {
      expect(typeof formatString).toBe('function');
    });

    test('should handle valid inputs', () => {
      const result = formatString('hello world');
      expect(result).toBe('Hello world');
    });

    test('should handle edge cases', () => {
      expect(() => formatString(123)).toThrow();
      expect(() => formatString(null)).toThrow();
    });
  });

  describe('validateEmail', () => {
    test('should exist', () => {
      expect(typeof validateEmail).toBe('function');
    });

    test('should handle valid inputs', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    test('should handle invalid inputs', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('Calculator', () => {
    test('should be instantiable', () => {
      const instance = new Calculator();
      expect(instance).toBeInstanceOf(Calculator);
    });

    test('should perform addition correctly', () => {
      const calc = new Calculator();
      expect(calc.add(2, 3)).toBe(5);
      expect(calc.getHistory()).toHaveLength(1);
    });

    test('should perform subtraction correctly', () => {
      const calc = new Calculator();
      expect(calc.subtract(5, 2)).toBe(3);
      expect(calc.getHistory()).toHaveLength(1);
    });

    test('should handle history correctly', () => {
      const calc = new Calculator();
      calc.add(1, 2);
      calc.subtract(5, 3);
      const history = calc.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].operation).toBe('add');
      expect(history[1].operation).toBe('subtract');
    });

    test('should clear history', () => {
      const calc = new Calculator();
      calc.add(1, 2);
      calc.clearHistory();
      expect(calc.getHistory()).toHaveLength(0);
    });
  });
});
