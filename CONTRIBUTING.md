# Contributing

Thank you for your interest in contributing to the Last.fm README GitHub Action! 🎵

We welcome contributions of all kinds - whether you're reporting bugs, suggesting features, improving documentation, or submitting code changes. This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Testing](#testing)
- [Golden File Tests](#golden-file-tests)
- [Making Changes](#making-changes)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful, inclusive, and constructive in all interactions.

## Getting Started

### Prerequisites

- **Node.js**: Version 24+
- **pnpm**: Version 9+

### Fork and Clone

1. Fork this repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/lastfm-readme.git
   cd lastfm-readme
   ```

## Development Environment

### Installation

```bash
# Install dependencies
pnpm install

# Verify installation
pnpm run types    # TypeScript check
pnpm run lint     # ESLint check
pnpm test         # Run tests
```

### Available Scripts

```bash
pnpm build          # Build the action
pnpm test           # Run all tests
pnpm test:coverage       # Run tests with coverage report
pnpm lint           # Lint code with ESLint
pnpm format         # Format code with Prettier
pnpm types          # TypeScript type checking
```

### Local Development Mode

This project includes a powerful local development mode that allows you to test all functionality without GitHub Actions.

#### Setup

1. Copy `.env.example` to `.env` and fill in your Last.fm API key and username:
   ```bash
   cp .env.example .env
   ```
2. Create a test `README.md` file with the desired sections:

   ```markdown
   ## Example

   <!--START_LASTFM_ARTISTS:{"period": "7day", "rows": 5}-->
   <!--END_LASTFM_ARTISTS-->

   <!--START_LASTFM_RECENT:{"rows": 5}-->
   <!--END_LASTFM_RECENT-->
   ```

3. Run the local development script:
   ```bash
   pnpm dev
   ```

## Testing

This project maintains a comprehensive test suite to ensure code quality and prevent regressions.

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test complete workflows end-to-end
- **Golden File Tests**: Test output formatting and generation

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test files
pnpm test tests/unit/section.test.ts

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

- Place unit tests in `tests/unit/`
- Place integration tests in `tests/integration/`
- Use descriptive test names that explain the scenario
- Mock external dependencies (GitHub API, Last.fm API)
- Aim for high coverage of new code

## Golden File Tests

Golden file tests compare actual output against pre-approved reference files. This is perfect for testing README generation where we care about exact formatting.

### Understanding Golden Files

Golden files are stored in `tests/golden/fixtures/` and contain the expected output for various scenarios:

```
tests/golden/fixtures/
├── sample-input.json              # Test input data
├── sample-lastfm-data.json        # Mock Last.fm API responses
├── expected-artists-section.md    # Expected artists section output
└── expected-recent-section.md     # Expected recent tracks output
```

### Updating Golden Files

When you intentionally change the output format (like modifying how sections are rendered), you need to update the golden files:

```bash
# Regenerate all golden files
UPDATE_GOLDEN=true pnpm test tests/golden
```

**⚠️ Important**: Only use `UPDATE_GOLDEN=true` when you've intentionally changed the output format. Always review the diff to ensure the changes are what you expect.

### When to Update Golden Files

**✅ Update golden files when:**

- You modify section formatting or layout
- You change how data is rendered (e.g., number formatting)
- You add new configuration options that affect output
- You fix formatting bugs

**❌ Don't update golden files when:**

- Tests are failing due to logic errors
- You haven't reviewed what changed
- The output looks wrong or broken

### Golden File Workflow

1. Make your changes to the code
2. Run tests - they will fail showing the diff
3. Review the diff carefully
4. If the changes look correct, run `UPDATE_GOLDEN=true pnpm test tests/golden`
5. Commit both your code changes and the updated golden files

## Making Changes

### Adding New Features

When adding new features:

1. **Add types** first in `src/lastfm/types.ts` if needed
2. **Write tests** before implementing (TDD approach recommended)
3. **Update documentation** in README.md if user-facing
4. **Add golden file tests** if the feature affects output formatting
5. **Ensure backwards compatibility** or document breaking changes

### Common Development Tasks

**Adding a new section type:**

1. Add the section type to `SectionComment` in `src/section.ts`
2. Create a new file in `src/sections/` (e.g., `nowplaying.ts`)
3. Add the section updater to `src/index.ts`
4. Add comprehensive tests in `tests/unit/`
5. Add golden file tests for the new section format

**Modifying output formatting:**

1. Update the formatting logic in `src/section.ts`
2. Run tests to see what changed
3. Review the changes carefully
4. Update golden files with `UPDATE_GOLDEN=true pnpm test tests/golden`
5. Update documentation if needed

---

**Happy Contributing!** 🎵✨
