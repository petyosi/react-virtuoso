# Search Functionality - Enhanced Analysis

## Key Recommendation: Start with Pagefind, Keep Algolia as Backup

### Current State

- **Algolia credentials**: appId: `4WOO4PYOJ1`, apiKey: `58ec33a27668285517259ebd5a1d4e77`, indexName: `virtuoso`
- **Site size**: 182 files (~1.3MB) with large API pages (4,500+ lines)
- **Starlight default**: Pagefind included out-of-the-box

### Search Solution Comparison

| Criterion | Pagefind | Algolia DocSearch |
|-----------|----------|-------------------|
| Cost | $0 | $0 (DocSearch program) |
| Setup Time | 0 (default) | 4-8 hours |
| Maintenance | Minimal | Low |
| Search Quality | Good | Excellent |
| Analytics | No | Yes |
| Customization | Limited | Extensive |
| Infrastructure | None | External |
| **Recommendation** | **Start here** | Upgrade if needed |

### Why Pagefind First?

1. **Zero configuration** - Already works with Starlight
2. **Perfect site size** - 182 files well within Pagefind's sweet spot
3. **Automatic section splitting** - Handles large pages via heading IDs
4. **No external dependency** - No cost, no infrastructure
5. **Can migrate later** - Keep Algolia credentials for future upgrade

### Implementation Option 1: Pagefind (Recommended)

#### Step 1: Verify It Works (30 minutes)

```bash
cd apps/new-site
pnpm build
# Check for _pagefind directory in dist/
pnpm preview
# Test search functionality
```

#### Step 2: Optimize for Large API Pages (1-2 hours)

Pagefind automatically splits on headings with `id` attributes:

- Verify TypeDoc-generated headings have proper IDs
- Test search on API pages for section results
- Add `data-pagefind-weight` to important sections if needed

**Files to check:**

- `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/src/content/docs/react-virtuoso/99.api-reference/**/*.md`

#### Step 3: Custom Configuration (If Needed)

In `astro.config.mjs`:

```javascript
starlight({
  pagefind: {
    forceLanguage: 'en',
  },
})
```

**Possible customizations:**

- Exclude pages: `data-pagefind-ignore` attribute
- Boost content: `data-pagefind-weight` attribute
- Custom filters: `data-pagefind-filter` attributes

### Implementation Option 2: Algolia DocSearch (If Pagefind Insufficient)

#### Step 1: Install Plugin (1 hour)

```bash
cd apps/new-site
pnpm add @astrojs/starlight-docsearch
```

**File**: `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/astro.config.mjs`

```javascript
import starlightDocSearch from '@astrojs/starlight-docsearch'

export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightDocSearch({
          appId: '4WOO4PYOJ1',
          apiKey: '58ec33a27668285517259ebd5a1d4e77',
          indexName: 'virtuoso',
        }),
      ],
    }),
  ],
})
```

#### Step 2: Configure Crawler (2-3 hours)

**Algolia Crawler Dashboard** - Create custom `recordExtractor`:

```javascript
{
  startUrls: ['https://virtuoso.dev/'],
  recordExtractor: ({ url, $, helpers }) => {
    return helpers.docsearch({
      recordProps: {
        lvl0: { selectors: 'h1', defaultValue: 'Documentation' },
        lvl1: 'article h2',
        lvl2: 'article h3',
        lvl3: 'article h4',
        lvl4: 'article h5',
        lvl5: 'article h6',
        content: 'article p, article li'
      },
      aggregateContent: true,
      recordVersion: 'v3'
    })
  }
}
```

#### Step 3: GitHub Actions Integration (1-2 hours)

**File**: `/Users/petyo/w/virtuoso/react-virtuoso/.github/workflows/virtuoso.dev.yml`

Add after deployment:

```yaml
- name: Run Algolia Crawler
  uses: algolia/algoliasearch-crawler-github-actions@v1
  with:
    crawler-user-id: ${{ secrets.ALGOLIA_CRAWLER_USER_ID }}
    crawler-api-key: ${{ secrets.ALGOLIA_CRAWLER_API_KEY }}
    algolia-app-id: ${{ secrets.ALGOLIA_APP_ID }}
    algolia-api-key: ${{ secrets.ALGOLIA_API_KEY }}
    site-url: 'https://virtuoso.dev'
```

**Required GitHub Secrets:**

- `ALGOLIA_CRAWLER_USER_ID`
- `ALGOLIA_CRAWLER_API_KEY`
- `ALGOLIA_APP_ID`
- `ALGOLIA_API_KEY` (admin key)

### Testing Strategy

**Test Query List:**

- Component names: "Virtuoso", "TableVirtuoso", "VirtuosoGrid"
- Props/API terms: "followOutput", "initialTopMostItemIndex", "scrollSeekConfiguration"
- Use case keywords: "infinite scroll", "chat messages", "sticky headers"
- Long-tail queries: "how to scroll to bottom", "group items"

**Test Pages:**

- VirtuosoProps.md (4,567 lines)
- TableVirtuosoProps.md (4,709 lines)
- GroupedVirtuosoProps.md (4,727 lines)

**Validation:**

- Search results return relevant sections
- Section links navigate to correct anchors
- Multiple results per page when appropriate
- Mobile search works smoothly

### Critical Files

**For Pagefind:**

1. `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/astro.config.mjs` - Verify no search overrides
2. `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/src/content/docs/react-virtuoso/99.api-reference/` - Large pages needing validation

**For Algolia:**

1. `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/astro.config.mjs` - Add DocSearch plugin
2. `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/package.json` - Add dependency
3. `/Users/petyo/w/virtuoso/react-virtuoso/.github/workflows/virtuoso.dev.yml` - Add crawler action
4. **Algolia Crawler Dashboard** (external) - Configure record extraction

### Decision Point

After implementing Pagefind:

1. Test search quality with representative queries
2. Evaluate if results are acceptable
3. **If sufficient**: Stop here, no Algolia needed
4. **If insufficient**: Proceed with Algolia setup

### References

- [Site Search - Astro Starlight](https://starlight.astro.build/guides/site-search/)
- [Pagefind Documentation](https://pagefind.app/)
- [Showing multiple results per page | Pagefind](https://pagefind.app/docs/sub-results/)
- [@astrojs/starlight-docsearch - npm](https://www.npmjs.com/package/@astrojs/starlight-docsearch)
- [DocSearch x Algolia Crawler](https://docsearch.algolia.com/docs/crawler/)
- [Record Extractor | DocSearch](https://docsearch.algolia.com/docs/record-extractor/)
