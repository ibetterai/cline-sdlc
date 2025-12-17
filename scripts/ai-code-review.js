#!/usr/bin/env node

/**
 * AI Code Review System
 * Performs intelligent code analysis and review using AI patterns
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class AICodeReviewer {
  constructor () {
    this.reviewResults = {
      score: 0,
      issues: [],
      suggestions: [],
      positives: [],
      fileAnalysis: []
    };

    this.patterns = {
      securityIssues: [
        { pattern: /eval\s*\(/, severity: 'high', message: 'Use of eval() detected - potential security risk' },
        { pattern: /innerHTML\s*=/, severity: 'medium', message: 'innerHTML assignment detected - potential XSS vulnerability' },
        { pattern: /document\.write\s*\(/, severity: 'medium', message: 'document.write() detected - potential security issue' },
        { pattern: /Math\.random\(\)/, severity: 'low', message: 'Math.random() detected - not cryptographically secure' }
      ],
      performanceIssues: [
        { pattern: /for\s*\(\s*.*\s*in\s*.*\s*\)/, severity: 'medium', message: 'for...in loop detected - consider using for...of or Array methods' },
        { pattern: /\.\s*getElementById\s*\(/, severity: 'low', message: 'Direct DOM access - consider caching references' },
        { pattern: /console\.log\s*\(/, severity: 'low', message: 'console.log() detected - remove in production' }
      ],
      codeQuality: [
        { pattern: /var\s+\w+\s*=/, severity: 'low', message: 'var keyword detected - consider using let or const' },
        { pattern: /==\s*[^=]/, severity: 'medium', message: '== operator detected - consider using === for strict equality' },
        { pattern: /function\s*\(\s*\)\s*{/, severity: 'low', message: 'Empty function detected - verify if needed' }
      ]
    };
  }

  /**
   * Perform comprehensive AI code review
   */
  async performReview (targetPath = '.') {
    console.log(chalk.blue('🤖 AI Code Review Starting...'));

    try {
      // Find all relevant files
      const files = this.findFilesToReview(targetPath);

      // Analyze each file
      for (const file of files) {
        await this.analyzeFile(file);
      }

      // Calculate overall score
      this.calculateScore();

      // Generate review report
      await this.generateReviewReport();

      console.log(chalk.green('✅ AI Code Review Complete!'));
      console.log(chalk.blue(`📊 Overall Score: ${this.reviewResults.score}/100`));

      return this.reviewResults;
    } catch (error) {
      console.error(chalk.red('❌ Error during code review:'), error.message);
      throw error;
    }
  }

  /**
   * Find all files to review
   */
  findFilesToReview (targetPath) {
    const files = [];
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];

    const scanDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // Skip node_modules and .git
            if (!['node_modules', '.git', 'coverage', 'dist'].includes(item)) {
              scanDir(fullPath);
            }
          } else {
            const ext = path.extname(item);
            if (extensions.includes(ext) && !item.includes('.test.') && !item.includes('.spec.')) {
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

  /**
   * Analyze a single file
   */
  async analyzeFile (filePath) {
    console.log(chalk.blue(`📝 Analyzing ${path.relative(process.cwd(), filePath)}...`));

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);

      const fileAnalysis = {
        file: relativePath,
        issues: [],
        suggestions: [],
        positives: [],
        metrics: this.calculateMetrics(content)
      };

      // Check for security issues
      this.checkPatterns(content, this.patterns.securityIssues, fileAnalysis.issues);

      // Check for performance issues
      this.checkPatterns(content, this.patterns.performanceIssues, fileAnalysis.issues);

      // Check for code quality issues
      this.checkPatterns(content, this.patterns.codeQuality, fileAnalysis.issues);

      // Generate suggestions based on analysis
      this.generateSuggestions(content, fileAnalysis);

      // Identify positive aspects
      this.identifyPositives(content, fileAnalysis);

      this.reviewResults.fileAnalysis.push(fileAnalysis);

      // Aggregate to overall results
      this.reviewResults.issues.push(...fileAnalysis.issues);
      this.reviewResults.suggestions.push(...fileAnalysis.suggestions);
      this.reviewResults.positives.push(...fileAnalysis.positives);
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not analyze ${filePath}: ${error.message}`));
    }
  }

  /**
   * Check for patterns in code
   */
  checkPatterns (content, patterns, issues) {
    for (const { pattern, severity, message } of patterns) {
      const matches = content.match(new RegExp(pattern, 'g'));
      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          const lines = content.split('\n');
          let lineNumber = 0;

          // Find line number for this occurrence
          const beforeMatch = content.substring(0, content.indexOf(matches[i]));
          lineNumber = beforeMatch.split('\n').length;

          issues.push({
            severity,
            message,
            line: lineNumber,
            pattern: pattern.toString()
          });
        }
      }
    }
  }

  /**
   * Generate improvement suggestions
   */
  generateSuggestions (content, fileAnalysis) {
    // Suggest using modern JavaScript features
    if (content.includes('var ')) {
      fileAnalysis.suggestions.push('Consider using let/const instead of var for better scoping');
    }

    // Suggest adding input validation
    if (content.includes('function') && !content.includes('typeof')) {
      fileAnalysis.suggestions.push('Consider adding input validation to functions');
    }

    // Suggest error handling
    if (content.includes('try') && !content.includes('catch')) {
      fileAnalysis.suggestions.push('Consider adding error handling with try-catch blocks');
    }

    // Suggest documentation
    if (content.includes('function') && !content.includes('/**')) {
      fileAnalysis.suggestions.push('Consider adding JSDoc comments for better documentation');
    }

    // Suggest testing
    if (fileAnalysis.metrics.complexity > 10) {
      fileAnalysis.suggestions.push('Consider reducing complexity or adding more tests');
    }
  }

  /**
   * Identify positive aspects of the code
   */
  identifyPositives (content, fileAnalysis) {
    // Check for good practices
    if (content.includes('use strict')) {
      fileAnalysis.positives.push('Uses strict mode - good practice');
    }

    if (content.includes('/**')) {
      fileAnalysis.positives.push('Includes JSDoc documentation');
    }

    if (content.includes('const ') && !content.includes('var ')) {
      fileAnalysis.positives.push('Uses modern const/let declarations');
    }

    if (content.includes('async ') || content.includes('await ')) {
      fileAnalysis.positives.push('Uses modern async/await syntax');
    }

    if (content.includes('=>')) {
      fileAnalysis.positives.push('Uses arrow functions - modern syntax');
    }

    if (fileAnalysis.metrics.complexity < 5) {
      fileAnalysis.positives.push('Low complexity - easy to maintain');
    }
  }

  /**
   * Calculate code metrics
   */
  calculateMetrics (content) {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line =>
      line.trim().startsWith('//') ||
      line.trim().startsWith('/*') ||
      line.trim().startsWith('*')
    );

    // Simple complexity calculation
    const complexity = (content.match(/if|for|while|switch|catch/g) || []).length;

    return {
      totalLines: lines.length,
      codeLines: nonEmptyLines.length,
      commentLines: commentLines.length,
      complexity,
      commentRatio: commentLines.length / nonEmptyLines.length || 0
    };
  }

  /**
   * Calculate overall review score
   */
  calculateScore () {
    let score = 100;

    // Deduct points for issues
    for (const issue of this.reviewResults.issues) {
      switch (issue.severity) {
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

    // Bonus points for positives
    score += Math.min(this.reviewResults.positives.length * 2, 20);

    // Ensure score is within bounds
    this.reviewResults.score = Math.max(0, Math.min(100, score));
  }

  /**
   * Generate review report
   */
  async generateReviewReport () {
    const report = {
      timestamp: new Date().toISOString(),
      score: this.reviewResults.score,
      summary: {
        totalFiles: this.reviewResults.fileAnalysis.length,
        totalIssues: this.reviewResults.issues.length,
        totalSuggestions: this.reviewResults.suggestions.length,
        totalPositives: this.reviewResults.positives.length
      },
      issuesBySeverity: this.groupIssuesBySeverity(),
      fileAnalysis: this.reviewResults.fileAnalysis,
      recommendations: this.generateRecommendations()
    };

    // Save detailed report
    fs.writeFileSync('ai-review-results.json', JSON.stringify(report, null, 2));

    // Generate summary for PR comments
    this.generatePRSummary(report);
  }

  /**
   * Group issues by severity
   */
  groupIssuesBySeverity () {
    const grouped = {
      high: [],
      medium: [],
      low: []
    };

    for (const issue of this.reviewResults.issues) {
      grouped[issue.severity].push(issue);
    }

    return grouped;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations () {
    const recommendations = [];

    if (this.reviewResults.issues.filter(i => i.severity === 'high').length > 0) {
      recommendations.push('🚨 Address high-severity security issues immediately');
    }

    if (this.reviewResults.issues.filter(i => i.severity === 'medium').length > 5) {
      recommendations.push('⚠️ Consider addressing medium-priority issues to improve code quality');
    }

    if (this.reviewResults.suggestions.length > 10) {
      recommendations.push('💡 Many improvement opportunities - consider refactoring for maintainability');
    }

    if (this.reviewResults.score < 70) {
      recommendations.push('📊 Code quality below threshold - focus on critical issues first');
    }

    return recommendations;
  }

  /**
   * Generate PR summary
   */
  generatePRSummary (report) {
    const summary = `## 🤖 AI Code Review Summary

### 📊 Overall Score: ${report.score}/100

### 📈 Statistics
- **Files Analyzed**: ${report.summary.totalFiles}
- **Issues Found**: ${report.summary.totalIssues}
- **Suggestions**: ${report.summary.totalSuggestions}
- **Positive Aspects**: ${report.summary.totalPositives}

### 🚨 Issues by Severity
- **High**: ${report.issuesBySeverity.high.length}
- **Medium**: ${report.issuesBySeverity.medium.length}
- **Low**: ${report.issuesBySeverity.low.length}

### 💡 Top Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

### 🔍 File-by-File Analysis
${report.fileAnalysis.map(file => `
**${file.file}**
- Issues: ${file.issues.length}
- Suggestions: ${file.suggestions.length}
- Positives: ${file.positives.length}
`).join('')}

---
*Generated by AI SDLC Framework*`;

    fs.writeFileSync('ai-review-summary.md', summary);
  }
}

// Run the code reviewer
if (require.main === module) {
  const reviewer = new AICodeReviewer();
  const targetPath = process.argv[2] || '.';
  reviewer.performReview(targetPath).catch(console.error);
}

module.exports = AICodeReviewer;
