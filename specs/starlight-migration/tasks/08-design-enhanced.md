# Design work - Enhanced Analysis

## Key Findings from Planning Agent

### Current State

- **New site**: Basic `favicon.svg` with dark mode support
- **Old site**: Outdated assets (social-card.png is 574x410px - undersized)
- **Issue found**: GitHub link points to `https://github.com/withastro/starlight` instead of correct Virtuoso repo
- **Logo**: Custom SVG embedded in SiteTitle.astro (uses `fill="currentColor"` pattern)

### Critical Implementation Details

#### 1. Social Card (Route Middleware Approach)

**Best practice**: Use route middleware in `src/routeData.ts` to add OG/Twitter meta tags dynamically

```typescript
// In /Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/src/routeData.ts
export const onRequest = defineRouteMiddleware((context) => {
  const { sidebar, head } = context.locals.starlightRoute

  // Existing sidebar sorting...

  // Add social card meta tags
  const socialCardUrl = new URL('/social-card.png', context.site).href

  head.push(
    { tag: 'meta', attrs: { property: 'og:image', content: socialCardUrl }},
    { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }},
    { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }},
    { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }},
    { tag: 'meta', attrs: { name: 'twitter:image', content: socialCardUrl }}
  )
})
```

#### 2. Favicon Configuration (Modern 2025 Approach)

**Minimal set** (recommended):

- `favicon.svg` (primary, already exists)
- `favicon.ico` (32x32 with 16x16 layer)
- `apple-touch-icon.png` (180x180)

**Tools**:

- [RealFaviconGenerator.net](https://realfavicongenerator.net/)
- [FaviconGenerator.io](https://favicongenerator.io/)
- [Favicon.io](https://favicon.io/)

**Configuration in astro.config.mjs**:

```javascript
starlight({
  favicon: '/favicon.svg',
  head: [
    { tag: 'link', attrs: { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }},
    { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }},
    { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }},
  ],
})
```

#### 3. GitHub Link Fix (IMMEDIATE)

**File**: `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/astro.config.mjs` (line 96)

```javascript
social: [
  {
    href: 'https://github.com/petyosi/react-virtuoso', // Fix from withastro/starlight
    icon: 'github',
    label: 'GitHub',
  },
],
```

#### 4. Pagination Component Override

**Create**: `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/src/components/Pagination.astro`

**Register in astro.config.mjs**:

```javascript
starlight({
  components: {
    Header: './src/components/Header.astro',
    SiteTitle: './src/components/SiteTitle.astro',
    ThemeSelect: './src/components/ThemeSelect.astro',
    Pagination: './src/components/Pagination.astro', // Add this
  },
})
```

**Reference**: [Starlight Pagination Component](https://github.com/withastro/starlight/blob/main/packages/starlight/components/Pagination.astro)

### Asset Organization

All assets go in `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/public/`:

```text
public/
├── favicon.svg               (enhance existing)
├── favicon.ico               (generate)
├── favicon-32x32.png         (generate)
├── apple-touch-icon.png      (generate: 180x180)
└── social-card.png           (design: 1200x630)
```

### Testing & Validation

**Social Card Testing**:

- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [OpenGraph.xyz](https://www.opengraph.xyz/)

**Favicon Testing**:

- Browser tabs (Chrome, Firefox, Safari, Edge)
- iOS home screen
- Android home screen

### Critical Files

1. **`/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/astro.config.mjs`** - Fix GitHub link (line 96), configure favicon, register Pagination override
2. **`/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/src/routeData.ts`** - Add social card meta tags
3. **`/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/src/components/Pagination.astro`** - Create custom pagination component (new file)
4. **`/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/public/`** - Place all assets

### Human Design Work Required

1. **Social card design** (1200x630px) - showcasing Virtuoso brand with logo, tagline, key visuals
2. **Favicon set generation** - use automated tools from existing SVG
3. **Pagination button visual specs** - ensure consistency with design system

### References

- [Overriding Components | Starlight](https://starlight.astro.build/guides/overriding-components/)
- [Configuration Reference | Starlight](https://starlight.astro.build/reference/configuration/)
- [Add Open Graph images to Starlight | HiDeoo](https://hideoo.dev/notes/starlight-og-images/)
- [How to Favicon in 2025](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs)
- [Complete Favicon Size and Format Guide 2025](https://favicon.im/blog/complete-favicon-size-format-guide-2025)
