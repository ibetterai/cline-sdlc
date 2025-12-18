#!/usr/bin/env node

/**
 * AI PR Test Generator
 * Generates tests specifically for pull request changes
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

class PRTestGenerator {
  constructor () {
    this.testResults = {
      generatedTests: [],
      coverage: {},
      summary: {}
    };
  }

  async generateTests () {
    console.log(chalk.blue('🧪 AI PR Test Generation Starting...'));

    try {
      // Get changed files in PR
      const changedFiles = this.getChangedFiles();

      for (const file of changedFiles) {
        await this.generateTestsForFile(file);
      }

      this.generateTestReport();
      this.updateTestFiles();

      console.log(chalk.green('✅ PR Test Generation Complete!'));
      console.log(chalk.blue(`📊 Generated ${this.testResults.generatedTests.length} tests`));

      return this.testResults;
    } catch (error) {
      console.error(chalk.red('❌ Error during PR test generation:'), error.message);
      throw error;
    }
  }

  getChangedFiles () {
    try {
      // Get changed files from git
      const output = execSync('git diff --name-only origin/main...HEAD', { encoding: 'utf8' });
      return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not get changed files, using all files'));
      return this.findAllJSFiles();
    }
  }

  findAllJSFiles () {
    const files = [];
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];

    const scanDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !['node_modules', '.git', 'coverage', 'dist'].includes(item)) {
            scanDir(fullPath);
          } else {
            const ext = path.extname(item);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    scanDir('.');
    return files;
  }

  async generateTestsForFile (filePath) {
    if (!this.isTestableFile(filePath)) {
      return;
    }

    console.log(chalk.blue(`📝 Generating tests for ${filePath}...`));

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const testPath = this.getTestFilePath(filePath);

      const fileAnalysis = {
        originalFile: filePath,
        testFile: testPath,
        functions: this.extractFunctions(content),
        classes: this.extractClasses(content),
        exports: this.extractExports(content)
      };

      // Generate tests for each function/class
      const tests = this.generateTestsForAnalysis(fileAnalysis);

      this.testResults.generatedTests.push(...tests);
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not generate tests for ${filePath}: ${error.message}`));
    }
  }

  isTestableFile (filePath) {
    const ext = path.extname(filePath);
    return ['.js', '.jsx', '.ts', '.tsx'].includes(ext) &&
           !filePath.includes('.test.') &&
           !filePath.includes('.spec.') &&
           !filePath.includes('node_modules') &&
           !filePath.includes('coverage');
  }

  getTestFilePath (originalPath) {
    const dir = path.dirname(originalPath);
    const name = path.basename(originalPath, path.extname(originalPath));
    const ext = path.extname(originalPath);

    return path.join(dir, `${name}.test${ext}`);
  }

  extractFunctions (content) {
    const functions = [];

    // Function declarations
    const funcMatches = content.match(/function\s+(\w+)\s*\([^)]*\)/g) || [];
    for (const match of funcMatches) {
      const name = match.match(/function\s+(\w+)/)[1];
      functions.push({ name, type: 'declaration' });
    }

    // Arrow functions assigned to variables
    const arrowMatches = content.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*{|\w+\s*=>)/g) || [];
    for (const match of arrowMatches) {
      const name = match.match(/(?:const|let|var)\s+(\w+)/)[1];
      functions.push({ name, type: 'arrow' });
    }

    // Method definitions
    const methodMatches = content.match(/(\w+)\s*\([^)]*\)\s*{/g) || [];
    for (const match of methodMatches) {
      const name = match.match(/(\w+)\s*\(/)[1];
      if (!['if', 'while', 'for', 'switch', 'catch'].includes(name)) {
        functions.push({ name, type: 'method' });
      }
    }

    return functions;
  }

  extractClasses (content) {
    const classes = [];
    const matches = content.match(/class\s+(\w+)/g) || [];

    for (const match of matches) {
      const name = match.match(/class\s+(\w+)/)[1];
      classes.push({ name });
    }

    return classes;
  }

  extractExports (content) {
    const exports = [];

    // Default exports
    if (content.includes('export default')) {
      exports.push({ type: 'default', name: 'default' });
    }

    // Named exports
    const namedMatches = content.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/g) || [];
    for (const match of namedMatches) {
      const name = match.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/)[1];
      exports.push({ type: 'named', name });
    }

    return exports;
  }

  generateTestsForAnalysis (fileAnalysis) {
    const tests = [];

    // Generate tests for functions
    for (const func of fileAnalysis.functions) {
      tests.push(this.generateFunctionTest(func, fileAnalysis));
    }

    // Generate tests for classes
    for (const cls of fileAnalysis.classes) {
      tests.push(this.generateClassTest(cls, fileAnalysis));
    }

    // Generate tests for exports
    for (const exp of fileAnalysis.exports) {
      tests.push(this.generateExportTest(exp, fileAnalysis));
    }

    return tests;
  }

  generateFunctionTest (func, fileAnalysis) {
    const testCode = `
/**
 * Auto-generated test for ${func.name} function
 */
describe('${func.name}', () => {
  test('should be defined', () => {
    expect(${func.name}).toBeDefined();
  });

  test('should be a function', () => {
    expect(typeof ${func.name}).toBe('function');
  });

  test('should handle valid inputs', () => {
    // TODO: Add specific test cases based on function implementation
    const result = ${func.name}();
    // Add assertions based on expected behavior
  });

  test('should handle edge cases', () => {
    // TODO: Add edge case tests
    expect(() => ${func.name}(null)).not.toThrow();
    expect(() => ${func.name}(undefined)).not.toThrow();
  });
});`;

    return {
      type: 'function',
      name: func.name,
      file: fileAnalysis.testFile,
      code: testCode.trim()
    };
  }

  generateClassTest (cls, fileAnalysis) {
    const testCode = `
/**
 * Auto-generated test for ${cls.name} class
 */
describe('${cls.name}', () => {
  test('should be defined', () => {
    expect(${cls.name}).toBeDefined();
  });

  test('should be instantiable', () => {
    const instance = new ${cls.name}();
    expect(instance).toBeInstanceOf(${cls.name});
  });

  test('should have expected properties', () => {
    // TODO: Add property tests based on class implementation
    const instance = new ${cls.name}();
    // Add property assertions
  });
});`;

    return {
      type: 'class',
      name: cls.name,
      file: fileAnalysis.testFile,
      code: testCode.trim()
    };
  }

  generateExportTest (exp, fileAnalysis) {
    const importStatement = this.generateImportStatement(fileAnalysis.originalFile);

    const testCode = `
/**
 * Auto-generated test for export: ${exp.name}
 */
${importStatement}

describe('Export: ${exp.name}', () => {
  test('should export ${exp.name}', () => {
    expect(${exp.name}).toBeDefined();
  });
});`;

    return {
      type: 'export',
      name: exp.name,
      file: fileAnalysis.testFile,
      code: testCode.trim()
    };
  }

  generateImportStatement (originalPath) {
    const relativePath = path.relative(process.cwd(), originalPath);
    const importPath = './' + relativePath.replace(/\.(js|jsx|ts|tsx)$/, '');

    return `import { ${this.extractExportNames(originalPath)} } from '${importPath}';`;
  }

  extractExportNames (filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const names = [];

      // Find exported names
      const namedExports = content.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/g) || [];
      for (const match of namedExports) {
        const name = match.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/)[1];
        names.push(name);
      }

      return names.join(', ') || 'moduleName';
    } catch (error) {
      return 'moduleName';
    }
  }

  generateTestReport () {
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: this.testResults.generatedTests.length,
      testTypes: this.groupTestsByType(),
      filesAffected: [...new Set(this.testResults.generatedTests.map(t => t.file))],
      coverage: this.estimateCoverage()
    };

    fs.writeFileSync('pr-test-generation-report.json', JSON.stringify(report, null, 2));
  }

  groupTestsByType () {
    const grouped = {};

    for (const test of this.testResults.generatedTests) {
      if (!grouped[test.type]) {
        grouped[test.type] = [];
      }
      grouped[test.type].push(test);
    }

    return grouped;
  }

  estimateCoverage () {
    const files = [...new Set(this.testResults.generatedTests.map(t => t.file))];
    const functions = this.testResults.generatedTests.filter(t => t.type === 'function').length;
    const classes = this.testResults.generatedTests.filter(t => t.type === 'class').length;
    const exports = this.testResults.generatedTests.filter(t => t.type === 'export').length;

    return {
      filesTested: files.length,
      functionsTested: functions,
      classesTested: classes,
      exportsTested: exports,
      estimatedCoverage: Math.min(100, (functions + classes + exports) * 10) // Rough estimate
    };
  }

  updateTestFiles () {
    const filesToUpdate = [...new Set(this.testResults.generatedTests.map(t => t.file))];

    for (const file of filesToUpdate) {
      const tests = this.testResults.generatedTests.filter(t => t.file === file);
      this.writeTestFile(file, tests);
    }
  }

  writeTestFile (testFile, tests) {
    try {
      let existingContent = '';

      // Read existing test file if it exists
      if (fs.existsSync(testFile)) {
        existingContent = fs.readFileSync(testFile, 'utf8');
      }

      // Generate new test content
      const newTests = tests.map(t => t.code).join('\n\n');

      // Check if tests already exist
      const hasExistingTests = existingContent.includes('describe(');

      let finalContent;
      if (hasExistingTests) {
        // Append new tests to existing file
        finalContent = existingContent + '\n\n' + newTests;
      } else {
        // Create new test file
        finalContent = this.generateTestFileHeader(testFile) + '\n\n' + newTests;
      }

      // Ensure directory exists
      const dir = path.dirname(testFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(testFile, finalContent);
      console.log(chalk.green(`✓ Updated ${testFile}`));
    } catch (error) {
      console.error(chalk.red(`❌ Error writing test file ${testFile}:`), error.message);
    }
  }

  generateTestFileHeader (testFile) {
    const relativePath = path.relative(process.cwd(), testFile);
    return `/**
 * Test file for ${relativePath}
 * Auto-generated by AI PR Test Generator
 * Generated on: ${new Date().toISOString()}
 */

const { expect, test, describe } = require('@jest/globals');`;
  }
}

// Run PR test generator
if (require.main === module) {
  const generator = new PRTestGenerator();
  generator.generateTests().catch(console.error);
}

module.exports = PRTestGenerator;
