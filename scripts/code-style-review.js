#!/usr/bin/env node

/**
 * AI Code Style Review System
 * Analyzes code for style violations and best practices
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class CodeStyleReviewer {
  constructor () {
    this.results = {
      score: 0,
      violations: [],
      suggestions: [],
      metrics: {},
      summary: {}
    };

    this.stylePatterns = {
      formatting: [
        {
          pattern: /^\s*\t/m,
          message: 'Use spaces instead of tabs for indentation',
          severity: 'medium',
          autoFixable: true
        },
        {
          pattern: /;\s*\n\s*}/m,
          message: 'Unnecessary semicolon before closing brace',
          severity: 'low',
          autoFixable: true
        },
        {
          pattern: /\s+\n\s*\n\s*\n/m,
          message: 'Too many consecutive blank lines',
          severity: 'low',
          autoFixable: true
        }
      ],
      naming: [
        {
          pattern: /\b(a|an|the|is|has|have)\s+[a-z][A-Z]/,
          message: 'Variable names should follow camelCase convention',
          severity: 'medium',
          autoFixable: false
        },
        {
          pattern: /function\s+[A-Z]/,
          message: 'Function names should use camelCase, not PascalCase',
          severity: 'medium',
          autoFixable: false
        },
        {
          pattern: /const\s+[A-Z]/,
          message: 'Constants should use UPPER_SNAKE_CASE',
          severity: 'low',
          autoFixable: false
        }
      ],
      structure: [
        {
          pattern: /if\s*\([^)]+\)\s*[^{]/,
          message: 'Use braces for single-line if statements',
          severity: 'medium',
          autoFixable: true
        },
        {
          pattern: /for\s*\([^)]+\)\s*[^{]/,
          message: 'Use braces for single-line for loops',
          severity: 'medium',
          autoFixable: true
        },
        {
          pattern: /while\s*\([^)]+\)\s*[^{]/,
          message: 'Use braces for single-line while loops',
          severity: 'medium',
          autoFixable: true
        }
      ],
      bestPractices: [
        {
          pattern: /var\s+\w+/,
          message: 'Use let or const instead of var',
          severity: 'medium',
          autoFixable: true
        },
        {
          pattern: /==\s*[^=]/,
          message: 'Use === for strict equality comparison',
          severity: 'medium',
          autoFixable: true
        },
        {
          pattern: /!=\s*[^=]/,
          message: 'Use !== for strict inequality comparison',
          severity: 'medium',
          autoFixable: true
        },
        {
          pattern: /function\s*\(\s*\)\s*{[\s]*}/,
          message: 'Empty function should have a comment explaining why',
          severity: 'low',
          autoFixable: false
        }
      ]
    };
  }

  async review (targetPath = '.') {
    console.log(chalk.blue('📝 AI Code Style Review Starting...'));

    try {
      const files = this.findFilesToReview(targetPath);

      for (const file of files) {
        await this.reviewFile(file);
      }

      this.calculateScore();
      this.generateReport();

      console.log(chalk.green('✅ Code Style Review Complete!'));
      console.log(chalk.blue(`📊 Style Score: ${this.results.score}/100`));

      return this.results;
    } catch (error) {
      console.error(chalk.red('❌ Error during style review:'), error.message);
      throw error;
    }
  }

  findFilesToReview (targetPath) {
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

    scanDir(targetPath);
    return files;
  }

  async reviewFile (filePath) {
    console.log(chalk.blue(`📋 Reviewing ${path.relative(process.cwd(), filePath)}...`));

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);

      const fileAnalysis = {
        file: relativePath,
        violations: [],
        suggestions: [],
        metrics: this.calculateFileMetrics(content)
      };

      // Check for style violations
      this.checkStylePatterns(content, fileAnalysis);

      // Generate suggestions
      this.generateSuggestions(content, fileAnalysis);

      this.results.violations.push(...fileAnalysis.violations);
      this.results.suggestions.push(...fileAnalysis.suggestions);
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not review ${filePath}: ${error.message}`));
    }
  }

  checkStylePatterns (content, fileAnalysis) {
    const lines = content.split('\n');

    for (const [category, patterns] of Object.entries(this.stylePatterns)) {
      for (const { pattern, message, severity, autoFixable } of patterns) {
        const matches = content.match(new RegExp(pattern, 'gm'));
        if (matches) {
          for (const match of matches) {
            const index = content.indexOf(match);
            const lineNumber = content.substring(0, index).split('\n').length;

            fileAnalysis.violations.push({
              category,
              severity,
              message,
              autoFixable,
              line: lineNumber,
              code: match.trim()
            });
          }
        }
      }
    }
  }

  generateSuggestions (content, fileAnalysis) {
    // Suggest adding JSDoc comments
    const functions = content.match(/function\s+\w+|=>\s*{|\w+\s*:\s*function/g) || [];
    const jsdocComments = content.match(/\/\*\*[\s\S]*?\*\//g) || [];

    if (functions.length > jsdocComments.length) {
      fileAnalysis.suggestions.push({
        type: 'documentation',
        message: `Add JSDoc comments to ${functions.length - jsdocComments.length} function(s)`
      });
    }

    // Suggest adding input validation
    if (content.includes('function') && !content.includes('typeof')) {
      fileAnalysis.suggestions.push({
        type: 'validation',
        message: 'Consider adding input validation to functions'
      });
    }

    // Suggest error handling
    if (content.includes('try') && !content.includes('catch')) {
      fileAnalysis.suggestions.push({
        type: 'error-handling',
        message: 'Consider adding error handling with try-catch blocks'
      });
    }

    // Suggest consistent return statements
    if (content.includes('return') && content.includes('if')) {
      fileAnalysis.suggestions.push({
        type: 'consistency',
        message: 'Ensure consistent return statement patterns in functions'
      });
    }

    // Suggest modern syntax
    if (content.includes('.bind(this)')) {
      fileAnalysis.suggestions.push({
        type: 'modernization',
        message: 'Consider using arrow functions instead of .bind()'
      });
    }
  }

  calculateFileMetrics (content) {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line =>
      line.trim().startsWith('//') ||
      line.trim().startsWith('/*') ||
      line.trim().startsWith('*') ||
      line.trim().startsWith('*')
    );

    const functions = (content.match(/function\s+\w+|=>\s*{|\w+\s*:\s*function/g) || []).length;
    const arrowFunctions = (content.match(/=>\s*{/g) || []).length;
    const constDeclarations = (content.match(/const\s+/g) || []).length;
    const letDeclarations = (content.match(/let\s+/g) || []).length;
    const varDeclarations = (content.match(/var\s+/g) || []).length;

    return {
      totalLines: lines.length,
      codeLines: nonEmptyLines.length,
      commentLines: commentLines.length,
      functions,
      arrowFunctions,
      constDeclarations,
      letDeclarations,
      varDeclarations,
      commentRatio: commentLines.length / nonEmptyLines.length || 0,
      modernizationScore: (arrowFunctions + constDeclarations + letDeclarations) / (functions + 1)
    };
  }

  calculateScore () {
    let score = 100;

    // Deduct points for violations
    for (const violation of this.results.violations) {
      switch (violation.severity) {
      case 'high':
        score -= 10;
        break;
      case 'medium':
        score -= 5;
        break;
      case 'low':
        score -= 2;
        break;
      }
    }

    // Bonus points for modern practices
    const modernFiles = this.calculateModernizationBonus();
    score += Math.min(modernFiles * 5, 20);

    this.results.score = Math.max(0, Math.min(100, score));
  }

  calculateModernizationBonus () {
    // Calculate bonus based on modern JavaScript usage
    const totalConst = this.results.metrics.const || 0;
    const totalLet = this.results.metrics.let || 0;
    const totalVar = this.results.metrics.var || 0;
    const totalFunctions = this.results.metrics.functions || 0;
    const totalArrowFunctions = this.results.metrics.arrowFunctions || 0;

    const modernizationRatio = (totalConst + totalLet + totalArrowFunctions) /
                            (totalConst + totalLet + totalVar + totalFunctions + 1);

    return Math.floor(modernizationRatio * 10);
  }

  generateReport () {
    const report = {
      timestamp: new Date().toISOString(),
      score: this.results.score,
      totalViolations: this.results.violations.length,
      totalSuggestions: this.results.suggestions.length,
      violationsByCategory: this.groupViolationsByCategory(),
      violationsBySeverity: this.groupViolationsBySeverity(),
      autoFixableViolations: this.results.violations.filter(v => v.autoFixable).length,
      recommendations: this.generateRecommendations()
    };

    // Calculate overall metrics
    this.calculateOverallMetrics();

    // Save detailed report
    fs.writeFileSync('code-style-review-results.json', JSON.stringify(report, null, 2));

    // Generate style guide suggestions
    this.generateStyleGuideSuggestions(report);
  }

  groupViolationsByCategory () {
    const grouped = {};

    for (const violation of this.results.violations) {
      if (!grouped[violation.category]) {
        grouped[violation.category] = [];
      }
      grouped[violation.category].push(violation);
    }

    return grouped;
  }

  groupViolationsBySeverity () {
    const grouped = { high: [], medium: [], low: [] };

    for (const violation of this.results.violations) {
      grouped[violation.severity].push(violation);
    }

    return grouped;
  }

  calculateOverallMetrics () {
    const files = this.findFilesToReview('.');
    let totalLines = 0;
    let totalFunctions = 0;
    let totalConst = 0;
    let totalLet = 0;
    let totalVar = 0;
    let totalArrowFunctions = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const metrics = this.calculateFileMetrics(content);

        totalLines += metrics.totalLines;
        totalFunctions += metrics.functions;
        totalConst += metrics.constDeclarations;
        totalLet += metrics.letDeclarations;
        totalVar += metrics.varDeclarations;
        totalArrowFunctions += metrics.arrowFunctions;
      } catch (error) {
        // Skip files that can't be read
      }
    }

    this.results.metrics = {
      totalLines,
      totalFunctions,
      totalConst,
      totalLet,
      totalVar,
      totalArrowFunctions,
      modernizationScore: (totalConst + totalLet + totalArrowFunctions) /
                         (totalConst + totalLet + totalVar + totalFunctions + 1)
    };
  }

  generateRecommendations () {
    const recommendations = [];

    if (this.results.violations.length === 0) {
      recommendations.push({
        priority: 'info',
        message: '🎉 Excellent code style! No violations detected.'
      });
      return recommendations;
    }

    const autoFixableCount = this.results.violations.filter(v => v.autoFixable).length;
    if (autoFixableCount > 0) {
      recommendations.push({
        priority: 'high',
        message: `🔧 ${autoFixableCount} violations can be auto-fixed with lint:fix`
      });
    }

    const highSeverityCount = this.results.violations.filter(v => v.severity === 'high').length;
    if (highSeverityCount > 0) {
      recommendations.push({
        priority: 'critical',
        message: `🚨 ${highSeverityCount} high-severity violations need immediate attention`
      });
    }

    const modernizationScore = this.results.metrics.modernizationScore;
    if (modernizationScore < 0.5) {
      recommendations.push({
        priority: 'medium',
        message: '🔄 Consider modernizing code with ES6+ features (const/let, arrow functions)'
      });
    }

    const categoryGroups = this.groupViolationsByCategory();
    if (categoryGroups.naming && categoryGroups.naming.length > 3) {
      recommendations.push({
        priority: 'medium',
        message: '📝 Establish and enforce consistent naming conventions'
      });
    }

    return recommendations;
  }

  generateStyleGuideSuggestions (report) {
    const styleGuide = {
      timestamp: new Date().toISOString(),
      recommendations: {
        indentation: 'Use 2 spaces for indentation',
        naming: {
          variables: 'camelCase for variables and functions',
          constants: 'UPPER_SNAKE_CASE for constants',
          classes: 'PascalCase for classes and constructors'
        },
        structure: 'Always use braces for control statements',
        comparisons: 'Use === and !== for strict comparison',
        declarations: 'Prefer const and let over var'
      },
      enforcements: [
        'Configure ESLint with appropriate rules',
        'Set up pre-commit hooks for style checking',
        'Use Prettier for consistent formatting',
        'Enable auto-fix on save in IDE'
      ]
    };

    fs.writeFileSync('style-guide-suggestions.json', JSON.stringify(styleGuide, null, 2));
  }
}

// Run code style reviewer
if (require.main === module) {
  const reviewer = new CodeStyleReviewer();
  const targetPath = process.argv[2] || '.';
  reviewer.review(targetPath).catch(console.error);
}

module.exports = CodeStyleReviewer;
