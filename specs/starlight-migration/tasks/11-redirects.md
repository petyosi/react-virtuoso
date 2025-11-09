# Redirects and URL mapping

Create comprehensive redirect map from old Docusaurus URLs to new Starlight URLs to preserve SEO and prevent broken external links. The old site already has some redirects defined (e.g., `/virtuoso-api-reference/` → `/virtuoso-api/`, `/prepend-items` → `/virtuoso-message-list/`) that need to be ported. Since we're using GitHub Pages, redirects can be handled via Astro's redirects config in astro.config.mjs or using Astro middleware for more complex patterns. Test all old URLs to ensure they redirect correctly. Implement 301 permanent redirects for moved content and create a custom 404 page.

## Tasks

- [ ] Port existing redirects from Docusaurus config
- [ ] Map all old URLs to new URL structure
- [ ] Implement redirects in Astro config or middleware
- [ ] Test all old URLs redirect correctly
- [ ] Create custom 404 page
