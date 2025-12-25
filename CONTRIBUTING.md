# Contributing to React Virtuoso

Thank you for your interest in contributing to React Virtuoso! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- pnpm (this project uses pnpm workspaces)

### Initial Setup

1. Fork and clone the repository
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build all packages:

   ```bash
   pnpm build
   ```

## Project Structure

This is a pnpm workspaces monorepo with the following structure:

```text
packages/
  react-virtuoso/    - Main virtualization library
  gurx/              - urx state management (fork/variant)
  masonry/           - Masonry layout component
  message-list/      - Chat/message list component
  tooling/           - Shared build tooling

apps/
  virtuoso.dev/      - Docusaurus documentation site (current)
  new-site/          - Starlight/Astro documentation site (migration in progress)

examples/            - Ladle stories for testing/development
```

## Development Workflow

### Running the Development Server

The `react-virtuoso` package uses [Ladle](https://ladle.dev/) for interactive development and testing:

```bash
cd packages/react-virtuoso
pnpm run ladle
```

This launches a server where you can browse and interact with examples from the `examples/` folder.

### Making Changes

1. Create a new branch for your feature or fix
2. Make your changes in the appropriate package
3. Write or update tests as needed
4. Ensure all tests pass and linting is clean

### Testing

#### Unit Tests

Run unit tests across all packages:

```bash
pnpm test
```

For the react-virtuoso package specifically:

```bash
cd packages/react-virtuoso
pnpm run test
```

Run tests in watch mode during development:

```bash
pnpm run test:watch
```

Run a specific test file or test name:

```bash
pnpm vitest <test-file-path>
pnpm vitest -t "<test-name>"
```

#### End-to-End Tests

Run the Playwright E2E test suite:

```bash
pnpm e2e
```

E2E tests run against Ladle examples and are located in `packages/react-virtuoso/e2e/`.

### Code Quality

Before submitting your changes, ensure:

#### Linting

```bash
pnpm lint
```

Auto-fix linting issues:

```bash
pnpm lint:fix
```

#### Type Checking

```bash
pnpm typecheck
```

#### Markdown Linting

```bash
pnpm lint:md
```

Auto-fix markdown issues:

```bash
pnpm lint:md:fix
```

### Full CI Check

Run the complete CI pipeline locally:

```bash
pnpm ci
```

This runs: setup, build, typecheck, lint, lint:md, test, and e2e.

## Git Hooks

This project uses [lefthook](https://github.com/evilmartians/lefthook) for git hooks. Pre-commit hooks automatically run on staged files:

- Markdown linting on `.md` files
- Code linting with ESLint
- Type checking on affected packages

To skip hooks (use sparingly):

```bash
LEFTHOOK=0 git commit -m "WIP: work in progress"
```

## Changesets

This project uses [changesets](https://github.com/changesets/changesets) for version management and changelog generation.

When making changes that affect the public API or user-facing behavior:

```bash
pnpm changeset-add
```

Follow the prompts to:

1. Select which packages are affected
2. Choose the version bump type (major, minor, patch)
3. Write a description of your changes

The changeset files are committed with your PR and used during release.

## Documentation

### Editing Documentation

Documentation is auto-synced from package source files to the Starlight docs site.

**DO NOT EDIT** these auto-generated directories:

- `apps/new-site/src/content/docs/react-virtuoso/`
- `apps/new-site/src/content/docs/masonry/`
- `apps/new-site/src/content/docs/gurx/`
- `apps/new-site/src/content/docs/message-list/`

Instead, edit the source files in each package:

- **react-virtuoso**: `packages/react-virtuoso/README.md` or `packages/react-virtuoso/docs/*.md`
- **masonry**: `packages/masonry/README.md` or `packages/masonry/docs/*.md`
- **gurx**: `packages/gurx/README.md` or `packages/gurx/docs/*.md`
- **message-list**: `packages/message-list/README.md` or `packages/message-list/docs/*.md`

### Running the Documentation Site

```bash
cd apps/new-site
pnpm run dev
```

The site will be available at `http://localhost:4321/`

## Code Style Guidelines

- Use TypeScript with strong typing; avoid `any`
- Prettier: 140 character width, single quotes, no semicolons
- Naming: camelCase for variables/functions, PascalCase for components
- Imports: React first, external libraries, then internal modules
- Functional components with hooks preferred
- Use urx system patterns for state management

## Pull Request Process

1. Update documentation if you're changing public APIs
2. Add tests for new features or bug fixes
3. Ensure all tests pass and linting is clean
4. Add a changeset if your changes affect versioning
5. Update relevant example files if applicable
6. Write a clear PR description explaining:
   - What changes you made
   - Why you made them
   - Any relevant issue numbers

## Architecture Overview

React Virtuoso uses a custom reactive state management system called **urx**. Key concepts:

- **Systems**: Stateful data-processing machines composed of streams
- **Streams**: Can be stateless (signals) or stateful (depots)
- **Transformers**: Stream transformation utilities

The virtualization logic is split into modular systems in `packages/react-virtuoso/src/`:

- `listSystem.ts` - Main composition of all feature systems
- `sizeSystem.ts` - Item size tracking and management
- `listStateSystem.ts` - Visible item ranges and scrolling state
- `domIOSystem.ts` - DOM measurements and interactions
- Various feature systems for grouped lists, scroll positioning, etc.

## Getting Help

- Check existing [issues](https://github.com/petyosi/react-virtuoso/issues)
- Review the [documentation](https://virtuoso.dev)
- Ask questions in [discussions](https://github.com/petyosi/react-virtuoso/discussions)

## License

By contributing to React Virtuoso, you agree that your contributions will be licensed under its MIT License.
