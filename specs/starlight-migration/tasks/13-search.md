# Search functionality

The old site uses Algolia DocSearch (appId: `4WOO4PYOJ1`, apiKey: `58ec33a27668285517259ebd5a1d4e77`, indexName: `virtuoso`). Migrate to the new site with custom indexing instead of automatic crawling. Some documentation pages are too large and should be broken into multiple searchable sections for better search precision. Configure custom record extraction to split large pages by headings or logical sections. The re-indexing should be automated in the GitHub workflow deployment process so the search index updates whenever the site deploys.

## Tasks

- [ ] Configure Algolia DocSearch UI with existing credentials
- [ ] Design indexing strategy for breaking large pages into sections
- [ ] Create indexing script with custom record extraction
- [ ] Integrate indexing into GitHub workflow deployment
- [ ] Test search results for precision and coverage
