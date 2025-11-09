# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based web project (proof of concept) with React integration. Astro is a static site generator that uses a file-based routing system where pages in `src/pages/` are automatically exposed as routes.

## Key Commands

All commands are run from the root of the project:

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server at `localhost:4321`
- `pnpm build` - Build production site to `./dist/`
- `pnpm preview` - Preview production build locally
- `pnpm astro check` - Run TypeScript type checking for Astro files
- `pnpm astro add` - Add integrations/adapters to the project
- `pnpm lint` - Run Biome linter
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm format` - Format code with Biome

## Quality Assurance Workflow

**IMPORTANT**: After completing any feature, bug fix, or significant code change, you MUST:

1. Run `pnpm lint` to check for linting issues
2. Run `pnpm typecheck` to verify TypeScript types
3. If any errors or warnings are found, fix them before considering the task complete
4. Only mark a task as complete after all checks pass successfully

This ensures code quality and prevents broken code from being committed.

## Architecture

### Routing System

Astro uses file-based routing where each file in `src/pages/` becomes a route:
- `src/pages/index.astro` → `/`
- `src/pages/about.astro` → `/about`
- `src/pages/posts/post-1.md` → `/posts/post-1`

Both `.astro` and `.md` files in `src/pages/` are treated as pages.

### React Integration

The project has React enabled via `@astrojs/react` integration (configured in `astro.config.mjs`). React components can be:
- Placed in `src/components/` for organization
- Used in `.astro` files with client directives (e.g., `client:load`, `client:visible`)
- Server-rendered by default unless a client directive is specified

### UI Components and Styling

**IMPORTANT**: When building UI components or adding styles:

1. **Prefer shadcn/ui components**: Always check if a shadcn component exists for your use case before creating custom components. shadcn components are located in `src/components/ui/` and can be added using:
   ```bash
   npx shadcn@latest add <component-name>
   ```

2. **Use Tailwind CSS for styling**: All styling should be done using Tailwind utility classes. Avoid writing custom CSS unless absolutely necessary.

3. **Component organization**:
   - shadcn components: `src/components/ui/`
   - Custom React components: `src/components/`
   - Astro components: `src/components/`

### TypeScript Configuration

The project uses Astro's strict TypeScript configuration (`astro/tsconfigs/strict`). The JSX configuration is set to React mode:
- `jsx: "react-jsx"`
- `jsxImportSource: "react"`

This means React components use the automatic JSX runtime (no need to import React in every file).

### Astro File Structure

`.astro` files have two main sections:
1. **Frontmatter** (between `---` fences): JavaScript/TypeScript code that runs at build time
2. **Template**: HTML-like markup that can include expressions `{variable}` and components

Markdown files in `src/pages/` support frontmatter for metadata (title, pubDate, description, author, image, tags, etc.).

## Static Assets

Place static assets (images, fonts, etc.) in the `public/` directory. They are served from the root path (e.g., `public/favicon.svg` → `/favicon.svg`).
