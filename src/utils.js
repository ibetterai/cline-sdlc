/**
 * Sample utility functions for AI SDLC demonstration
 */

/**
 * Adds two numbers together
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
function add (a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a + b;
}

/**
 * Formats a string with proper capitalization
 * @param {string} str - String to format
 * @returns {string} Formatted string
 */
function formatString (str) {
  if (typeof str !== 'string') {
    throw new Error('Argument must be a string');
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function validateEmail (email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

class Calculator {
  constructor () {
    this.history = [];
  }

  add (a, b) {
    const result = a + b;
    this.history.push({ operation: 'add', a, b, result });
    return result;
  }

  subtract (a, b) {
    const result = a - b;
    this.history.push({ operation: 'subtract', a, b, result });
    return result;
  }

  getHistory () {
    return this.history;
  }

  clearHistory () {
    this.history = [];
  }
}

module.exports = {
  add,
  formatString,
  validateEmail,
  Calculator
};
