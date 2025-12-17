#!/usr/bin/env node

/**
 * AI-Test Generator
 * Generates unit tests based on code analysis using AI patterns
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class AITestGenerator {
  constructor () {
    this.srcDir = 'src';
    this.testDir = 'tests';
    this.patterns = {
      functions: /function\s+(\w+)\s*\([^)]*\)\s*{/g,
      classes: /class\s+(\w+)/g,
      methods: /(\w+)\s*:\s*function|(\w+)\s*\([^)]*\)\s*{/g,
      exports: /module\.exports|exports\./g
    };
  }

  /**
   * Analyze source code and generate tests
   */
  async generateTests () {
    console.log(chalk.blue('🤖 AI Test Generator Starting...'));

    try {
      // Ensure test directory exists
      if (!fs.existsSync(this.testDir)) {
        fs.mkdirSync(this.testDir, { recursive: true });
      }

      // Find all JavaScript files in src directory
      const sourceFiles = this.findSourceFiles();

      for (const file of sourceFiles) {
        await this.generateTestsForFile(file);
      }

      console.log(chalk.green('✅ AI Test Generation Complete!'));
    } catch (error) {
      console.error(chalk.red('❌ Error generating tests:'), error.message);
    }
  }

  /**
   * Find all source files to analyze
   */
  findSourceFiles () {
    if (!fs.existsSync(this.srcDir)) {
      console.log(chalk.yellow('⚠️  No src directory found. Creating sample structure...'));
      fs.mkdirSync(this.srcDir, { recursive: true });

      // Create a sample file for demonstration
      this.createSampleCode();
    }

    const files = [];
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.js') && !item.endsWith('.test.js')) {
          files.push(fullPath);
        }
      }
    };

    scanDir(this.srcDir);
    return files;
  }

  /**
   * Create sample code for demonstration
   */
  createSampleCode () {
    const sampleCode = `
/**
 * Sample utility functions for AI SDLC demonstration
 */

/**
 * Adds two numbers together
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
function add(a, b) {
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
function formatString(str) {
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
function validateEmail(email) {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}

class Calculator {
  constructor() {
    this.history = [];
  }

  add(a, b) {
    const result = a + b;
    this.history.push({ operation: 'add', a, b, result });
    return result;
  }

  subtract(a, b) {
    const result = a - b;
    this.history.push({ operation: 'subtract', a, b, result });
    return result;
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
  }
}

module.exports = {
  add,
  formatString,
  validateEmail,
  Calculator
};
`;

    fs.writeFileSync(path.join(this.srcDir, 'utils.js'), sampleCode);
    console.log(chalk.green('✅ Created sample source code for demonstration'));
  }

  /**
   * Generate tests for a specific file
   */
  async generateTestsForFile (filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    const testName = path.basename(filePath, '.js') + '.test.js';
    const testPath = path.join(this.testDir, testName);

    console.log(chalk.blue(`📝 Generating tests for ${relativePath}...`));

    // Analyze code structure
    const analysis = this.analyzeCode(content);

    // Generate test file content
    const testContent = this.generateTestContent(relativePath, analysis);

    // Write test file
    fs.writeFileSync(testPath, testContent);
    console.log(chalk.green(`✅ Generated ${testName}`));
  }

  /**
   * Analyze code structure to identify testable elements
   */
  analyzeCode (content) {
    const analysis = {
      functions: [],
      classes: [],
      methods: [],
      exports: []
    };

    // Find functions
    let match;
    while ((match = this.patterns.functions.exec(content)) !== null) {
      analysis.functions.push(match[1]);
    }

    // Find classes
    while ((match = this.patterns.classes.exec(content)) !== null) {
      analysis.classes.push(match[1]);
    }

    // Check for exports
    if (this.patterns.exports.test(content)) {
      analysis.exports.push(true);
    }

    return analysis;
  }

  /**
   * Generate test content based on analysis
   */
  generateTestContent (filePath, analysis) {
    const content = `
/**
 * AI-Generated Tests for ${filePath}
 * Generated on: ${new Date().toISOString()}
 */

const { ${analysis.functions.concat(analysis.classes).join(', ')} } = require('${filePath.replace('.js', '')}');
const { expect, test, describe } = require('@jest/globals');

describe('${path.basename(filePath, '.js')}', () => {
${this.generateFunctionTests(analysis.functions)}
${this.generateClassTests(analysis.classes)}
});
`;

    return content;
  }

  /**
   * Generate tests for functions
   */
  generateFunctionTests (functions) {
    if (functions.length === 0) return '';

    return functions.map(func => {
      return `
  describe('${func}', () => {
    test('should exist', () => {
      expect(typeof ${func}).toBe('function');
    });

    test('should handle valid inputs', () => {
      // TODO: Add specific test cases for ${func}
      // This is a template - customize based on function behavior
      const result = ${func}();
      expect(result).toBeDefined();
    });

    test('should handle edge cases', () => {
      // TODO: Add edge case testing
      expect(() => ${func}()).not.toThrow();
    });
  });`;
    }).join('\n');
  }

  /**
   * Generate tests for classes
   */
  generateClassTests (classes) {
    if (classes.length === 0) return '';

    return classes.map(cls => {
      return `
  describe('${cls}', () => {
    test('should be instantiable', () => {
      const instance = new ${cls}();
      expect(instance).toBeInstanceOf(${cls});
    });

    test('should have expected methods', () => {
      const instance = new ${cls}();
      // TODO: Add method existence checks
      expect(typeof instance).toBe('object');
    });
  });`;
    }).join('\n');
  }
}

// Run the test generator
if (require.main === module) {
  const generator = new AITestGenerator();
  generator.generateTests().catch(console.error);
}

module.exports = AITestGenerator;
