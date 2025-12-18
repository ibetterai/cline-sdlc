#!/usr/bin/env node

/**
 * AI Test Results Analyzer
 * Analyzes test results and provides insights
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class TestResultsAnalyzer {
  constructor () {
    this.analysis = {
      summary: {},
      details: {},
      recommendations: [],
      coverage: {}
    };
  }

  async analyze () {
    console.log(chalk.blue('📊 AI Test Results Analysis Starting...'));

    try {
      await this.readTestResults();
      this.analyzeResults();
      this.generateRecommendations();
      this.generateReport();

      console.log(chalk.green('✅ Test Results Analysis Complete!'));
      console.log(chalk.blue(`📈 Test Success Rate: ${this.analysis.summary.successRate}%`));

      return this.analysis;
    } catch (error) {
      console.error(chalk.red('❌ Error during test analysis:'), error.message);
      throw error;
    }
  }

  async readTestResults () {
    // Read Jest test results
    await this.readJestResults();

    // Read coverage reports
    await this.readCoverageReport();

    // Read any other test result files
    await this.readOtherTestResults();
  }

  async readJestResults () {
    try {
      if (fs.existsSync('test-results.json')) {
        const jestResults = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
        this.analysis.jestResults = jestResults;
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not read Jest results'));
    }
  }

  async readCoverageReport () {
    try {
      if (fs.existsSync('coverage/coverage-summary.json')) {
        const coverageSummary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
        this.analysis.coverage.coverageSummary = coverageSummary;
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not read coverage report'));
    }
  }

  async readOtherTestResults () {
    // Look for other test result files
    const testFiles = ['test-results.xml', 'junit.xml', 'results.xml'];

    for (const file of testFiles) {
      if (fs.existsSync(file)) {
        this.analysis.otherResults = {
          file,
          content: fs.readFileSync(file, 'utf8')
        };
        break;
      }
    }
  }

  analyzeResults () {
    if (this.analysis.jestResults) {
      this.analyzeJestResults();
    }

    if (this.analysis.coverage.coverageSummary) {
      this.analyzeCoverage();
    }

    this.calculateOverallSummary();
  }

  analyzeJestResults () {
    const results = this.analysis.jestResults;
    const testResults = results.testResults || [];

    const totalTests = testResults.reduce((sum, suite) =>
      sum + (suite.assertionResults || []).length, 0);

    const passedTests = testResults.reduce((sum, suite) =>
      sum + (suite.assertionResults || []).filter(r => r.status === 'passed').length, 0);

    const failedTests = testResults.reduce((sum, suite) =>
      sum + (suite.assertionResults || []).filter(r => r.status === 'failed').length, 0);

    const skippedTests = testResults.reduce((sum, suite) =>
      sum + (suite.assertionResults || []).filter(r => r.status === 'pending').length, 0);

    this.analysis.details.jest = {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
      failureRate: totalTests > 0 ? Math.round((failedTests / totalTests) * 100) : 0,
      testSuites: testResults.length
    };
  }

  analyzeCoverage () {
    const coverage = this.analysis.coverage.coverageSummary;
    const { total, lines, functions, branches, statements } = coverage;

    this.analysis.details.coverage = {
      overall: total || 0,
      lines: lines?.pct || 0,
      functions: functions?.pct || 0,
      branches: branches?.pct || 0,
      statements: statements?.pct || 0
    };
  }

  calculateOverallSummary () {
    const jest = this.analysis.details.jest || {};
    const coverage = this.analysis.details.coverage || {};

    this.analysis.summary = {
      totalTests: jest.totalTests || 0,
      passedTests: jest.passedTests || 0,
      failedTests: jest.failedTests || 0,
      skippedTests: jest.skippedTests || 0,
      successRate: jest.successRate || 0,
      failureRate: jest.failureRate || 0,
      overallCoverage: coverage.overall || 0,
      linesCoverage: coverage.lines || 0,
      functionsCoverage: coverage.functions || 0,
      branchesCoverage: coverage.branches || 0,
      statementsCoverage: coverage.statements || 0
    };
  }

  generateRecommendations () {
    const recommendations = [];

    // Test success rate recommendations
    if (this.analysis.summary.successRate < 80) {
      recommendations.push({
        priority: 'high',
        type: 'test-quality',
        message: `Test success rate is ${this.analysis.summary.successRate}%. Review and fix failing tests.`
      });
    }

    if (this.analysis.summary.successRate < 95) {
      recommendations.push({
        priority: 'medium',
        type: 'test-stability',
        message: 'Consider improving test stability and reliability.'
      });
    }

    // Coverage recommendations
    if (this.analysis.summary.overallCoverage < 70) {
      recommendations.push({
        priority: 'high',
        type: 'coverage',
        message: `Code coverage is ${this.analysis.summary.overallCoverage}%. Add more tests to improve coverage.`
      });
    }

    if (this.analysis.summary.overallCoverage < 90) {
      recommendations.push({
        priority: 'medium',
        type: 'coverage',
        message: 'Consider adding more comprehensive tests for better coverage.'
      });
    }

    // Branch coverage recommendations
    if (this.analysis.summary.branchesCoverage < 60) {
      recommendations.push({
        priority: 'medium',
        type: 'branch-coverage',
        message: `Branch coverage is ${this.analysis.summary.branchesCoverage}%. Add tests for edge cases and conditional logic.`
      });
    }

    // Test quantity recommendations
    if (this.analysis.summary.totalTests < 10) {
      recommendations.push({
        priority: 'low',
        type: 'test-quantity',
        message: 'Consider adding more comprehensive tests for better code validation.'
      });
    }

    // Failed test analysis
    if (this.analysis.summary.failedTests > 0) {
      recommendations.push({
        priority: 'critical',
        type: 'failed-tests',
        message: `${this.analysis.summary.failedTests} tests are failing. Address these immediately.`
      });
    }

    this.analysis.recommendations = recommendations;
  }

  generateReport () {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.analysis.summary,
      details: this.analysis.details,
      recommendations: this.analysis.recommendations,
      quality: this.calculateQualityScore()
    };

    fs.writeFileSync('test-analysis-report.json', JSON.stringify(report, null, 2));

    // Generate human-readable summary
    this.generateHumanReadableReport(report);
  }

  calculateQualityScore () {
    let score = 0;

    // Success rate (40% weight)
    score += (this.analysis.summary.successRate / 100) * 40;

    // Overall coverage (30% weight)
    score += (this.analysis.summary.overallCoverage / 100) * 30;

    // Branch coverage (20% weight)
    score += (this.analysis.summary.branchesCoverage / 100) * 20;

    // Function coverage (10% weight)
    score += (this.analysis.summary.functionsCoverage / 100) * 10;

    return Math.round(score);
  }

  generateHumanReadableReport (report) {
    const content = `
# 🧪 Test Results Analysis Report

## 📊 Summary
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passedTests}
- **Failed**: ${report.summary.failedTests}
- **Skipped**: ${report.summary.skippedTests}
- **Success Rate**: ${report.summary.successRate}%
- **Overall Quality Score**: ${report.quality}/100

## 📈 Coverage
- **Lines**: ${report.summary.linesCoverage}%
- **Functions**: ${report.summary.functionsCoverage}%
- **Branches**: ${report.summary.branchesCoverage}%
- **Statements**: ${report.summary.statementsCoverage}%
- **Overall**: ${report.summary.overallCoverage}%

## 💡 Recommendations
${report.recommendations.map(rec =>
    `### ${rec.priority.toUpperCase()}: ${rec.type}
${rec.message}`
  ).join('\n\n')}

---
*Generated by AI Test Results Analyzer on ${new Date().toISOString()}*
`;

    fs.writeFileSync('test-analysis-summary.md', content.trim());
  }
}

// Run test results analyzer
if (require.main === module) {
  const analyzer = new TestResultsAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = TestResultsAnalyzer;
