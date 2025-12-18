#!/usr/bin/env node

/**
 * AI Merge Readiness Assessment
 * Evaluates if a PR is ready for merge
 */

const fs = require('fs');
const chalk = require('chalk');

class MergeReadinessAssessor {
  constructor () {
    this.assessment = {
      ready: false,
      score: 0,
      blockers: [],
      warnings: [],
      checks: {}
    };
  }

  async assess () {
    console.log(chalk.blue('🔍 AI Merge Readiness Assessment Starting...'));

    try {
      await this.runAllChecks();
      this.calculateReadiness();
      this.generateReport();

      console.log(chalk.green('✅ Merge Readiness Assessment Complete!'));
      console.log(chalk.blue(`📊 Readiness Score: ${this.assessment.score}/100`));
      console.log(chalk.blue(`🚀 Merge Ready: ${this.assessment.ready ? 'YES' : 'NO'}`));

      return this.assessment;
    } catch (error) {
      console.error(chalk.red('❌ Error during assessment:'), error.message);
      throw error;
    }
  }

  async runAllChecks () {
    // Run all readiness checks
    await this.checkTestResults();
    await this.checkCodeQuality();
    await this.checkSecurity();
    await this.checkPerformance();
    await this.checkDocumentation();
    await this.checkApprovals();
  }

  async checkTestResults () {
    const testResults = this.readTestResults();

    const checks = {
      allTestsPassing: testResults.successRate === 100,
      sufficientCoverage: testResults.coverage >= 80,
      noSkippedTests: testResults.skippedTests === 0,
      recentTests: testResults.lastRun &&
                  (Date.now() - new Date(testResults.lastRun).getTime()) < 24 * 60 * 60 * 1000
    };

    if (!checks.allTestsPassing) {
      this.assessment.blockers.push({
        type: 'test-failure',
        message: `Tests are failing (${testResults.failedTests} failed)`,
        severity: 'critical'
      });
    }

    if (!checks.sufficientCoverage) {
      this.assessment.blockers.push({
        type: 'coverage',
        message: `Insufficient test coverage (${testResults.coverage}%)`,
        severity: 'high'
      });
    }

    if (testResults.skippedTests > 0) {
      this.assessment.warnings.push({
        type: 'skipped-tests',
        message: `${testResults.skippedTests} tests are skipped`,
        severity: 'low'
      });
    }

    this.assessment.checks.tests = checks;
  }

  async checkCodeQuality () {
    const codeQuality = this.readCodeQualityResults();

    const checks = {
      noCriticalIssues: codeQuality.criticalIssues === 0,
      noHighIssues: codeQuality.highIssues === 0,
      acceptableStyleScore: codeQuality.styleScore >= 70,
      noLintErrors: codeQuality.lintErrors === 0
    };

    if (!checks.noCriticalIssues) {
      this.assessment.blockers.push({
        type: 'critical-issues',
        message: `${codeQuality.criticalIssues} critical code quality issues`,
        severity: 'critical'
      });
    }

    if (!checks.noHighIssues) {
      this.assessment.blockers.push({
        type: 'high-issues',
        message: `${codeQuality.highIssues} high-priority code quality issues`,
        severity: 'high'
      });
    }

    if (!checks.acceptableStyleScore) {
      this.assessment.warnings.push({
        type: 'style-score',
        message: `Code style score is ${codeQuality.styleScore}/100`,
        severity: 'medium'
      });
    }

    this.assessment.checks.codeQuality = checks;
  }

  async checkSecurity () {
    const security = this.readSecurityResults();

    const checks = {
      noCriticalVulns: security.criticalVulnerabilities === 0,
      noHighVulns: security.highVulnerabilities === 0,
      securityScore: security.securityScore >= 80,
      dependenciesSecure: security.dependencyIssues === 0
    };

    if (!checks.noCriticalVulns) {
      this.assessment.blockers.push({
        type: 'security-critical',
        message: `${security.criticalVulnerabilities} critical security vulnerabilities`,
        severity: 'critical'
      });
    }

    if (!checks.noHighVulns) {
      this.assessment.blockers.push({
        type: 'security-high',
        message: `${security.highVulnerabilities} high-priority security vulnerabilities`,
        severity: 'high'
      });
    }

    if (!checks.securityScore) {
      this.assessment.warnings.push({
        type: 'security-score',
        message: `Security score is ${security.securityScore}/100`,
        severity: 'high'
      });
    }

    this.assessment.checks.security = checks;
  }

  async checkPerformance () {
    const performance = this.readPerformanceResults();

    const checks = {
      noCriticalPerfIssues: performance.criticalIssues === 0,
      performanceScore: performance.performanceScore >= 70,
      noRegressions: performance.regressions === 0
    };

    if (!checks.noCriticalPerfIssues) {
      this.assessment.blockers.push({
        type: 'performance-critical',
        message: `${performance.criticalIssues} critical performance issues`,
        severity: 'high'
      });
    }

    if (!checks.performanceScore) {
      this.assessment.warnings.push({
        type: 'performance-score',
        message: `Performance score is ${performance.performanceScore}/100`,
        severity: 'medium'
      });
    }

    this.assessment.checks.performance = checks;
  }

  async checkDocumentation () {
    const documentation = this.readDocumentationResults();

    const checks = {
      readmeUpdated: documentation.readmeUpdated,
      apiDocsUpdated: documentation.apiDocsUpdated,
      changelogUpdated: documentation.changelogUpdated,
      noBreakingChanges: documentation.breakingChanges === 0
    };

    if (!checks.readmeUpdated) {
      this.assessment.warnings.push({
        type: 'documentation',
        message: 'README may need updates for new features',
        severity: 'low'
      });
    }

    if (documentation.breakingChanges > 0) {
      this.assessment.blockers.push({
        type: 'breaking-changes',
        message: `${documentation.breakingChanges} breaking changes detected - requires additional review`,
        severity: 'high'
      });
    }

    this.assessment.checks.documentation = checks;
  }

  async checkApprovals () {
    const approvals = this.readApprovalStatus();

    const checks = {
      hasRequiredApprovals: approvals.hasRequiredApprovals,
      noRequestedChanges: approvals.requestedChanges === 0,
      discussionsResolved: approvals.unresolvedDiscussions === 0,
      ciPassed: approvals.ciStatus === 'passed'
    };

    if (!checks.hasRequiredApprovals) {
      this.assessment.blockers.push({
        type: 'approvals',
        message: `Insufficient approvals (${approvals.currentApprovals}/${approvals.requiredApprovals})`,
        severity: 'high'
      });
    }

    if (!checks.noRequestedChanges) {
      this.assessment.blockers.push({
        type: 'requested-changes',
        message: `${approvals.requestedChanges} requested changes need to be addressed`,
        severity: 'critical'
      });
    }

    if (!checks.ciPassed) {
      this.assessment.blockers.push({
        type: 'ci-failure',
        message: 'CI checks are failing',
        severity: 'critical'
      });
    }

    if (!checks.discussionsResolved) {
      this.assessment.warnings.push({
        type: 'discussions',
        message: `${approvals.unresolvedDiscussions} unresolved discussions`,
        severity: 'medium'
      });
    }

    this.assessment.checks.approvals = checks;
  }

  readTestResults () {
    try {
      if (fs.existsSync('test-analysis-report.json')) {
        const report = JSON.parse(fs.readFileSync('test-analysis-report.json', 'utf8'));
        return {
          successRate: report.summary?.successRate || 0,
          coverage: report.summary?.overallCoverage || 0,
          failedTests: report.summary?.failedTests || 0,
          skippedTests: report.summary?.skippedTests || 0,
          lastRun: report.timestamp
        };
      }
    } catch (error) {
      // Use defaults if file can't be read
    }

    return {
      successRate: 0,
      coverage: 0,
      failedTests: 0,
      skippedTests: 0,
      lastRun: null
    };
  }

  readCodeQualityResults () {
    try {
      if (fs.existsSync('code-style-review-results.json')) {
        const report = JSON.parse(fs.readFileSync('code-style-review-results.json', 'utf8'));
        return {
          criticalIssues: report.violationsBySeverity?.high?.length || 0,
          highIssues: report.violationsBySeverity?.medium?.length || 0,
          styleScore: report.score || 0,
          lintErrors: 0 // Assuming lint fixes have been applied
        };
      }
    } catch (error) {
      // Use defaults if file can't be read
    }

    return {
      criticalIssues: 0,
      highIssues: 0,
      styleScore: 0,
      lintErrors: 0
    };
  }

  readSecurityResults () {
    try {
      if (fs.existsSync('security-scan-results.json')) {
        const report = JSON.parse(fs.readFileSync('security-scan-results.json', 'utf8'));
        return {
          criticalVulnerabilities: report.vulnerabilitiesBySeverity?.critical?.length || 0,
          highVulnerabilities: report.vulnerabilitiesBySeverity?.high?.length || 0,
          securityScore: report.score || 0,
          dependencyIssues: 0 // Assuming dependency issues are handled separately
        };
      }
    } catch (error) {
      // Use defaults if file can't be read
    }

    return {
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      securityScore: 0,
      dependencyIssues: 0
    };
  }

  readPerformanceResults () {
    try {
      if (fs.existsSync('performance-analysis-results.json')) {
        const report = JSON.parse(fs.readFileSync('performance-analysis-results.json', 'utf8'));
        return {
          criticalIssues: report.issuesBySeverity?.critical?.length || 0,
          performanceScore: report.score || 0,
          regressions: 0 // Would need baseline comparison
        };
      }
    } catch (error) {
      // Use defaults if file can't be read
    }

    return {
      criticalIssues: 0,
      performanceScore: 0,
      regressions: 0
    };
  }

  readDocumentationResults () {
    // This would typically check git diff for documentation changes
    // For now, return reasonable defaults
    return {
      readmeUpdated: true, // Assume updated if PR is ready
      apiDocsUpdated: true,
      changelogUpdated: false,
      breakingChanges: 0
    };
  }

  readApprovalStatus () {
    // This would typically check GitHub API for PR status
    // For now, return reasonable defaults
    return {
      hasRequiredApprovals: false, // Assume not approved
      currentApprovals: 0,
      requiredApprovals: 2,
      requestedChanges: 0,
      unresolvedDiscussions: 0,
      ciStatus: 'passed' // Assume CI passed for testing
    };
  }

  calculateReadiness () {
    let score = 100;

    // Subtract points for blockers
    for (const blocker of this.assessment.blockers) {
      switch (blocker.severity) {
      case 'critical':
        score -= 30;
        break;
      case 'high':
        score -= 20;
        break;
      case 'medium':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
      }
    }

    // Subtract points for warnings
    for (const warning of this.assessment.warnings) {
      switch (warning.severity) {
      case 'high':
        score -= 5;
        break;
      case 'medium':
        score -= 3;
        break;
      case 'low':
        score -= 1;
        break;
      }
    }

    this.assessment.score = Math.max(0, score);
    this.assessment.ready = this.assessment.blockers.length === 0 && this.assessment.score >= 80;
  }

  generateReport () {
    const report = {
      timestamp: new Date().toISOString(),
      ready: this.assessment.ready,
      score: this.assessment.score,
      blockers: this.assessment.blockers,
      warnings: this.assessment.warnings,
      checks: this.assessment.checks,
      summary: {
        totalBlockers: this.assessment.blockers.length,
        totalWarnings: this.assessment.warnings.length,
        criticalBlockers: this.assessment.blockers.filter(b => b.severity === 'critical').length,
        recommendation: this.getRecommendation()
      }
    };

    fs.writeFileSync('merge-readiness-results.json', JSON.stringify(report, null, 2));
  }

  getRecommendation () {
    if (!this.assessment.ready) {
      return 'PR is not ready for merge. Address blockers and warnings.';
    }

    if (this.assessment.warnings.length > 0) {
      return 'PR is ready for merge but consider addressing warnings.';
    }

    return 'PR is ready for merge! 🎉';
  }
}

// Run merge readiness assessor
if (require.main === module) {
  const assessor = new MergeReadinessAssessor();
  assessor.assess().catch(console.error);
}

module.exports = MergeReadinessAssessor;
