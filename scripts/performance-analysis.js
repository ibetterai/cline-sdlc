#!/usr/bin/env node

/**
 * AI Performance Analysis System
 * Analyzes code for performance issues and optimization opportunities
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class PerformanceAnalyzer {
  constructor () {
    this.results = {
      score: 0,
      issues: [],
      optimizations: [],
      metrics: [],
      summary: {}
    };

    this.performancePatterns = {
      critical: [
        { pattern: /for\s*\(\s*.*\s*in\s*.*\s*\)/, message: 'for...in loop on arrays - use for...of or Array methods' },
        { pattern: /\.length\s*===\s*\d+/, message: 'Length comparison in loop condition - cache length first' },
        { pattern: /innerHTML\s*\+=/, message: 'innerHTML concatenation - use DOM methods or fragments' },
        { pattern: /document\.write\s*\(/, message: 'document.write() - blocks page rendering' }
      ],
      high: [
        { pattern: /setTimeout\s*\(\s*["']0["']/, message: 'setTimeout(0) - use requestAnimationFrame instead' },
        { pattern: /setInterval\s*\(/, message: 'setInterval detected - ensure proper cleanup' },
        { pattern: /\.\s*getElementById\s*\(/, message: 'Repeated DOM queries - cache references' },
        { pattern: /new\s+Date\(\)\.getTime\(\)/, message: 'Date.now() is more efficient than new Date().getTime()' }
      ],
      medium: [
        { pattern: /console\.log\s*\(/, message: 'console.log in production - remove or use conditional logging' },
        { pattern: /\.\s*style\s*\./, message: 'Direct style manipulation - use CSS classes' },
        { pattern: /Math\.floor\(Math\.random\(\)/, message: 'Math.random() for integers - use bitwise operations for better performance' }
      ]
    };
  }

  async analyze (targetPath = '.') {
    console.log(chalk.blue('🚀 AI Performance Analysis Starting...'));

    try {
      const files = this.findFiles(targetPath);

      for (const file of files) {
        await this.analyzeFile(file);
      }

      this.calculateScore();
      this.generateReport();

      console.log(chalk.green('✅ Performance Analysis Complete!'));
      return this.results;
    } catch (error) {
      console.error(chalk.red('❌ Error during performance analysis:'), error.message);
      throw error;
    }
  }

  findFiles (targetPath) {
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

  async analyzeFile (filePath) {
    console.log(chalk.blue(`📊 Analyzing ${path.relative(process.cwd(), filePath)}...`));

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);

      const fileAnalysis = {
        file: relativePath,
        issues: [],
        optimizations: [],
        metrics: this.calculateFileMetrics(content)
      };

      // Check for performance issues
      this.checkPerformancePatterns(content, fileAnalysis);

      this.results.issues.push(...fileAnalysis.issues);
      this.results.optimizations.push(...fileAnalysis.optimizations);
      this.results.metrics.push(fileAnalysis.metrics);
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not analyze ${filePath}: ${error.message}`));
    }
  }

  checkPerformancePatterns (content, fileAnalysis) {
    const lines = content.split('\n');

    for (const [severity, patterns] of Object.entries(this.performancePatterns)) {
      for (const { pattern, message } of patterns) {
        const matches = content.match(new RegExp(pattern, 'g'));
        if (matches) {
          for (const match of matches) {
            const index = content.indexOf(match);
            const lineNumber = content.substring(0, index).split('\n').length;

            fileAnalysis.issues.push({
              severity,
              message,
              line: lineNumber,
              code: match.trim()
            });
          }
        }
      }
    }

    // Generate optimization suggestions
    this.generateOptimizations(content, fileAnalysis);
  }

  generateOptimizations (content, fileAnalysis) {
    // Suggest lazy loading
    if (content.includes('import ') && content.length > 1000) {
      fileAnalysis.optimizations.push({
        type: 'lazy-loading',
        message: 'Consider dynamic imports for better initial load performance'
      });
    }

    // Suggest debouncing
    if (content.includes('addEventListener') && content.includes('input')) {
      fileAnalysis.optimizations.push({
        type: 'debouncing',
        message: 'Consider debouncing input event handlers for better performance'
      });
    }

    // Suggest memoization
    if (content.includes('function') && content.includes('return')) {
      const functionCount = (content.match(/function/g) || []).length;
      if (functionCount > 3) {
        fileAnalysis.optimizations.push({
          type: 'memoization',
          message: 'Consider memoizing expensive function calls'
        });
      }
    }

    // Suggest virtual scrolling
    if (content.includes('map(') && content.includes('Array')) {
      fileAnalysis.optimizations.push({
        type: 'virtual-scrolling',
        message: 'Consider virtual scrolling for large lists'
      });
    }
  }

  calculateFileMetrics (content) {
    const lines = content.split('\n');
    const functions = (content.match(/function\s+\w+|=>\s*{|\w+\s*:\s*function/g) || []).length;
    const loops = (content.match(/for\s*\(|while\s*\(|\.forEach/g) || []).length;
    const domQueries = (content.match(/\.getElementById|\.querySelector|\.querySelectorAll/g) || []).length;

    return {
      totalLines: lines.length,
      functions,
      loops,
      domQueries,
      complexity: functions + loops * 2 + domQueries
    };
  }

  calculateScore () {
    let score = 100;

    // Deduct points for performance issues
    for (const issue of this.results.issues) {
      switch (issue.severity) {
      case 'critical':
        score -= 15;
        break;
      case 'high':
        score -= 8;
        break;
      case 'medium':
        score -= 3;
        break;
      }
    }

    // Bonus points for optimizations
    score += Math.min(this.results.optimizations.length * 2, 15);

    this.results.score = Math.max(0, Math.min(100, score));
  }

  generateReport () {
    const report = {
      timestamp: new Date().toISOString(),
      score: this.results.score,
      totalIssues: this.results.issues.length,
      totalOptimizations: this.results.optimizations.length,
      issuesBySeverity: this.groupIssuesBySeverity(),
      metrics: this.calculateOverallMetrics(),
      recommendations: this.generateRecommendations()
    };

    fs.writeFileSync('performance-analysis-results.json', JSON.stringify(report, null, 2));
  }

  groupIssuesBySeverity () {
    const grouped = { critical: [], high: [], medium: [] };

    for (const issue of this.results.issues) {
      grouped[issue.severity].push(issue);
    }

    return grouped;
  }

  calculateOverallMetrics () {
    const totalLines = this.results.metrics.reduce((sum, m) => sum + m.totalLines, 0);
    const totalFunctions = this.results.metrics.reduce((sum, m) => sum + m.functions, 0);
    const totalLoops = this.results.metrics.reduce((sum, m) => sum + m.loops, 0);
    const totalDomQueries = this.results.metrics.reduce((sum, m) => sum + m.domQueries, 0);

    return {
      totalLines,
      totalFunctions,
      totalLoops,
      totalDomQueries,
      averageComplexity: totalLines > 0 ? (totalFunctions + totalLoops * 2 + totalDomQueries) / this.results.metrics.length : 0
    };
  }

  generateRecommendations () {
    const recommendations = [];

    if (this.results.issues.filter(i => i.severity === 'critical').length > 0) {
      recommendations.push('🚨 Address critical performance issues immediately - they impact user experience');
    }

    if (this.results.metrics.reduce((sum, m) => sum + m.domQueries, 0) > 20) {
      recommendations.push('🔍 High DOM query count - consider caching references');
    }

    if (this.results.metrics.reduce((sum, m) => sum + m.loops, 0) > 10) {
      recommendations.push('⚡ Optimize loops - consider using built-in methods or reducing iterations');
    }

    if (this.results.score < 70) {
      recommendations.push('📈 Overall performance score low - focus on critical and high-priority issues');
    }

    return recommendations;
  }
}

// Run performance analyzer
if (require.main === module) {
  const analyzer = new PerformanceAnalyzer();
  const targetPath = process.argv[2] || '.';
  analyzer.analyze(targetPath).catch(console.error);
}

module.exports = PerformanceAnalyzer;
