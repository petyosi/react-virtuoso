# Starlight Migration Tasks

This is a list of tasks that aim to replace the current documentation (docusaurus) with a new site built with starlight.

New site is at apps/new-site, old one is at apps/virtuoso.dev.

## Re-organize the way the docs are structured

Make top-level navigation per package, each section has its own sidebar - one that includes guides and API reference. It uses READMEs for the package landing page, and reads the docs from the package's docs folder. This task does not aim to produce new content - just reorganize the existing content. The docsSync integration already handles copying READMEs and docs folders from each package.

Message List is a private package (no source code in repo), but will have a documentation stub at packages/message-list following the same structure (README.md and docs/ folder). For its API reference, configure TypeDoc to read from the installed package at `node_modules/@virtuoso.dev/message-list/dist/index.d.ts` (similar to the old Docusaurus setup).

- [x] Virtuoso - API Reference and Guides
- [ ] Masonry - Guides and API Reference (typedoc setup needed)
- [ ] Gurx - Guides and API Reference (typedoc setup needed)
- [ ] Message List - Guides and API Reference (typedoc from installed package)

## Migrate the pricing page

Take the pricing/purchase page from the old site and make it work on the new site. Use styling and components from the new site, integrate the Paddle SDK as in the old site. Test the full payment flow in Paddle's sandbox environment before going live to ensure checkout, webhooks, and license delivery work correctly.

- [ ] Port pricing page UI and styling
- [ ] Integrate Paddle SDK
- [ ] Test payment flow in sandbox

## Create a homepage

Create a Starlight hero page that introduces the project and its value proposition. Should showcase key features (performance, ease of use, flexibility), include a quick start CTA, link to all packages, and highlight real-world usage. Consider including a live demo or performance comparison to demonstrate virtualization benefits.

- [ ] Design homepage layout and content
- [ ] Implement with Starlight hero components
- [ ] Add quick start and package navigation

## Content migration and verification

Systematically verify that all content from the old Docusaurus site has been migrated to the new Starlight site. Create a checklist of all pages, guides, and examples from the old site. The old site has legal pages (Terms of Use, Privacy Policy, Message List EULA) that need to be migrated. Check for any missing images, code examples, or supplementary files. Ensure all internal links have been updated to the new URL structure.

- [ ] Create content inventory from old site
- [ ] Verify all pages migrated
- [ ] Migrate legal pages (Terms of Use, Privacy Policy, EULA)
- [ ] Check and fix internal links
- [ ] Validate images and assets

## Markdown linting and git hooks

Integrate `markdownlint` with consistent rules for documentation quality. Set up `lefthook` (or `husky`) to run markdown linting, code linting, and type checking on pre-commit hooks. This ensures all committed docs meet quality standards. Add project-specific Claude Code instructions in CLAUDE.md to guide AI-assisted documentation creation according to the established style.

- [ ] Configure markdownlint with rules
- [ ] Set up lefthook for pre-commit hooks
- [ ] Add markdown linting to CI pipeline
- [ ] Document style guide in CLAUDE.md

## Improve the API reference content

The API reference is auto-generated from TypeDoc comments in source code. Audit all public APIs to ensure JSDoc comments are complete and helpful. Use TypeDoc's features to inline interfaces and type definitions where appropriate for better docs readability. Consider using TypeDoc plugins like `typedoc-plugin-markdown` features for better integration with Starlight. Add examples in comments where complex APIs benefit from usage demonstrations.

- [ ] Audit react-virtuoso API comments
- [ ] Audit masonry and gurx API comments
- [ ] Add missing JSDoc with examples
- [ ] Test typedoc output formatting

## Reorganize examples and guides

Review existing examples in packages/react-virtuoso/examples/ and documentation. Update or remove examples using unmaintained dependencies (check if current packages still work). Identify gaps in coverage - areas where users commonly need guidance but docs are thin. Create new focused examples for advanced use cases like window scrolling, grouped lists, or third-party integrations. Ensure all examples work with current package versions.

- [ ] Audit existing examples
- [ ] Update dependencies or replace unmaintained ones
- [ ] Create examples for common use cases
- [ ] Test all examples build and run

## Design work

The old site has existing assets: favicon (`img/favicon.ico`), logo (`img/new-logo.svg`), and social card (`img/social-card.jpg`). Migrate these to the new site and ensure they're properly configured in Astro/Starlight. Generate additional favicon sizes if needed for different platforms. Review the social card image and update if necessary to better showcase the Virtuoso brand. Improve the prev/next navigation button styling to match the overall design system.

- [ ] Migrate existing favicon, logo, and social card
- [ ] Generate additional favicon sizes if needed
- [ ] Configure assets in Astro config
- [ ] Review and update social card if needed
- [ ] Improve prev/next button styling
- [ ] Review overall visual consistency

## Deployment and hosting

Adapt the existing `.github/workflows/virtuoso.dev.yml` workflow to deploy the new Astro/Starlight site to GitHub Pages. The workflow already has proper permissions, concurrency control, and two-job structure (build + deploy). Changes needed: update the build filter to target apps/new-site, change static_site_generator from "docusaurus" to Astro (or remove), update artifact upload path from `./apps/virtuoso.dev/build` to `./apps/new-site/dist`, and ensure Paddle environment variables (PADDLE_ENVIRONMENT, PADDLE_TOKEN, PADDLE_STANDARD_PRICE_ID, PADDLE_PRO_PRICE_ID) are passed through for the pricing page. Add a step after build to run the Algolia indexing script to update the search index. Verify that astro.config.mjs has the correct site URL (<https://virtuoso.dev>) and base path configuration for GitHub Pages.

- [ ] Configure site URL in Astro config
- [ ] Update workflow to build apps/new-site
- [ ] Change static_site_generator config for Astro
- [ ] Update artifact path to dist directory
- [ ] Verify Paddle env vars are passed through
- [ ] Add Algolia indexing step to workflow
- [ ] Configure Algolia API key as GitHub secret
- [ ] Test workflow deployment to staging

## Performance, SEO, and accessibility

Validate Core Web Vitals (LCP, FID, CLS) meet targets. Ensure Starlight's built-in optimizations are working (sitemap generation, meta tags, canonical URLs). Test search functionality and verify search index is comprehensive. Run accessibility audit with axe or Lighthouse to ensure WCAG compliance. Test mobile responsiveness across devices. Verify page load times are acceptable on slower connections.

- [ ] Performance audit (Core Web Vitals)
- [ ] SEO verification (sitemap, meta tags, structured data)
- [ ] Accessibility audit (WCAG compliance)
- [ ] Mobile and cross-browser testing
- [ ] Search functionality testing

## Redirects and URL mapping

Create comprehensive redirect map from old Docusaurus URLs to new Starlight URLs to preserve SEO and prevent broken external links. The old site already has some redirects defined (e.g., `/virtuoso-api-reference/` → `/virtuoso-api/`, `/prepend-items` → `/virtuoso-message-list/`) that need to be ported. Since we're using GitHub Pages, redirects can be handled via Astro's redirects config in astro.config.mjs or using Astro middleware for more complex patterns. Test all old URLs to ensure they redirect correctly. Implement 301 permanent redirects for moved content and create a custom 404 page.

- [ ] Port existing redirects from Docusaurus config
- [ ] Map all old URLs to new URL structure
- [ ] Implement redirects in Astro config or middleware
- [ ] Test all old URLs redirect correctly
- [ ] Create custom 404 page

## Analytics and monitoring

The old site uses Google Analytics (gtag) with tracking ID `G-FXF8T3XR4N`. Migrate this to the new Astro site to maintain historical continuity. Consider adding error monitoring (Sentry) and uptime monitoring.

- [ ] Integrate Google Analytics (G-FXF8T3XR4N)
- [ ] Test analytics tracking
- [ ] Set up error monitoring (optional)
- [ ] Configure uptime monitoring (optional)

## Search functionality

The old site uses Algolia DocSearch (appId: `4WOO4PYOJ1`, apiKey: `58ec33a27668285517259ebd5a1d4e77`, indexName: `virtuoso`). Migrate to the new site with custom indexing instead of automatic crawling. Some documentation pages are too large and should be broken into multiple searchable sections for better search precision. Configure custom record extraction to split large pages by headings or logical sections. The re-indexing should be automated in the GitHub workflow deployment process so the search index updates whenever the site deploys.

- [ ] Configure Algolia DocSearch UI with existing credentials
- [ ] Design indexing strategy for breaking large pages into sections
- [ ] Create indexing script with custom record extraction
- [ ] Integrate indexing into GitHub workflow deployment
- [ ] Test search results for precision and coverage

## Pre-launch testing

Comprehensive testing checklist before switching domains. Test all interactive features (search, code examples, payment flow). Verify all external links work. Check cross-browser compatibility (Chrome, Firefox, Safari, Edge). Test on mobile devices. Run through common user journeys. Have team members review and provide feedback. Create rollback plan in case issues are discovered post-launch.

- [ ] Feature testing checklist
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] External link validation
- [ ] Team review and feedback

## Launch and cutover

Plan the actual switch from old to new site. Update DNS/domain configuration to point to new site. Monitor for issues immediately after launch. Communicate the change to users (blog post, social media, etc.). Keep old site accessible temporarily as fallback. Monitor analytics and error logs for anomalies.

- [ ] Plan launch timing
- [ ] Update domain/DNS configuration
- [ ] Announce site update
- [ ] Monitor post-launch
- [ ] Keep old site as backup temporarily

## Cleanup

After the new site is stable and no issues are found, archive or remove the old Docusaurus site. Update any remaining references to the old site structure in docs or READMEs. Clean up any temporary build artifacts or migration scripts no longer needed.

- [ ] Archive old site repository
- [ ] Remove old site deployment
- [ ] Clean up migration artifacts

## Documentation review

Review root-level README to ensure it reflects the new site structure and URLs. Update any development documentation that references the old docs site. Ensure contributing guides point to the correct documentation folders. Update package READMEs if they link to specific docs pages.

- [ ] Update root README
- [ ] Update package READMEs
- [ ] Update contributing guides

## Build and publishing

These are improvements to the build and publishing process, separate from the docs migration.

## Rolldown exploration

Evaluate replacing Vite with Rolldown for package builds. Rolldown is a Rust-based bundler (Rollup successor) that promises faster build times. Benchmark build performance against current Vite setup. Ensure all existing build features work (TypeScript, JSX, tree-shaking). Only switch if there are meaningful performance gains without regressions.

- [ ] Benchmark Rolldown vs Vite
- [ ] Test compatibility with existing build config
- [ ] Evaluate performance trade-offs

## OIDC publishing

Set up OpenID Connect (OIDC) for automated npm publishing from CI without long-lived tokens. This is more secure than storing NPM_TOKEN in GitHub secrets. Configure GitHub Actions to use OIDC provider for authenticating to npm. Test with a dry run to ensure publish workflow works correctly with changesets.

- [ ] Configure npm OIDC provider
- [ ] Update GitHub Actions workflow
- [ ] Test publish flow in dry-run mode
