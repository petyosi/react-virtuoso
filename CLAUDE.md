# React Virtuoso Codebase Guide

## Build Commands
- Lint: `npm run lint`
- Test: `npm run test`
- Run single test: `npx vitest <test-file-path>` or `npx vitest -t "<test-name>"`
- E2E tests: `npm run e2e` or `npx playwright test <test-file>`
- Dev environment: `npm run dev`

## Code Style Guidelines
- Use TypeScript with strong typing; avoid `any` when possible
- Format: prettier with 140 char width, single quotes, no semicolons
- Naming: camelCase for variables/functions, PascalCase for components/classes
- Imports: group React imports first, then external libs, then internal modules
- Prefer functional components with hooks over class components
- Use the urx state management system for component state
- Error handling: prefer early returns over deep nesting
- Use test-driven development with vitest for unit tests
- Keep components focused on a single responsibility

## Performance Considerations
- Optimize rendering with memoization where appropriate
- Ensure proper cleanup in useEffect hooks
- Be cautious with closures capturing outdated values
