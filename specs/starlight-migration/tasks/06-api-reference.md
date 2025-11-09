# Improve the API reference content

The API reference is auto-generated from TypeDoc comments in source code. The new-site already has TypeDoc parsing infrastructure implemented. Audit all public APIs to ensure JSDoc comments are complete and helpful. Use TypeDoc's features to inline interfaces and type definitions where appropriate for better docs readability. Add examples in comments where complex APIs benefit from usage demonstrations.

## Tasks

- [ ] Audit react-virtuoso API comments
- [ ] Audit masonry and gurx API comments
- [ ] Audit message-list API comments (just recommendations, source code is not here)
- [ ] Add missing JSDoc with examples
- [ ] Test typedoc output formatting

---

## Enhanced Implementation Plan

### Current State Assessment

**TypeDoc Infrastructure**: ✅ Complete

- Auto-generates API docs from JSDoc comments
- Groups exports by `@group` tags
- Merges individual files into cohesive pages
- Located at: `apps/new-site/src/plugins/astro-typedoc/index.ts`

**Documentation Coverage:**

**react-virtuoso** (303 JSDoc blocks):

- Component interfaces: Well documented with descriptions
- Props: Mostly documented but sparse on examples
- Only 1 `@example` found (heightEstimates prop)
- Methods: Basic descriptions, no usage examples
- Files: `packages/react-virtuoso/src/component-interfaces/Virtuoso.ts` (545 lines)

**masonry** (17 JSDoc blocks):

- Minimal documentation
- Props documented with basic descriptions
- NO `@example` tags found
- Files: `packages/masonry/src/VirtuosoMasonry.tsx`, `packages/masonry/src/interfaces.ts`

**gurx** (65 JSDoc blocks):

- Best documented of the three
- Has 51 `@param/@returns/@example/@remarks` tags
- Hooks have good examples
- Operators documented but could use more examples
- Files: `packages/gurx/src/realm.ts`, `packages/gurx/src/hooks.ts`, `packages/gurx/src/operators.ts`

### Example Template for Props

```typescript
/**
 * Brief description of what this prop does (1-2 sentences).
 *
 * More detailed explanation if needed.
 *
 * @example
 * Basic usage:
 * ```tsx
 * <Virtuoso
 *   data={items}
 *   propName={value}
 *   itemContent={(index, item) => <div>{item.name}</div>}
 * />
 * ```
 *
 * @example
 * Advanced usage:
 * ```tsx
 * <Virtuoso
 *   propName={{
 *     option1: true,
 *     option2: 'value'
 *   }}
 * />
 * ```
 *
 * @remarks
 * Additional notes or warnings.
 *
 * @see {@link RelatedType}
 */
```

### Priority Focus Areas

**react-virtuoso - Props Needing Examples:**

- Complex props: `followOutput`, `scrollSeekConfiguration`, `components`
- Performance props: `overscan`, `increaseViewportBy`, `defaultItemHeight`
- State management: `getState`, `restoreStateFrom`
- Advanced features: `customScrollParent`, `useWindowScroll`

**masonry - Critical Gaps:**

- No examples for any props
- Minimal interface descriptions
- Need usage examples for layout setup
- Column configuration patterns

**gurx - Enhancement Areas:**

- Realm API examples (Cell, Signal, Pipe)
- More operator examples (filter, scan, throttle, debounce)
- Real-world patterns

### Implementation Phases

**Phase 1: TypeDoc Configuration** (Depends on Task 1)
Add TypeDoc entry points for masonry, gurx, message-list in `astro.config.mjs`

**Phase 2: React-Virtuoso Enhancement** (Highest Priority)
Add examples to 15-20 complex props in `component-interfaces/Virtuoso.ts`

**Phase 3: Gurx Enhancement**
Add operator examples in `packages/gurx/src/operators.ts`

**Phase 4: Masonry Enhancement**
Add comprehensive JSDoc with examples to `VirtuosoMasonry.tsx`

### Phase 5: Verification

- Test TypeDoc generation without warnings
- Verify examples render correctly
- Check cross-links between types

### Critical Files

1. `/Users/petyo/w/virtuoso/react-virtuoso/packages/react-virtuoso/src/component-interfaces/Virtuoso.ts` - Primary API, needs ~15-20 examples
2. `/Users/petyo/w/virtuoso/react-virtuoso/packages/react-virtuoso/src/interfaces.ts` - Supporting types
3. `/Users/petyo/w/virtuoso/react-virtuoso/packages/masonry/src/VirtuosoMasonry.tsx` - Needs comprehensive JSDoc
4. `/Users/petyo/w/virtuoso/react-virtuoso/packages/gurx/src/realm.ts` - Add Realm API examples
5. `/Users/petyo/w/virtuoso/react-virtuoso/packages/gurx/src/operators.ts` - Add operator examples
6. `/Users/petyo/w/virtuoso/react-virtuoso/apps/new-site/astro.config.mjs` - Add TypeDoc configurations

### Success Metrics

- At least 30+ `@example` blocks across all packages (currently ~2)
- All major props have inline examples or links to guides
- All exported APIs have descriptions
- TypeDoc generates without warnings
- Cross-package type references work correctly
