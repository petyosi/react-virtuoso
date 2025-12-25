# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

This is a pnpm workspaces monorepo. Run commands from the root or within specific workspace packages.

### Root-level commands

- Build all packages: `pnpm build`
- Typecheck all: `pnpm typecheck`
- Lint all: `pnpm lint`
- Test all: `pnpm test`
- E2E tests all: `pnpm e2e`
- Full CI: `pnpm ci` (setup, build, typecheck, lint, lint:md, test, e2e)
- Release: `pnpm release` (build + publish with changesets)
- Add changeset: `pnpm changeset-add`
- Dev docs site: `pnpm dev:docs`

### react-virtuoso package (packages/react-virtuoso/)

- Build: `pnpm run build` (uses vite)
- Test: `pnpm run test` (vitest)
- Test watch: `pnpm run test:watch`
- Run single test: `pnpm vitest <test-file-path>` or `pnpm vitest -t "<test-name>"`
- E2E tests: `pnpm run e2e` (playwright)
- Lint: `pnpm run lint`
- Typecheck: `pnpm run typecheck`
- Dev/preview examples: `pnpm run ladle` (launches Ladle server for browsing examples/ folder)

### virtuoso.dev docs app (apps/virtuoso.dev/)

- Dev server: `pnpm run dev`
- Build: `pnpm run build`
- Typecheck: `pnpm run typecheck`

**IMPORTANT - Documentation Locations:**

**DO NOT EDIT** the following auto-generated directories:

- `apps/virtuoso.dev/src/content/docs/react-virtuoso/`
- `apps/virtuoso.dev/src/content/docs/masonry/`
- `apps/virtuoso.dev/src/content/docs/gurx/`
- `apps/virtuoso.dev/src/content/docs/message-list/`

These are auto-synced from source files + TypeDoc API via the `docsSync` integration. Any edits will be overwritten.

**To edit package documentation**, modify the source files in each package:

- **react-virtuoso**: `packages/react-virtuoso/README.md` or `packages/react-virtuoso/docs/*.md`
- **masonry**: `packages/masonry/README.md` or `packages/masonry/docs/*.md`
- **gurx**: `packages/gurx/README.md` or `packages/gurx/docs/*.md`
- **message-list**: `packages/message-list/README.md` or `packages/message-list/docs/*.md`

## Monorepo Structure

```text
packages/
  react-virtuoso/    - Main virtualization library
  gurx/             - urx state management (fork/variant)
  masonry/          - Masonry layout component
  message-list/     - Chat/message list component
  tooling/          - Shared build tooling

apps/
  virtuoso.dev/     - Starlight/Astro documentation site

examples/            - Ladle stories for testing/development
```

## Architecture

### State Management: urx System

The codebase uses **urx**, a custom reactive state management system built on streams/observables. Core concepts:

- **Systems**: Stateful data-processing machines composed of streams
- **Streams**: Can be stateless (signals) or stateful (depots that persist values)
- **Depots**: Implicit state maintained in stateful streams, transformers (combineLatest), or operators (withLatestFrom, scan)
- **Input/Output**: Systems receive input via input streams, process via transformers/operators, emit via output streams

Key urx files: `src/urx/` directory contains:

- `system.ts` - System creation and composition
- `streams.ts` - Stream primitives
- `pipe.ts` - Stream operators and transformers
- `actions.ts` - Publishing/emitting
- `transformers.ts` - Stream transformation utilities

### Component Architecture

The virtualization logic is split into modular systems in `src/`:

**Core Systems:**

- `listSystem.ts` - Composes all feature systems into the main list system
- `sizeSystem.ts` - Tracks and manages item sizes (critical for variable-height items)
- `listStateSystem.ts` - Manages visible item ranges and scrolling state
- `domIOSystem.ts` - DOM measurements and interactions

**Feature Systems:**

- `groupedListSystem.ts` - Grouped lists with sticky headers
- `scrollToIndexSystem.ts` - Programmatic scroll positioning
- `followOutputSystem.ts` - Auto-scroll for chat/feed UIs
- `initialTopMostItemIndexSystem.ts` - Initial scroll position
- `scrollSeekSystem.ts` - Placeholder rendering during fast scrolling
- `windowScrollerSystem.ts` - Window-scrolling mode
- And many more in `src/*System.ts` files

**React Integration:**

- `react-urx/` - Bridges urx systems to React components
- `Virtuoso.tsx` - Main list component
- `VirtuosoGrid.tsx` - Grid layout component
- `TableVirtuoso.tsx` - Table virtualization component
- Component interfaces in `component-interfaces/`

### Size Calculation

Variable-sized items work automatically via `sizeSystem.ts`:

- Uses ResizeObserver for measurements
- Maintains size ranges and estimates
- No manual height specification needed
- `correctItemSize()` utility in `utils/` handles size corrections

### E2E Testing

E2E tests in `packages/react-virtuoso/e2e/`:

- Test files: `*.test.ts` (Playwright tests)
- Example pages: `examples/*.tsx` (rendered in browser for tests)
- Use Ladle (`pnpm run ladle`) to preview examples during development

## Code Style

- TypeScript with strong typing; avoid `any`
- Prettier: 140 char width, single quotes, no semicolons
- Naming: camelCase for variables/functions, PascalCase for components
- Imports: React first, external libs, then internal modules
- Functional components with hooks preferred
- Use urx system patterns for state management
- Error handling: prefer early returns

## Markdown Style Guide

When writing or editing markdown documentation:

### Formatting Rules

- Headings: ATX-style (`# Heading` not `Heading\n=======`)
- Code blocks: Always use fenced blocks with language specifiers

```typescript
const foo = 'bar'
```

- Lists: Use `-` for unordered lists, indent nested items by 2 spaces
- Emphasis: Use `_single underscore_` for emphasis, `**double asterisk**` for strong
- Links: Prefer inline links `[text](url)` for readability

### Content Guidelines

- Start with clear, descriptive headings (H1 for title, H2 for major sections)
- Use code blocks for all code examples, terminal commands, and file paths
- Include language identifiers in fenced code blocks (`typescript`, `bash`, `json`)
- Break long paragraphs into shorter ones (3-5 sentences max)
- Use tables for structured data comparison
- Add blank lines before and after headings, lists, code blocks, and tables

### Special Cases

- Inline HTML allowed for badges, complex layouts, or special formatting
- Bare URLs allowed in reference sections and changelogs
- Line length not enforced (practical for existing docs)
- Multiple H1 headings allowed (document sections)

### Linting

- Run `pnpm lint:md` to check markdown files
- Run `pnpm lint:md:fix` to auto-fix issues
- Pre-commit hooks automatically lint staged .md files
- Configuration: `.markdownlint.json` and `.markdownlintignore`
- If necessary, use `markdownlint` CLI directly, but prefer pnpm scripts

## Development Workflow

1. Make changes in `packages/react-virtuoso/src/`
2. Run `pnpm test` to verify unit tests
3. Check examples with `pnpm run ladle` if UI changes
4. Run `pnpm e2e` for end-to-end validation
5. Use `pnpm typecheck` and `pnpm lint` before committing
6. If editing documentation, run `pnpm lint:md` to check markdown
7. Pre-commit hooks automatically check staged files (markdown, code, types)
8. Add changeset with `pnpm changeset-add` for versioned changes

## Git Hooks

This project uses [lefthook](https://github.com/evilmartians/lefthook) for git hooks.

### Pre-commit Checks

On every commit, the following checks run automatically on staged files:

- **Markdown linting**: Validates .md files with markdownlint
- **Code linting**: Validates code files with ESLint
- **Type checking**: Runs TypeScript compiler on affected packages

### Skipping Hooks

If you need to skip hooks (e.g., WIP commits):

```bash
LEFTHOOK=0 git commit -m "WIP: work in progress"
# Or use git commit --no-verify (not recommended)
```

### Hook Management

- Configuration: `lefthook.json`
- Install hooks: `pnpm exec lefthook install`
- Uninstall hooks: `pnpm exec lefthook uninstall`
- Run manually: `pnpm exec lefthook run pre-commit`

