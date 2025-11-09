# Deployment - Enhanced Analysis

## Critical Workflow Changes

### Current State

- **Existing workflow**: `.github/workflows/virtuoso.dev.yml`
- **Current target**: `apps/virtuoso.dev` (Docusaurus)
- **Build output**: `./apps/virtuoso.dev/build`
- **Target**: GitHub Pages at `virtuoso.dev`

### Required Changes

#### 1. Astro Configuration

**File**: `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/astro.config.mjs`

Add at root level:

```javascript
export default defineConfig({
  site: 'https://virtuoso.dev',
  base: '/',
  // ... existing integrations
})
```

**Why critical:**

- `site` required for sitemap generation and canonical URLs
- `base` ensures asset paths work correctly on GitHub Pages
- Since deploying to root domain, `base: '/'`

#### 2. Create CNAME and .nojekyll

**File**: `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/public/CNAME`

```text
virtuoso.dev
```

**File**: `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/public/.nojekyll`
(Empty file - prevents GitHub Pages Jekyll processing)

#### 3. Update GitHub Actions Workflow

**File**: `/Users/petyo/w/virtuoso/react-virtuoso/.github/workflows/virtuoso.dev.yml`

**Key modifications:**

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.24.0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: pnpm

      - name: Setup Pages
        uses: actions/configure-pages@v4
        # Remove or comment out: static_site_generator: docusaurus

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build the Astro site
        run: pnpm --filter starlight-poc run build
        env:
          PADDLE_ENVIRONMENT: ${{ vars.PADDLE_ENVIRONMENT }}
          PADDLE_TOKEN: ${{ vars.PADDLE_TOKEN }}
          PADDLE_STANDARD_PRICE_ID: ${{ vars.PADDLE_STANDARD_PRICE_ID }}
          PADDLE_PRO_PRICE_ID: ${{ vars.PADDLE_PRO_PRICE_ID }}

      # Placeholder for future Algolia indexing (Task 13)
      # - name: Update Algolia search index
      #   run: pnpm --filter starlight-poc run index-algolia
      #   env:
      #     ALGOLIA_ADMIN_API_KEY: ${{ secrets.ALGOLIA_ADMIN_API_KEY }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./apps/new-site/dist  # Changed from ./apps/virtuoso.dev/build

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Specific Changes Summary

1. **Line 41**: Remove or comment `static_site_generator: docusaurus`
2. **Lines 44-45**: Change to `pnpm --filter starlight-poc run build`
3. **Line 54**: Update artifact path to `./apps/new-site/dist`
4. **Lines 46-50**: Preserve Paddle environment variables
5. **After line 50**: Add placeholder comment for Algolia indexing (Task 13)

### Environment Variables

**Paddle Configuration** (already in workflow):

- `PADDLE_ENVIRONMENT` - 'sandbox' or 'production'
- `PADDLE_TOKEN` - Paddle API token
- `PADDLE_STANDARD_PRICE_ID` - Standard license price ID
- `PADDLE_PRO_PRICE_ID` - Pro license price ID

**Astro Implementation:**

```typescript
// In pricing page component
const paddleConfig = {
  environment: import.meta.env.PUBLIC_PADDLE_ENVIRONMENT,
  token: import.meta.env.PUBLIC_PADDLE_TOKEN,
  standardPriceId: import.meta.env.PUBLIC_PADDLE_STANDARD_PRICE_ID,
  proPriceId: import.meta.env.PUBLIC_PADDLE_PRO_PRICE_ID,
}
```

Note: `PUBLIC_` prefix makes variables available client-side for Paddle SDK initialization.

### Dependencies

**Hard Dependencies:**

- Task 2 (Pricing page) must be implemented first
- Ensures Paddle env var flow is tested

**Soft Dependencies:**

- Task 13 (Search) will add indexing step later
- Workflow designed to accommodate this addition

### Testing Strategy

#### Local Build Test

```bash
cd apps/new-site
PADDLE_ENVIRONMENT=sandbox \
PADDLE_TOKEN=test_token \
PADDLE_STANDARD_PRICE_ID=pri_test \
PADDLE_PRO_PRICE_ID=pri_test \
pnpm build

pnpm preview
```

#### Verify Build Output

- Check `dist/` directory created
- Verify CNAME file present in dist/
- Verify .nojekyll file present
- Check asset paths in HTML files

#### Pre-Production Checklist

- [ ] Site builds successfully
- [ ] All environment variables pass through
- [ ] Pricing page renders correctly
- [ ] Links work correctly
- [ ] Assets load properly
- [ ] Custom domain resolves
- [ ] HTTPS works

### Rollback Plan

**If deployment fails:**

1. Workflow has concurrency control to prevent overlapping deploys
2. Can quickly revert Git commit and re-trigger
3. Old site artifacts preserved in previous workflow runs
4. Can switch workflow back to old site quickly
5. No DNS changes needed (same repository)

### Search Integration (Future - Task 13)

**Phase 1 (This Task):**

- Configure Starlight to use Pagefind (default) or Algolia DocSearch plugin
- Install `@astrojs/starlight-docsearch` if using Algolia
- Initially rely on automatic crawler

**Phase 2 (Task 13 Returns Here):**

- Add indexing step after build
- Configure `ALGOLIA_ADMIN_API_KEY` GitHub secret
- Add crawler action to workflow

### Migration Sequence

**Recommended order:**

1. Configure Astro site (site URL, CNAME, .nojekyll)
2. Update workflow file
3. Test on feature branch first
4. Verify Paddle integration (depends on Task 2)
5. Deploy to staging/test
6. Full QA
7. Production cutover (Task 15)
8. Add search indexing later (Task 13)

### Critical Files

1. `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/astro.config.mjs` - Add site URL configuration
2. `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/public/CNAME` - Create for custom domain
3. `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/public/.nojekyll` - Create to prevent Jekyll processing
4. `/Users/petyo/w/virtuoso/react-virtuoso/.github/workflows/virtuoso.dev.yml` - Update build and artifact paths
5. `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/package.json` - Verify build script (already correct)

### Performance Considerations

**Astro Advantages:**

- 2-3x faster build times than Docusaurus
- Smaller bundle sizes (partial hydration)
- Better Lighthouse scores
- GitHub Pages CDN handles caching automatically

### Validation Checklist

**Pre-Deployment:**

- [ ] astro.config.mjs has `site` and `base` configured
- [ ] CNAME file created
- [ ] .nojekyll file created
- [ ] Build completes locally
- [ ] Pricing page works with env vars

**Workflow Validation:**

- [ ] YAML syntax valid
- [ ] Pnpm filter targets correct package
- [ ] Artifact path points to dist/
- [ ] Environment variables defined
- [ ] Permissions correct (pages: write, id-token: write)

**Post-Deployment:**

- [ ] Site accessible at virtuoso.dev
- [ ] HTTPS works
- [ ] Pricing page loads
- [ ] Navigation works
- [ ] Search works (Pagefind default)
- [ ] No console errors
- [ ] Assets load correctly
