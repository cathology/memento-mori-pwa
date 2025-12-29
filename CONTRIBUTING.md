# Contributing to Memento Mori PWA

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Code of Conduct

- Be respectful and considerate
- Welcome newcomers and help them learn
- Focus on constructive criticism
- Remember the contemplative nature of this app

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/device information
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has been suggested
2. Consider if it aligns with the minimalist philosophy
3. Create an issue explaining:
   - The problem it solves
   - Proposed solution
   - Alternative solutions considered

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m 'Add: amazing feature description'`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Development Setup
```bash
git clone https://github.com/yourusername/memento-mori-pwa.git
cd memento-mori-pwa
npm install
npm run dev
```

## Coding Standards

### TypeScript
- Use explicit types, avoid `any`
- Prefer interfaces over type aliases for object shapes
- Use functional components with hooks

### React
- Keep components focused and small
- Use descriptive prop names
- Add ARIA labels for accessibility

### CSS/Tailwind
- Use Tailwind utilities first
- Only add custom CSS when necessary
- Maintain responsive design

### Commits
- Use conventional commits format
- Keep commits atomic and focused
- Write clear commit messages

## Testing
```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

All PRs should include tests for new functionality.

## Documentation

- Update README.md for user-facing changes
- Update DESIGN.md for UX decisions
- Add JSDoc comments for complex functions
- Update type definitions

## Review Process

1. Automated checks must pass (linting, tests, build)
2. Code review by maintainer(s)
3. Changes requested if needed
4. Approval and merge

## Questions?

Open an issue with the "question" label or reach out to maintainers.

Thank you for contributing! 🙏
