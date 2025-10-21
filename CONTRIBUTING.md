# 🤝 Contributing to Vetra

Thank you for your interest in contributing to Vetra! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Coding Standards](#coding-standards)

## 📜 Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct. By participating, you agree to uphold this code.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- pnpm (recommended) or npm
- Git
- Chrome browser (for extension testing)

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/Vetra.git
   cd Vetra
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Load extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select `frontend/extension/dist/`

## 📝 Contributing Guidelines

### Branch Naming

Use descriptive branch names with prefixes:

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `style/` - Code style changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

Examples:
- `feat/google-oauth-integration`
- `fix/login-button-styling`
- `docs/api-documentation`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

Examples:
- `feat(auth): add Google OAuth integration`
- `fix(ui): resolve button alignment issue`
- `docs(readme): update installation instructions`

## 🔄 Pull Request Process

### Before Submitting

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(auth): add Google OAuth integration"
   ```

### Submitting a PR

1. **Push your branch**
   ```bash
   git push origin feat/your-feature-name
   ```

2. **Create a Pull Request**
   - Use the provided PR template
   - Provide a clear description
   - Link related issues
   - Add screenshots if applicable

3. **Respond to feedback**
   - Address review comments
   - Make requested changes
   - Keep the PR up to date

## 🐛 Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** - Check if your issue already exists
2. **Check documentation** - Review README and docs
3. **Reproduce the issue** - Ensure it's reproducible

### Creating an Issue

Use the appropriate issue template:
- **Bug Report** - For bugs and problems
- **Feature Request** - For new features or improvements

Include:
- Clear, descriptive title
- Detailed description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details

## 🎨 Coding Standards

### TypeScript/React

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error handling
- Add JSDoc comments for complex functions

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful variable names
- Keep functions small and focused
- Add comments for complex logic

### File Organization

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
├── store/         # State management
└── styles/        # CSS and styling
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

- Write unit tests for utility functions
- Write integration tests for components
- Test error scenarios
- Aim for good test coverage

## 📚 Documentation

### Updating Documentation

- Update README.md for major changes
- Add JSDoc comments to functions
- Update API documentation
- Include code examples

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add screenshots for UI changes
- Keep documentation up to date

## 🏷️ Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR` - Breaking changes
- `MINOR` - New features (backward compatible)
- `PATCH` - Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version bumped
- [ ] Changelog updated
- [ ] Release notes prepared

## 🤔 Getting Help

- **Discord**: Join our community Discord
- **GitHub Discussions**: Use GitHub Discussions for questions
- **Issues**: Create an issue for bugs or feature requests

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Vetra! 🚀
