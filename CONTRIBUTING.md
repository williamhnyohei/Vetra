# 🤝 Contributing to Vetra

First off, thank you for considering contributing to Vetra! It's people like you that make Vetra such a great tool for the crypto community.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Branch Naming](#branch-naming)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## 🎯 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title** and **description**
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, extension version)

Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md).

### 💡 Suggesting Features

Feature suggestions are tracked as GitHub issues. When creating a feature request:

- **Clear title** and **description**
- **Use case** - Why is this feature needed?
- **Proposed solution** - How should it work?
- **Alternatives considered**
- **Additional context** (mockups, examples)

Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md).

### 🔧 Code Contributions

1. **Find an issue** to work on (or create one)
2. **Comment** on the issue that you want to work on it
3. **Fork** the repository
4. **Create a branch** from `main`
5. **Make your changes**
6. **Test thoroughly**
7. **Submit a Pull Request**

---

## 🛠️ Development Setup

### Prerequisites

```bash
Node.js 18+
pnpm 8+
Docker (optional, for PostgreSQL + Redis)
Git
```

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/vetra.git
cd vetra

# Add upstream remote
git remote add upstream https://github.com/vetra/vetra.git

# Install dependencies
pnpm install

# Setup environment
cp backend/.env.example backend/.env
cp frontend/extension/.env.example frontend/extension/.env

# Start services
cd backend
docker-compose up -d
npm run db:migrate

# Start development
npm run dev
```

### Project Structure

```
vetra/
├── frontend/extension/    # Chrome Extension
├── backend/              # Node.js API
├── docs/                 # Documentation
└── .github/              # CI/CD & Templates
```

---

## 📝 Coding Guidelines

### General Principles

- **Keep it simple** - Prefer clarity over cleverness
- **DRY** - Don't Repeat Yourself
- **SOLID** principles
- **Test your code** - Write tests for new features
- **Document your code** - Add JSDoc comments for complex logic

### TypeScript/JavaScript

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function createUser(data: Partial<User>): User {
  // Implementation
}

// ❌ Bad
function createUser(data: any): any {
  // Implementation
}
```

### Naming Conventions

```typescript
// Variables and functions: camelCase
const userName = 'John';
function getUserData() {}

// Classes and interfaces: PascalCase
class UserService {}
interface UserProfile {}

// Constants: UPPER_SNAKE_CASE
const API_URL = 'https://api.vetra.com';

// Files: kebab-case
// user-service.ts
// transaction-analyzer.ts
```

### React Components

```tsx
// ✅ Good - Functional components with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn btn-${variant}`}>
      {label}
    </button>
  );
}

// ❌ Bad - Class components, any types
export class Button extends React.Component<any> {
  render() {
    return <button onClick={this.props.onClick}>{this.props.label}</button>;
  }
}
```

### Backend API

```javascript
// ✅ Good - RESTful, clear structure
router.post('/api/transactions/analyze', [
  authenticateToken,
  validateInput,
  asyncHandler(async (req, res) => {
    const result = await analyzeTransaction(req.body);
    res.json({ success: true, data: result });
  })
]);

// ❌ Bad - No validation, poor error handling
router.post('/analyze', async (req, res) => {
  const result = await analyzeTransaction(req.body);
  res.send(result);
});
```

---

## 📌 Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
# Feature
feat(backend): add multi-agent risk analyzer service

Implements integration with external multi-agent system for
advanced transaction risk analysis.

Refs: #42

# Bug fix
fix(frontend): resolve wallet connection timeout issue

Increases connection timeout from 5s to 15s to handle slow
wallet responses.

Fixes: #123

# Documentation
docs(api): add multi-agent API specification

Adds comprehensive documentation for the multi-agent system
integration including input/output schemas and examples.
```

### Scope Guidelines

- `frontend` - Chrome extension UI/UX
- `backend` - Node.js API
- `ai` - Multi-agent AI system
- `db` - Database schemas and migrations
- `auth` - Authentication and authorization
- `api` - API routes and endpoints
- `docs` - Documentation
- `ci` - CI/CD pipelines
- `deps` - Dependency updates

---

## 🌿 Branch Naming

### Convention

```
<type>-<number>/<short-description>
```

### Types

- `front` - Frontend changes
- `back` - Backend changes
- `ai` - AI/ML changes
- `fix` - Bug fixes
- `docs` - Documentation
- `feat` - New features

### Examples

```bash
front-7/create-home-page
back-12/create-reputation-system
ai-3/implement-token-agent
fix-5/wallet-connection-timeout
docs-2/api-specification
feat-8/multi-language-support
```

---

## 🔄 Pull Request Process

### Before Submitting

1. ✅ **Update your branch** with latest main
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. ✅ **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

3. ✅ **Update documentation** if needed

4. ✅ **Add tests** for new features

5. ✅ **Run linters**
   ```bash
   npm run lint:fix
   npm run format
   ```

### PR Template

Use the [Pull Request Template](.github/pull_request_template.md).

Include:
- **What** changes you made
- **Why** you made them
- **How** to test them
- **Screenshots** (if UI changes)
- **Related issues** (Fixes #123, Refs #456)

### PR Title Format

```
<type>(<scope>): <short description>
```

Examples:
```
feat(backend): add multi-agent integration
fix(frontend): resolve transaction analysis bug
docs(api): update authentication guide
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by at least 1 maintainer
3. **Testing** by reviewer
4. **Approval** and merge

### After Merge

1. **Delete your branch**
   ```bash
   git branch -d your-branch
   git push origin --delete your-branch
   ```

2. **Update your fork**
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

---

## 🧪 Testing Guidelines

### Unit Tests

```typescript
// Example test
describe('RiskAnalyzer', () => {
  it('should return high risk for suspicious transactions', async () => {
    const result = await analyzeTransaction({
      type: 'transfer',
      amount: '1000000',
      to: 'suspicious-address',
    });
    
    expect(result.level).toBe('high');
    expect(result.score).toBeGreaterThan(70);
  });
});
```

### Integration Tests

```typescript
// Example integration test
describe('POST /api/transactions/analyze', () => {
  it('should analyze transaction and return risk score', async () => {
    const response = await request(app)
      .post('/api/transactions/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ transactionData: mockTransaction })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.analysis).toHaveProperty('score');
  });
});
```

---

## 🎨 Style Guide

### Code Formatting

We use:
- **ESLint** for JavaScript/TypeScript
- **Prettier** for code formatting
- **TailwindCSS** for styling

Run before committing:
```bash
npm run lint:fix
npm run format
```

### UI/UX

- Follow Figma designs closely
- Use TailwindCSS utility classes
- Maintain 420x600px dimensions
- Use Vetra color palette
- Ensure 14px border-radius

---

## 🏷️ Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `documentation` - Documentation improvements
- `question` - Further information requested
- `wontfix` - This will not be worked on
- `duplicate` - This issue already exists

---

## 📞 Getting Help

- **Discord:** [Join our community](https://discord.gg/vetra)
- **Email:** dev@vetra.com
- **Discussions:** [GitHub Discussions](https://github.com/vetra/vetra/discussions)

---

## 🌟 Recognition

Contributors will be:
- Listed in [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Mentioned in release notes
- Eligible for bounties (for major contributions)

---

## 📚 Additional Resources

- [Architecture Documentation](docs/ARCHITECTURE.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [API Documentation](backend/docs/MULTI_AGENT_API_SPEC.md)
- [Multi-Agent Guide](backend/docs/MULTI_AGENT_IMPLEMENTATION_GUIDE.md)

---

**Thank you for contributing to Vetra! 🛡️**

