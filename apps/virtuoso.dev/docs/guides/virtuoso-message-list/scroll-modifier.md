---
id: virtuoso-message-list-scroll-modifier
title: Controlling Scroll Position
sidebar_label: Scroll Modifier
sidebar_position: 7
slug: /virtuoso-message-list/scroll-modifier
---

# Scroll Modifier

The scroll modifier type is the second, optional field of the message list `data` prop. It specifies any eventual scroll position changes that need to be performed when the data changes. For maximum clarity of your code flow, you should keep the actual data and the scroll modifier associated with it in the same state variable.

## Types of Scroll Modifiers

The scroll modifier property accepts several string values, some complex objects, as well as `null | undefined`, which will, in most cases, preserve the current scroll position.

### `{ type: 'item-location' }`

The item location modifier is best used for the initial data display, when you want to have the view start from a specific item in the list. The `location` property specifies the index of the item to scroll to and the alignment of the item in the viewport. This scroll modifier accepts an optional `purgeItemSizes: true` field, which will reset the cached item sizes and eventually recalculate them based on the new data. You should be setting this flag if you're re-using the same component for multiple conversations and you're switching between them.

```tsx
setData((current) => ({
  data: Array.from({ length: 100 }, (_, index) => ({ id: index, content: `Message ${index}` })),
  scrollModifier: {
    type: 'item-location',
    location: {
      index: 'LAST',
      align: 'end', // start with the message at the bottom of the viewport
    },
  },
}))
```

### `{ type: 'auto-scroll-to-bottom' }`

This modifier should be used when new messages are added to the end of the list, and you want to scroll to the bottom of the list automatically (or conditionally, depending on the current position). An extensive example that uses this type can be found in the
["receiving messages" chapter of the tutorial](/virtuoso-message-list/tutorial/receive-messages/) - the behavior can be a callback function that receives the current state of the list and calculates the necessary location and scroll behavior.

### `prepend`

The `"prepend"` scroll modifier value signals that the data change will add messages to the top of the list. The scroll position will be adjusted to keep the current scroll position relative to the new data.

```tsx
// ....
setData((current) => ({
  ...current,
  data: [...newMessages, ...current.data],
  scrollModifier: 'prepend',
}))
```

:::note
For the prepend modifier to work correctly, the **new data should extend the current data set** - the first item from the old dataset should be preserved in the new dataset. If the new data is not an extension of the old data, the scroll position will be reset to the top of the list.
:::

### `{ type: 'items-change' }`

This scroll modifier is useful when the data update keeps the same items but modifies their content/props - such an example would be a streaming bot response, or adding/removing reactions to certain messages. In this case, the scroll modifier lets you keep the message list scrolled to the bottom in case it is there. See the [reactions example](/virtuoso-message-list/examples/reactions/) for a live example.

### `remove-from-start`

The `"remove-from-start"` scroll modifier value signals that the data change will remove messages from the top of the list. The scroll position will be adjusted to keep the current scroll position relative to the new data. This is useful if you want to trim a data set that has grown too large, but you want to keep the current scroll position.

```tsx
// ....
setData((current) => ({
  ...current,
  data: current.data.slice(10),
  scrollModifier: 'remove-from-start',
}))
```

### `remove-from-end`

Similar to the `remove-from-start`, the `"remove-from-end"` scroll modifier value signals that the data change will remove messages from the bottom of the list. The scroll position will be adjusted to keep the current scroll position relative to the new data.

```tsx
// ....
setData((current) => ({
  ...current,
  data: current.data.slice(0, -10),
  scrollModifier: 'remove-from-end',
}))
```
