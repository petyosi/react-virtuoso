# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based web project (proof of concept) with React integration, located in the `apps/astro-poc` directory of the React Virtuoso monorepo. Astro is a static site generator that uses a file-based routing system where pages in `src/pages/` are automatically exposed as routes.

## Monorepo Context

This project is part of a larger npm workspaces monorepo. The monorepo root is located at `/Users/petyo/w/virtuoso/react-virtuoso`.

### Monorepo Commands

Commands can be run from either:
- **Monorepo root**: Use `npm run <script> --workspace astro-poc`
- **This directory** (`apps/astro-poc`): Run commands directly with `npm run <script>`

## Key Commands

All commands below assume you're in the `apps/astro-poc` directory:

- `npm install` - Install dependencies (run from monorepo root)
- `npm run dev` - Start development server at `localhost:4321`
- `npm run build` - Build production site to `./dist/`
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands
- `npm run lint` - Run Biome linter
- `npm run lint:fix` - Run Biome linter with auto-fix
- `npm run typecheck` - Run TypeScript type checking with Astro
- `npm run format` - Format code with Biome

## Quality Assurance Workflow

**IMPORTANT**: After completing any feature, bug fix, or significant code change, you MUST:

1. Run `npm run lint` to check for linting issues
2. Run `npm run typecheck` to verify TypeScript types
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
