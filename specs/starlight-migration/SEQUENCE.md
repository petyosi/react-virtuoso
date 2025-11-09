# Task Sequence and Dependencies

This document outlines the recommended order for completing tasks in the Starlight migration epic, organized from smallest/easiest to largest/most complex, with dependencies clearly marked.

## Phase 1: Foundation & Setup

These are small, independent tasks that establish the foundation for later work.

### 1. Analytics (12-analytics.md)

**Complexity:** Low | **Size:** Small | **Dependencies:** None

Simple integration of existing Google Analytics tracking ID. Independent task that can be done early.

- Integrate Google Analytics (G-FXF8T3XR4N)
- Test analytics tracking

### 2. Markdown linting & hooks (05-markdown-linting-hooks.md)

**Complexity:** Low | **Size:** Small | **Dependencies:** None

Set up tooling early so all subsequent documentation work follows consistent standards. This prevents having to fix inconsistencies later.

- Configure markdownlint with rules
- Set up lefthook for pre-commit hooks
- Add markdown linting to CI pipeline

### 3. Deployment (09-deployment.md)

**Complexity:** Medium | **Size:** Small | **Dependencies:** None

Set up the deployment pipeline early so you can test continuously throughout the migration. This allows catching deployment issues early.

- Configure site URL in Astro config
- Update workflow to build apps/new-site
- Change static_site_generator config for Astro
- Update artifact path to dist directory
- Verify Paddle env vars are passed through

**Note:** Algolia indexing step will be added later after search configuration (task 11).

## Phase 2: Content Structure

Reorganize the documentation structure before creating new content.

### 4. Docs structure (01-docs-structure.md)

**Complexity:** Medium | **Size:** Medium | **Dependencies:** Markdown linting (task 2)

Core reorganization of docs per package. Do this after linting is set up so all reorganized docs follow standards.

- [ ] Masonry - Guides and API Reference (typedoc setup needed)
- [ ] Gurx - Guides and API Reference (typedoc setup needed)
- [ ] Message List - Guides and API Reference (typedoc from installed package)

### 5. API reference improvements (06-api-reference.md)

**Complexity:** Medium | **Size:** Large | **Dependencies:** Docs structure (task 4)

Improve JSDoc comments in source code. Do after structure is set up so you know where gaps are.

- Audit react-virtuoso API comments
- Audit masonry and gurx API comments
- Add missing JSDoc with examples
- Test typedoc output formatting

### 6. Examples & guides (07-examples-guides.md)

**Complexity:** Medium | **Size:** Medium | **Dependencies:** Docs structure (task 4)

Review and update examples after structure is in place. You'll have better context about what's missing.

- Audit existing examples
- Update dependencies or replace unmaintained ones
- Create examples for common use cases
- Test all examples build and run

## Phase 3: Design & Content Creation

Create design assets and new pages. Design work must come before homepage/pricing to ensure consistent branding.

### 7. Design work (08-design.md)

**Complexity:** Medium | **Size:** Medium-Large | **Dependencies:** None

Create modern design assets and implement styling. Requires human design work (social cards, favicon set, logo review, button design) followed by technical implementation and configuration.

**Human design work:**

- Design modern social card/OG image (1200x630px)
- Create comprehensive favicon set (SVG, ICO, Apple touch icons)
- Review and update logo for light/dark theme support
- Design prev/next button improvements

**Technical implementation:**

- Configure logo and favicon in Astro config
- Implement social card meta tags (Open Graph, Twitter Cards)
- Add prev/next button styling
- Test all assets across browsers and social platforms

### 8. Homepage (03-homepage.md)

**Complexity:** Medium | **Size:** Small | **Dependencies:** Design work (task 7)

Create hero page after design assets are available. Relatively small task.

- Design homepage layout and content
- Implement with Starlight hero components
- Add quick start and package navigation

### 9. Pricing page (02-pricing-page.md)

**Complexity:** Medium | **Size:** Medium | **Dependencies:** Design work (task 7), Deployment (task 3)

Port pricing page after design assets and deployment are ready, so you can test the Paddle integration.

- Port pricing page UI and styling
- Integrate Paddle SDK
- Test payment flow in sandbox

### 10. Content migration & verification (04-content-migration.md)

**Complexity:** Low | **Size:** Large | **Dependencies:** Docs structure (task 4), Examples (task 6)

Systematically verify all content after structure and examples are updated. This is tedious but straightforward.

- Create content inventory from old site
- Verify all pages migrated
- Migrate legal pages (Terms of Use, Privacy Policy, EULA)
- Check and fix internal links
- Validate images and assets

## Phase 4: Integration & Polish

Wire up integrations and validate quality after content is complete.

### 11. Redirects (11-redirects.md)

**Complexity:** Medium | **Size:** Medium | **Dependencies:** Content migration (task 10)

Set up redirects after you know the final URL structure from content migration.

- Port existing redirects from Docusaurus config
- Map all old URLs to new URL structure
- Implement redirects in Astro config or middleware
- Test all old URLs redirect correctly
- Create custom 404 page

### 12. Search functionality (13-search.md)

**Complexity:** High | **Size:** Medium | **Dependencies:** Content migration (task 10), Deployment (task 3)

Configure search after content is finalized so the index is accurate. This is complex due to custom indexing strategy.

- Configure Algolia DocSearch UI with existing credentials
- Design indexing strategy for breaking large pages into sections
- Create indexing script with custom record extraction
- Integrate indexing into GitHub workflow deployment
- Test search results for precision and coverage

**Action:** After completing this task, go back and add the Algolia indexing step to the deployment workflow (task 3).

### 13. Performance, SEO & accessibility (10-performance-seo.md)

**Complexity:** Medium | **Size:** Medium | **Dependencies:** Content migration (task 10), Search (task 12)

Validate site quality after all content and features are in place.

- Performance audit (Core Web Vitals)
- SEO verification (sitemap, meta tags, structured data)
- Accessibility audit (WCAG compliance)
- Mobile and cross-browser testing
- Search functionality testing

## Phase 5: Launch

Final testing and deployment to production.

### 14. Pre-launch testing (14-pre-launch-testing.md)

**Complexity:** Medium | **Size:** Medium | **Dependencies:** All content & integration tasks (1-13)

Comprehensive testing after everything is complete. This is the final gate before launch.

- Feature testing checklist
- Cross-browser testing
- Mobile device testing
- External link validation
- Team review and feedback

### 15. Launch & cutover (15-launch-cutover.md)

**Complexity:** High | **Size:** Small | **Dependencies:** Pre-launch testing (task 14)

Execute the actual switchover. High complexity due to risk, but small in scope.

- Plan launch timing
- Update domain/DNS configuration
- Announce site update
- Monitor post-launch
- Keep old site as backup temporarily

### 16. Cleanup (16-cleanup.md)

**Complexity:** Low | **Size:** Small | **Dependencies:** Launch (task 15) + monitoring period

Clean up after launch is stable and no rollback is needed.

- Archive old site repository
- Remove old site deployment
- Clean up migration artifacts

### 17. Documentation review (17-docs-review.md)

**Complexity:** Low | **Size:** Small | **Dependencies:** Launch (task 15)

Update meta-documentation after the new site is live.

- Update root README
- Update package READMEs
- Update contributing guides

## Phase 6: Build Improvements (Parallel Track)

These tasks are independent improvements to the build/publish process and can be done anytime, even in parallel with the main migration.

### 18. Rolldown exploration (18-rolldown.md)

**Complexity:** Medium | **Size:** Medium | **Dependencies:** None

Optional build optimization. Can be done anytime.

- Benchmark Rolldown vs Vite
- Test compatibility with existing build config
- Evaluate performance trade-offs

### 19. OIDC publishing (19-oidc-publishing.md)

**Complexity:** Medium | **Size:** Small | **Dependencies:** None

Security improvement for npm publishing. Can be done anytime.

- Configure npm OIDC provider
- Update GitHub Actions workflow
- Test publish flow in dry-run mode

---

## Summary: Recommended Task Order

**Quick wins (do first):**

1. Analytics
2. Markdown linting
3. Deployment setup

**Content foundation:**
4. Docs structure
5. API reference
6. Examples & guides

**Design & content creation:**
7. Design work (requires human design + technical implementation)
8. Homepage
9. Pricing page
10. Content migration

**Integration:**
11. Redirects
12. Search (then update deployment workflow)
13. Performance/SEO

**Launch:**
14. Pre-launch testing
15. Launch & cutover
16. Cleanup
17. Docs review

**Optional (anytime):**
18. Rolldown
19. OIDC publishing

## Dependency Graph

```text
Analytics (1) [independent]

Markdown (2) ──┐
               │
               ├──> Docs Structure (4) ──┐
                                         ├──> API Reference (5)
Deployment (3) ────────────────────┐     │
                                   │     └──> Examples (6) ──┐
                                   │                         │
Design (7) ────────┐               │                         ├──> Content Migration (10) ──┐
                   ├──> Homepage (8)                         │                             │
                   │                                         │                             │
                   └──> Pricing (9)       ┌─────────────────┘                             │
                                           │                                               │
                                           └──> Redirects (11) ────────────────┐           │
                                                                               │           │
                                           ┌───────────────────────────────────┤           │
                                           │                                   │           │
                                           └──> Search (12) ───> [update       │           │
                                                 deployment (3)] ──────────────┼───────────┤
                                                                               │           │
                                                                               └──> Performance/SEO (13)
                                                                                          │
                                                                                          └──> Pre-launch (14)
                                                                                                │
                                                                                                └──> Launch (15)
                                                                                                      │
                                                                                                      ├──> Cleanup (16)
                                                                                                      └──> Docs Review (17)

[Rolldown (18) and OIDC (19) can run in parallel with everything]
```
