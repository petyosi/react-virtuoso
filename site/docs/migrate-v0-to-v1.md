---
id: migrate-v0-to-v1
title: Migrate from v0 to v1
sidebar_label: Migrate from v0 to v1
slug: /migrate-v0-to-v1/
---

Version `1.*` of Virtuoso is a complete rewrite from `v0.*`, addressing the architectural limitations of the first version and enabling a smooth path to introduce new features. 

## v1 Primary Benefits

The biggest unresolved challenge in v0 was the so-called *reverse* (bottom to top) scrolling mode, which is typical for **chat** and **feed** interfaces. 
Prepending items with unknown height to the top of the list was not part of the original design and was not handled well, causing visual glitches and "jumps". This should work fine in v1.

## What's New in V1

- `scrollToIndex` method now works supports `"smooth"` behavior. Previously, this was undocumented and "use at your own risk". Check the [source code in the example](./scroll-to-index)
- `followOutput` now accepts `"smooth"`, which means that new items will gradually push the existing content upwards. 
- As an alternative to `totalCount`, the component now accepts `data: any[]`, which is then used to infer the total count of the items. Each item is passed as a second argument in the `itemContent` callback.
- Prepending items is now much easier, using `firstItemIndex` rather than the `adjustForPrependedItems` method. Check the [prepend items example](./prepend-items.md)
- Starting the list from the bottom and scrolling up with unknown item sizes should no longer cause glitches and jumps.
- A `Header` component is introduced, works in both grouped and flat mode.
- All unknown properties are now directly passed as attributes to the scroller DOM element - including event handlers like `onScroll`. This should eliminate the need to use `ScrollContainer`.

## Breaking changes

V1 comes with some property renames, new properties, changed DOM structure, and some behavior tweaks. 
Most of the old properties have been kept for making the migration easier, with warnings in the console pointing to the new names. 
The new DOM structure (and the way to customize it) are documented in the [Customize Structure](./customize-structure.md)

### `item` is now `itemContent`

This is probably the first change you will encounter. Just rename the property and you should be fine.

### `group` is now `groupContent`

Same as `item`, this is a rename without a change in the behavior.

### `topItems` is now `topItemCount`

Rename, no change in behavior.

### `itemHeight` is now `fixedItemHeight`

Rename, no change in behavior.

### `scrollingStateChange` is now `isScrolling`

Rename, no change in behavior.

### `maxHeightCacheSize` is gone

An optimization in the internal data structure made this property unnecessary.

### `adjustForPrependedItems` is gone

Use `firstItemIndex: number` instead. Check the [prepend items example](./prepend-items.md)

### `HeaderContainer` and `FooterContainer` are gone

The element type of the wrapper elements can be changed through the `headerFooterTag`.

### All `*Container` Props are Migrated to the `components` Dictionary Property

See how it works in the [Customize Structure](./customize-structure.md). 
**Note:** the `components.List` (previously `ListContainer`) now needs a `React.forwardRef` wrapped component, rather than passing a `listRef` property.

### `emptyComponent` is now `components.EmptyPlaceholder`

A rename. No change in the behavior.

### `footer` is now `components.Footer`

A rename. No change in the behavior.

### `scrollSeek` is now `scrollSeekConfiguration`

The `scrollSeek.placeholder` is moved to `components.ScrollSeekPlaceholder`
