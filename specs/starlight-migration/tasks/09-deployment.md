# Deployment and hosting

Adapt the existing `.github/workflows/virtuoso.dev.yml` workflow to deploy the new Astro/Starlight site to GitHub Pages. The workflow already has proper permissions, concurrency control, and two-job structure (build + deploy). Changes needed: update the build filter to target apps/new-site, change static_site_generator from "docusaurus" to Astro (or remove), update artifact upload path from `./apps/virtuoso.dev/build` to `./apps/new-site/dist`, and ensure Paddle environment variables (PADDLE_ENVIRONMENT, PADDLE_TOKEN, PADDLE_STANDARD_PRICE_ID, PADDLE_PRO_PRICE_ID) are passed through for the pricing page. Add a step after build to run the Algolia indexing script to update the search index. Verify that astro.config.mjs has the correct site URL (<https://virtuoso.dev>) and base path configuration for GitHub Pages.

## Tasks

- [ ] Configure site URL in Astro config
- [ ] Update workflow to build apps/new-site
- [ ] Change static_site_generator config for Astro
- [ ] Update artifact path to dist directory
- [ ] Verify Paddle env vars are passed through
- [ ] Add Algolia indexing step to workflow
- [ ] Configure Algolia API key as GitHub secret
- [ ] Test workflow deployment to staging
