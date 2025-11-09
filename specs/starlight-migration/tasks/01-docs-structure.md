# Re-organize the way the docs are structured

Make top-level navigation per package, each section has its own sidebar - one that includes guides and API reference. It uses READMEs for the package landing page, and reads the docs from the package's docs folder. This task does not aim to produce new content - just reorganize the existing content. The docsSync integration already handles copying READMEs and docs folders from each package.

Message List is a private package (no source code in repo), but will have a documentation stub at packages/message-list following the same structure (README.md and docs/ folder). For its API reference, configure TypeDoc to read from the installed package at `node_modules/@virtuoso.dev/message-list/dist/index.d.ts` (similar to the old Docusaurus setup).

## Tasks

- [x] Virtuoso - API Reference and Guides
- [x] Masonry - Guides and API Reference (typedoc setup needed)
- [x] Gurx - Guides and API Reference (typedoc setup needed)
- [x] Message List - Guides and API Reference (typedoc from installed package)

---

## Enhanced Implementation Plan

### Current State Analysis

**What's Already Done:**

1. **Virtuoso (react-virtuoso)**: ✅ Fully configured
   - API Reference: TypeDoc integration working (`apps/new-site/src/plugins/astro-typedoc/index.ts`)
   - Guides: Synced from `packages/react-virtuoso/docs/` via `docsSync` integration
   - README: Synced as `index.mdx`
   - Structure: `/react-virtuoso/` with numbered subdirectories (1.virtuoso, 2.grouped-virtuoso, etc.)

2. **Masonry**: ⚠️ Partially configured
   - README synced as landing page
   - Has one example doc (`1.example.md`)
   - **Missing**: TypeDoc API reference setup
   - Package exports from: `packages/masonry/src/index.ts`

**What Needs to Be Done:**

1. **Gurx**: ❌ Not configured at all
   - No docsSync configuration in `astro.config.mjs`
   - No TypeDoc setup
   - Has extensive README (8.8k) but no docs folder
   - Package exports from: `packages/gurx/src/index.ts`

2. **Message List**: ❌ Not configured at all
   - Private package (no source in repo)
   - Needs documentation stub at `packages/message-list/`
   - TypeDoc must read from installed package at `node_modules/@virtuoso.dev/message-list/dist/index.d.ts`
   - Pattern exists from old Docusaurus config

### Architecture Understanding

**docsSync Integration** (`apps/new-site/src/integrations/docs-sync.ts`):

- Syncs README.md and docs/ folders from packages to `src/content/docs/`
- Converts .md to .mdx automatically
- Handles numeric prefix ordering (e.g., `6.troubleshooting.md` → sidebar order 6)
- Watches for changes in dev mode
- README.md becomes `index.mdx` in destination

**TypeDoc Integration** (`apps/new-site/src/plugins/astro-typedoc/index.ts`):

- Generates API reference from TypeScript source
- Groups items by `@group` JSDoc tag
- Merges individual files into group-based pages (e.g., `1.virtuoso.mdx`, `2.grouped-virtuoso.mdx`)
- Output goes to `src/content/docs/{package}/99.api-reference/`
- Predefined group order: Virtuoso, GroupedVirtuoso, VirtuosoGrid, TableVirtuoso, GroupedTableVirtuoso, Common, Misc

**Sidebar Structure** (Starlight with multiSidebar plugin):

- Uses `@lorenzo_lewis/starlight-utils` for multiple sidebars
- Switcher style: 'hidden' (no visible switcher UI)
- Auto-generates sidebar from directory structure
- Each package gets its own top-level sidebar entry

### Implementation Steps

#### Step 1: Masonry - TypeDoc Setup

**Files to Modify:**

- `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/astro.config.mjs`

**Changes Required:**
Add TypeDoc configuration for masonry package:

```javascript
await initAstroTypedoc({
  baseUrl: "/masonry/api-reference/",
  entryPoints: [
    {
      path: resolve(__dirname, "../../packages/masonry/src/index.ts"),
    },
  ],
  outputFolder: "src/content/docs/masonry/99.api-reference",
  tsconfig: resolve(__dirname, "../../packages/masonry/tsconfig.json"),
});
```

#### Step 2: Gurx - Full Setup

**Files to Create:**

- `/Users/petyo/w/virtuoso/react-virtuoso/packages/gurx/docs/` directory (if doesn't exist)
- Initial documentation files in `gurx/docs/`

**Files to Modify:**

- `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/astro.config.mjs`

**Changes Required:**

1. Add docsSync configuration:

```javascript
{
  dest: 'gurx',
  file: '../../packages/gurx/README.md',
},
{
  dest: 'gurx',
  path: '../../packages/gurx/docs',
}
```

1. Add TypeDoc configuration:

```javascript
await initAstroTypedoc({
  baseUrl: "/gurx/api-reference/",
  entryPoints: [
    {
      path: resolve(__dirname, "../../packages/gurx/src/index.ts"),
    },
  ],
  outputFolder: "src/content/docs/gurx/99.api-reference",
  tsconfig: resolve(__dirname, "../../packages/gurx/tsconfig.json"),
});
```

1. Add sidebar entry:

```javascript
{
  autogenerate: { directory: 'gurx' },
  collapsed: true,
  label: 'gurx',
}
```

**Content Strategy:**

- Gurx README is comprehensive (8.8k) - good foundation for landing page
- Should create minimal docs/ folder with example-focused guides
- Potential guide topics:
  - `1.concepts.md` - Cells, Signals, Actions, Realm
  - `2.basic-usage.md` - Publishing, subscribing, getting values
  - `3.operators.md` - Linking, combining, transforming nodes
  - `4.react-integration.md` - RealmProvider, hooks

#### Step 3: Message List - Special Configuration

**Files to Create:**

- `/Users/petyo/w/virtuoso/react-virtuoso/packages/message-list/` directory
- `/Users/petyo/w/virtuoso/react-virtuoso/packages/message-list/README.md`
- `/Users/petyo/w/virtuoso/react-virtuoso/packages/message-list/docs/` directory

**Files to Modify:**

- `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/astro.config.mjs`

**Changes Required:**

1. Add docsSync configuration:

```javascript
{
  dest: 'message-list',
  file: '../../packages/message-list/README.md',
},
{
  dest: 'message-list',
  path: '../../packages/message-list/docs',
}
```

1. Add TypeDoc configuration (reading from installed package):

```javascript
await initAstroTypedoc({
  baseUrl: "/message-list/api-reference/",
  entryPoints: [
    {
      path: resolve(
        __dirname,
        "./node_modules/@virtuoso.dev/message-list/dist/index.d.ts",
      ),
    },
  ],
  outputFolder: "src/content/docs/message-list/99.api-reference",
  tsconfig: resolve(__dirname, "./tsconfig.message-list.json"),
});
```

1. Create minimal tsconfig for message-list:
   - Reference: `apps/virtuoso.dev/tsconfig.message-list.json` from old site
   - Purpose: Configure TypeScript to read .d.ts files from node_modules

2. Add sidebar entry:

```javascript
{
  autogenerate: { directory: 'message-list' },
  collapsed: true,
  label: 'message-list',
}
```

**Content Strategy for Stub:**

- README should cover:
  - Brief overview (chatbot/conversation UI)
  - Installation instructions
  - License notice and pricing link
  - Link to getting started guide
- Guide topics (from old site as reference):
  - Getting started / Hello World
  - Message structure and data flow
  - Scrolling behavior
  - Customization
  - Advanced features

#### Step 4: Sidebar Order

**Proposed Order** (by popularity/importance):

1. react-virtuoso (main package)
2. message-list (featured commercial offering)
3. masonry (specialized layout)
4. gurx (lower-level utility)

### Critical Files

1. `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/astro.config.mjs` - Primary configuration file
2. `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/src/plugins/astro-typedoc/index.ts` - TypeDoc integration reference
3. `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/src/integrations/docs-sync.ts` - docsSync reference
4. `/Users/petyo/w/virtuoso/react-virtuoso/packages/masonry/src/index.ts` - Masonry entry point
5. `/Users/petyo/w/virtuoso/react-virtuoso/packages/gurx/src/index.ts` - Gurx entry point

### Testing Strategy

**For Each Package Configuration:**

1. Build test: Run `pnpm build` and verify no errors
2. Dev mode test: Run `pnpm dev` and navigate to package pages
3. Hot reload test: Edit package README or doc file, verify auto-sync
4. API reference test: Verify TypeDoc generation runs without errors
5. Sidebar test: Verify package appears in sidebar with correct structure

### Success Criteria

1. ✅ All four packages (react-virtuoso, masonry, gurx, message-list) have:
   - Landing page (from README)
   - Guides section (from docs/ folder)
   - API Reference section (from TypeDoc)
2. ✅ Sidebar navigation shows all packages
3. ✅ Build completes without errors
4. ✅ Dev mode hot-reload works for all packages
5. ✅ No new content created (task is reorganization only)
