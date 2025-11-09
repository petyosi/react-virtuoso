# Starlight Migration Epic

This epic tracks the migration from the current Docusaurus documentation site to a new Astro/Starlight-based site.

## Overview

- **Current site**: `apps/virtuoso.dev` (Docusaurus)
- **New site**: `apps/new-site` (Astro + Starlight)
- **Deployment**: GitHub Pages via GitHub Actions workflow
- **Domain**: <https://virtuoso.dev>

## Epic Structure

- `TODO.md` - High-level overview of all tasks in the epic
- `tasks/` - Individual task files, each representing a major work item

## Tasks

1. **01-docs-structure.md** - Reorganize documentation per package
2. **02-pricing-page.md** - Migrate pricing/purchase page with Paddle
3. **03-homepage.md** - Create new hero homepage
4. **04-content-migration.md** - Verify all content migrated
5. **05-markdown-linting-hooks.md** - Setup linting and git hooks
6. **06-api-reference.md** - Improve API documentation
7. **07-examples-guides.md** - Review and update examples
8. **08-design.md** - Migrate and improve design assets
9. **09-deployment.md** - Setup GitHub Pages deployment
10. **10-performance-seo.md** - Performance and SEO validation
11. **11-redirects.md** - URL redirects and 404 page
12. **12-analytics.md** - Google Analytics migration
13. **13-search.md** - Algolia search with custom indexing
14. **14-pre-launch-testing.md** - Comprehensive testing
15. **15-launch-cutover.md** - Launch and monitoring
16. **16-cleanup.md** - Remove old site
17. **17-docs-review.md** - Update READMEs and guides
18. **18-rolldown.md** - (Build improvement) Evaluate Rolldown
19. **19-oidc-publishing.md** - (Build improvement) OIDC for npm

## Workflow

1. Review the high-level TODO.md for epic overview
2. Pick a task from the tasks/ directory
3. Create detailed sub-plans for the task as needed
4. Execute the task
5. Mark completed items in both the task file and TODO.md
