#!/usr/bin/env node

/**
 * AI Documentation Generator
 * Generates comprehensive documentation using AI analysis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const marked = require('marked');

class AIDocumentationGenerator {
  constructor () {
    this.srcDir = 'src';
    this.docsDir = 'docs';
    this.patterns = {
      functions: /\/\*\*[\s\S]*?\*\/\s*function\s+(\w+)/g,
      classes: /\/\*\*[\s\S]*?\*\/\s*class\s+(\w+)/g,
      methods: /\/\*\*[\s\S]*?\*\/\s*(\w+)\s*\([^)]*\)\s*{/g,
      exports: /module\.exports\s*=\s*{([^}]+)}/g
    };
  }

  /**
   * Generate comprehensive documentation
   */
  async generateDocs () {
    console.log(chalk.blue('🤖 AI Documentation Generator Starting...'));

    try {
      // Ensure docs directory exists
      if (!fs.existsSync(this.docsDir)) {
        fs.mkdirSync(this.docsDir, { recursive: true });
      }

      // Generate API documentation
      await this.generateAPIDocumentation();

      // Generate README
      await this.generateREADME();

      // Generate architecture documentation
      await this.generateArchitectureDocs();

      // Generate contribution guidelines
      await this.generateContributionGuide();

      console.log(chalk.green('✅ AI Documentation Generation Complete!'));
    } catch (error) {
      console.error(chalk.red('❌ Error generating documentation:'), error.message);
    }
  }

  /**
   * Generate API documentation
   */
  async generateAPIDocumentation () {
    console.log(chalk.blue('📚 Generating API Documentation...'));

    const apiDocs = {
      title: 'API Documentation',
      generated: new Date().toISOString(),
      modules: []
    };

    // Find all source files
    const sourceFiles = this.findSourceFiles();

    for (const file of sourceFiles) {
      const moduleDocs = await this.analyzeModule(file);
      if (moduleDocs) {
        apiDocs.modules.push(moduleDocs);
      }
    }

    // Generate HTML documentation
    const htmlContent = this.generateAPIDocumentationHTML(apiDocs);
    fs.writeFileSync(path.join(this.docsDir, 'api.html'), htmlContent);

    // Generate Markdown documentation
    const mdContent = this.generateAPIDocumentationMD(apiDocs);
    fs.writeFileSync(path.join(this.docsDir, 'api.md'), mdContent);

    console.log(chalk.green('✅ API Documentation Generated'));
  }

  /**
   * Analyze a module and extract documentation
   */
  async analyzeModule (filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    const moduleName = path.basename(filePath, '.js');

    const moduleDocs = {
      name: moduleName,
      file: relativePath,
      description: this.extractModuleDescription(content),
      functions: [],
      classes: [],
      exports: []
    };

    // Extract function documentation
    let match;
    while ((match = this.patterns.functions.exec(content)) !== null) {
      const doc = this.extractFunctionDoc(match[0], match[1]);
      moduleDocs.functions.push(doc);
    }

    // Extract class documentation
    while ((match = this.patterns.classes.exec(content)) !== null) {
      const doc = this.extractClassDoc(match[0], match[1]);
      moduleDocs.classes.push(doc);
    }

    // Extract exports
    while ((match = this.patterns.exports.exec(content)) !== null) {
      moduleDocs.exports = match[1].split(',').map(e => e.trim());
    }

    return moduleDocs;
  }

  /**
   * Extract module description
   */
  extractModuleDescription (content) {
    const match = content.match(/\/\*\*\s*\n\s*\*\s*(.*?)\s*\n/);
    return match ? match[1] : 'No description available';
  }

  /**
   * Extract function documentation
   */
  extractFunctionDoc (commentBlock, functionName) {
    const params = [];
    const returns = [];
    let description = '';

    const lines = commentBlock.split('\n');
    for (const line of lines) {
      const trimmed = line.trim().replace(/^\*\s?/, '');

      if (trimmed.startsWith('@param')) {
        const paramMatch = trimmed.match(/@param\s*{(\w+)}\s*(\w+)\s*-\s*(.+)/);
        if (paramMatch) {
          params.push({
            type: paramMatch[1],
            name: paramMatch[2],
            description: paramMatch[3]
          });
        }
      } else if (trimmed.startsWith('@returns')) {
        const returnMatch = trimmed.match(/@returns\s*{(\w+)}\s*(.+)/);
        if (returnMatch) {
          returns.push({
            type: returnMatch[1],
            description: returnMatch[2]
          });
        }
      } else if (trimmed && !trimmed.startsWith('*') && !trimmed.startsWith('@')) {
        description += trimmed + ' ';
      }
    }

    return {
      name: functionName,
      description: description.trim(),
      parameters: params,
      returns
    };
  }

  /**
   * Extract class documentation
   */
  extractClassDoc (commentBlock, className) {
    const description = this.extractFunctionDoc(commentBlock, className);
    return {
      name: className,
      ...description
    };
  }

  /**
   * Generate API documentation in HTML
   */
  generateAPIDocumentationHTML (apiDocs) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${apiDocs.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
        .module { margin-bottom: 40px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
        .module-header { background: #333; color: white; padding: 15px; }
        .module-content { padding: 20px; }
        .function, .class { margin-bottom: 20px; padding: 15px; border-left: 4px solid #007acc; background: #f9f9f9; }
        .param { margin: 5px 0; }
        .param-type { font-weight: bold; color: #d73a49; }
        .param-name { font-weight: bold; color: #005cc5; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 ${apiDocs.title}</h1>
        <p class="timestamp">Generated on: ${new Date(apiDocs.generated).toLocaleString()}</p>
        <p>Comprehensive API documentation generated by AI SDLC Framework</p>
    </div>

    ${apiDocs.modules.map(module => `
    <div class="module">
        <div class="module-header">
            <h2>📦 ${module.name}</h2>
            <p>📁 ${module.file}</p>
        </div>
        <div class="module-content">
            <p>${module.description}</p>
            
            ${module.functions.length > 0 ? '<h3>Functions</h3>' : ''}
            ${module.functions.map(func => `
            <div class="function">
                <h4>🔧 ${func.name}()</h4>
                <p>${func.description}</p>
                ${func.parameters.length > 0
    ? `
                <h5>Parameters:</h5>
                ${func.parameters.map(param => `
                <div class="param">
                    <span class="param-type">${param.type}</span>
                    <span class="param-name">${param.name}</span>: ${param.description}
                </div>
                `).join('')}
                `
    : ''}
                ${func.returns.length > 0
    ? `
                <h5>Returns:</h5>
                ${func.returns.map(ret => `
                <div class="param">
                    <span class="param-type">${ret.type}</span>: ${ret.description}
                </div>
                `).join('')}
                `
    : ''}
            </div>
            `).join('')}
            
            ${module.classes.length > 0 ? '<h3>Classes</h3>' : ''}
            ${module.classes.map(cls => `
            <div class="class">
                <h4>🏗️ ${cls.name}</h4>
                <p>${cls.description}</p>
            </div>
            `).join('')}
        </div>
    </div>
    `).join('')}
</body>
</html>`;
  }

  /**
   * Generate API documentation in Markdown
   */
  generateAPIDocumentationMD (apiDocs) {
    let content = `# 🤖 ${apiDocs.title}\n\n`;
    content += `*Generated on: ${new Date(apiDocs.generated).toLocaleString()}*\n\n`;
    content += 'Comprehensive API documentation generated by AI SDLC Framework\n\n';

    for (const module of apiDocs.modules) {
      content += `## 📦 ${module.name}\n\n`;
      content += `**File:** \`${module.file}\`\n\n`;
      content += `${module.description}\n\n`;

      if (module.functions.length > 0) {
        content += '### Functions\n\n';
        for (const func of module.functions) {
          content += `#### 🔧 ${func.name}()\n\n`;
          content += `${func.description}\n\n`;

          if (func.parameters.length > 0) {
            content += '**Parameters:**\n\n';
            for (const param of func.parameters) {
              content += `- \`${param.type} ${param.name}\`: ${param.description}\n`;
            }
            content += '\n';
          }

          if (func.returns.length > 0) {
            content += '**Returns:**\n\n';
            for (const ret of func.returns) {
              content += `- \`${ret.type}\`: ${ret.description}\n`;
            }
            content += '\n';
          }
        }
      }

      if (module.classes.length > 0) {
        content += '### Classes\n\n';
        for (const cls of module.classes) {
          content += `#### 🏗️ ${cls.name}\n\n`;
          content += `${cls.description}\n\n`;
        }
      }
    }

    return content;
  }

  /**
   * Generate README.md
   */
  async generateREADME () {
    console.log(chalk.blue('📄 Generating README.md...'));

    const readmeContent = `# 🤖 AI-Enhanced SDLC Framework

A comprehensive AI-powered Software Development Life Cycle (SDLC) framework that automates code generation, testing, documentation, and deployment processes.

## 🚀 Features

- **🤖 AI-Powered Code Generation**: Automatically generates boilerplate code and patterns
- **🧪 Intelligent Testing**: AI-driven test generation and execution
- **📚 Auto-Documentation**: Comprehensive documentation generation
- **🔍 Code Review**: AI-enhanced code review and quality checks
- **🚀 CI/CD Integration**: Seamless GitHub Actions integration
- **📊 Analytics**: Detailed insights and reporting

## 🛠️ Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Set up the framework
npm run setup
\`\`\`

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| \`npm test\` | Run all tests |
| \`npm run test:watch\` | Run tests in watch mode |
| \`npm run test:coverage\` | Generate test coverage report |
| \`npm run lint\` | Run code linting |
| \`npm run lint:fix\` | Fix linting issues |
| \`npm run build\` | Build the project |
| \`npm run docs\` | Generate documentation |
| \`npm run ai:analyze\` | AI code analysis |
| \`npm run ai:test\` | Generate AI tests |
| \`npm run ai:docs\` | Generate AI documentation |
| \`npm run ai:review\` | AI code review |

## 🏗️ Project Structure

\`\`\`
├── .github/workflows/     # GitHub Actions workflows
├── .ai-config/           # AI configuration files
├── src/                  # Source code
├── tests/                # Generated tests
├── scripts/              # AI automation scripts
├── docs/                 # Generated documentation
└── package.json          # Project configuration
\`\`\`

## 🤖 AI Workflows

### 1. Code Quality & Security
- Automated code analysis using CodeQL
- AI-powered linting and style checks
- Security vulnerability scanning

### 2. Testing Automation
- AI-generated unit tests
- Intelligent test coverage analysis
- Automated test execution

### 3. Documentation Generation
- API documentation generation
- README auto-updates
- Architecture documentation

### 4. Code Review
- AI-powered pull request reviews
- Performance impact analysis
- Security vulnerability detection

## 🔄 CI/CD Pipeline

The framework includes a comprehensive CI/CD pipeline that:

1. **Analyzes** code quality and security
2. **Generates** and **runs** tests automatically
3. **Creates** documentation
4. **Reviews** code changes with AI
5. **Deploys** with AI validation

## 📊 Reporting

After each pipeline run, the framework generates:
- Code quality reports
- Test coverage analysis
- Security scan results
- Performance metrics
- AI insights and recommendations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. The AI will automatically:
   - Generate tests for your code
   - Review your changes
   - Update documentation
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built with GitHub Copilot integration
- Powered by GitHub Actions
- Enhanced with AI-driven automation

---

*Generated by AI SDLC Framework on ${new Date().toISOString()}*
`;

    fs.writeFileSync('README.md', readmeContent);
    console.log(chalk.green('✅ README.md Generated'));
  }

  /**
   * Generate architecture documentation
   */
  async generateArchitectureDocs () {
    console.log(chalk.blue('🏗️ Generating Architecture Documentation...'));

    const archContent = `# 🏗️ Architecture Documentation

## Overview

The AI SDLC Framework is built with a modular architecture that integrates AI capabilities throughout the software development lifecycle.

## Core Components

### 1. AI Analysis Engine
- Code pattern recognition
- Security vulnerability detection
- Performance impact analysis

### 2. Test Generator
- Automated test case generation
- Coverage optimization
- Edge case detection

### 3. Documentation Generator
- API documentation creation
- README maintenance
- Architecture diagram generation

### 4. Code Review System
- Automated PR reviews
- Style and best practices checking
- Merge readiness assessment

## Workflow Integration

### GitHub Actions Workflows

1. **AI-Enhanced SDLC Pipeline** (\`.github/workflows/ai-sdlc.yml\`)
   - Code quality analysis
   - Automated testing
   - Documentation generation
   - Deployment validation

2. **AI-Powered Code Review** (\`.github/workflows/ai-code-review.yml\`)
   - PR analysis
   - Security scanning
   - Dependency review
   - Merge readiness check

### Automation Scripts

- **Test Generation** (\`scripts/generate-tests.js\`)
- **Documentation** (\`scripts/generate-docs.js\`)
- **Code Review** (\`scripts/ai-code-review.js\`)
- **Performance Analysis** (\`scripts/performance-analysis.js\`)

## Data Flow

\`\`\`
Code Commit → AI Analysis → Test Generation → Documentation → Review → Deploy
\`\`\`

## Configuration

AI tools can be configured through:
- \`.ai-config/\` directory
- Environment variables
- GitHub repository settings

## Extensibility

The framework is designed to be extensible:
- Custom AI analysis rules
- Additional test generators
- Custom documentation templates
- Integration with external tools

---

*Generated by AI SDLC Framework on ${new Date().toISOString()}*
`;

    fs.writeFileSync(path.join(this.docsDir, 'architecture.md'), archContent);
    console.log(chalk.green('✅ Architecture Documentation Generated'));
  }

  /**
   * Generate contribution guidelines
   */
  async generateContributionGuide () {
    console.log(chalk.blue('🤝 Generating Contribution Guidelines...'));

    const contribContent = `# 🤝 Contributing Guidelines

Thank you for contributing to the AI SDLC Framework! This document provides guidelines for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Git
- GitHub account with Copilot access

### Setup
1. Fork the repository
2. Clone your fork
3. Run \`npm install\`
4. Create a feature branch

## 📝 Development Process

### 1. Code Development
- Write clean, well-documented code
- Follow existing code patterns
- Add appropriate comments

### 2. AI-Assisted Testing
The framework will automatically:
- Generate unit tests for your code
- Run test coverage analysis
- Identify edge cases

### 3. Documentation
AI will automatically:
- Update API documentation
- Generate code examples
- Update relevant README sections

### 4. Code Review
Our AI reviewers will check:
- Code quality and style
- Security vulnerabilities
- Performance implications
- Best practices compliance

## 🔄 Pull Request Process

1. **Create PR** with descriptive title and description
2. **AI Analysis** runs automatically:
   - Code quality checks
   - Test generation
   - Security scanning
3. **Review Results**: AI provides feedback and recommendations
4. **Address Issues**: Fix any identified problems
5. **Merge**: Once AI approval is received

## 🧪 Testing Guidelines

### Automated Testing
- Tests are auto-generated by AI
- Coverage should be >80%
- All tests must pass

### Manual Testing
- Test new features manually
- Verify documentation accuracy
- Check for edge cases

## 📚 Documentation Standards

### Code Documentation
- Use JSDoc format
- Include parameter types
- Document return values
- Add usage examples

### API Documentation
- Auto-generated from code comments
- Includes parameter descriptions
- Provides usage examples
- Documents error conditions

## 🔍 Code Review Criteria

### AI Checks
- Code style consistency
- Security vulnerability detection
- Performance impact analysis
- Best practices compliance

### Human Review
- Logic correctness
- Feature completeness
- User experience
- Integration compatibility

## 🚨 Common Issues

### Test Failures
- Check auto-generated test cases
- Verify test data
- Update assertions if needed

### Documentation Issues
- Ensure JSDoc comments are complete
- Check parameter types
- Verify examples work

### Style Violations
- Run \`npm run lint:fix\`
- Follow ESLint rules
- Maintain consistent formatting

## 💡 Tips for Success

1. **Use GitHub Copilot** for code suggestions
2. **Write clear commit messages**
3. **Test incrementally**
4. **Review AI feedback carefully**
5. **Document your changes**

## 🆘 Getting Help

- Check existing issues
- Review AI-generated documentation
- Consult the architecture docs
- Ask questions in discussions

## 🏆 Recognition

Contributors are recognized through:
- GitHub contributor stats
- AI-generated impact reports
- Feature acknowledgments

---

*Generated by AI SDLC Framework on ${new Date().toISOString()}*
`;

    fs.writeFileSync(path.join(this.docsDir, 'contributing.md'), contribContent);
    console.log(chalk.green('✅ Contribution Guidelines Generated'));
  }

  /**
   * Find all source files
   */
  findSourceFiles () {
    const files = [];
    if (!fs.existsSync(this.srcDir)) {
      return files;
    }

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
}

// Run the documentation generator
if (require.main === module) {
  const generator = new AIDocumentationGenerator();
  generator.generateDocs().catch(console.error);
}

module.exports = AIDocumentationGenerator;
