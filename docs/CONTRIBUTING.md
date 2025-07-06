# Contributing to 3D/WHISKY E-commerce

Thank you for your interest in contributing to this project! This document provides guidelines and information for contributors.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project follows a standard code of conduct:
- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment
- Report any unacceptable behavior

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- PostgreSQL (for local development)

### Local Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/whisky-3d-models-ecommerce.git
   cd whisky-3d-models-ecommerce
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

5. Set up the database:
   ```bash
   npm run dev:setup
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements
- `chore/description` - Maintenance tasks

### Commit Message Format
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test changes
- `chore`: Build/CI changes

**Examples:**
```
feat(auth): add OAuth login support
fix(cart): resolve quantity update issue
docs(api): update authentication guide
test(e2e): add product purchase flow tests
```

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use strict TypeScript configuration

### React/Next.js
- Use functional components with hooks
- Follow React best practices
- Use Next.js App Router conventions
- Implement proper error boundaries

### Styling
- Use Tailwind CSS for styling
- Follow responsive design principles
- Maintain consistent design patterns
- Use semantic HTML elements

### Code Quality
- Run ESLint and fix all warnings
- Use Prettier for code formatting
- Write meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### File Structure
```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── lib/                # Utility functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Helper utilities
└── styles/             # Global styles
```

## Testing Guidelines

### Unit Tests
- Write tests for utility functions
- Test React components with React Testing Library
- Mock external dependencies
- Aim for high test coverage

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### E2E Tests
- Write E2E tests for critical user flows
- Test authentication, purchasing, and 3D model interaction
- Use Playwright for cross-browser testing
- Include mobile and desktop testing

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test
npx playwright test auth.spec.ts
```

### Test Requirements
- All new features must include tests
- Bug fixes should include regression tests
- Tests should be reliable and not flaky
- Use meaningful test descriptions

## Pull Request Process

### Before Submitting
1. Create a feature branch from `main`
2. Make your changes with proper commits
3. Add/update tests as needed
4. Update documentation if required
5. Run the full test suite
6. Ensure code passes linting

### PR Checklist
- [ ] Code follows project conventions
- [ ] Tests pass locally
- [ ] No ESLint warnings or errors
- [ ] TypeScript compilation succeeds
- [ ] Documentation updated (if needed)
- [ ] PR title follows conventional commit format
- [ ] Description explains the change and reasoning

### PR Template
The repository includes a PR template that covers:
- Summary of changes
- Type of change
- Testing performed
- Breaking changes (if any)
- Security considerations

### Review Process
1. Automated checks run on PR creation
2. Code review by maintainers
3. Address feedback and update PR
4. Final approval and merge

## Issue Reporting

### Bug Reports
Use the bug report template and include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment information
- Screenshots (if applicable)
- Console errors

### Feature Requests
Use the feature request template and include:
- Problem statement
- Proposed solution
- Use cases
- Acceptance criteria
- Priority level

### Issue Labels
- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation needs
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high/medium/low` - Priority levels

## Development Tips

### Debugging
- Use browser developer tools
- Enable React Developer Tools
- Use Next.js debugging features
- Check server and client logs

### Performance
- Monitor bundle size with `npm run analyze`
- Use React Profiler for performance issues
- Optimize images and assets
- Consider code splitting for large components

### 3D Model Development
- Test 3D models in different browsers
- Consider performance on mobile devices
- Optimize model file sizes
- Handle WebGL context loss

### Database
- Create migrations for schema changes
- Test database operations locally
- Consider data seeding for development
- Backup before major changes

## Getting Help

- Check existing issues and documentation
- Ask questions in issue discussions
- Review the codebase for examples
- Reach out to maintainers if needed

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes (for significant contributions)
- Project documentation

Thank you for contributing to 3D/WHISKY E-commerce!