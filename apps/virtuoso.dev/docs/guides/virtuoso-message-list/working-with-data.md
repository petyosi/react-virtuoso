---
id: virtuoso-message-list-working-with-data
title: Virtuoso Message - Working with Data
sidebar_label: Imperative Data API
sidebar_position: 10
slug: /virtuoso-message-list/working-with-data
---

# Imperative Data API

In addition to the `data` prop, the message list component exposes an imperative API to interact with the list data. This API is available through the `useVirtuosoMethods` hook from components nested inside and through the `ref` object you can pass into the component.

:::info

#### What is an imperative API and why does the message list uses it?

There are two ways to work with React components - the imperative way and the declarative way. In the declarative way, you describe the UI based on the current state, and React takes care of updating the UI when the state changes.

The imperative API method works by creating a ref object with `useRef` and then passing it to the component. Afterwards, the `ref.current` object exposes the methods to interact with the component. This approach is necessary for the message list component because it needs to handle the scroll position in a specific way when new messages arrive, or when the user submits a message.

#### Should I keep the data in my component state?

Yes, you should do that if your use case includes mounting/unmounting the component. You can pass the data state to the `initialData` prop, it will be picked up in the initial render.
:::

## Prepending Data

Use this method when you need to add additional messages before the current ones, for example when loading older messages. The component will automatically adjust the scroll position to keep the previous messages in view.

```tsx live
import { VirtuosoMessageList, VirtuosoMessageListLicense, VirtuosoMessageListMethods } from '@virtuoso.dev/message-list'
import { useRef } from 'react'

export default function App() {
  const ref = useRef<VirtuosoMessageListMethods>(null)
  const offset = useRef(0)

  return (
    <>
      <button
        onClick={() => {
          offset.current = offset.current - 10
          ref.current.data.prepend(Array.from({ length: 10 }, (_, index) => index + offset.current))
        }}
      >
        Prepend 10 items
      </button>

      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList
          ItemContent={({ data }) => <div>{data}</div>}
          ref={ref}
          style={{ height: 500 }}
          initialData={Array.from({ length: 100 }, (_, index) => index)}
        />
      </VirtuosoMessageListLicense>
    </>
  )
}
```

## Appending data

Appending data to the message list usually requires an adjustment to the scroll position to keep the new messages in view. However, this is not always the case - for example, if the user is scrolling up to read older messages. Also, depending on various factors the adjustment may happen instantly or with a smooth scroll animation.

To support those scenarios, the `data.append` method accepts `data` and, an optional, `scrollToBottom` argument that can be a string - `"smooth"`, `"auto"` or `"instant"` (passed directly to the underlying `scrollTo` DOM call), or a function that receives the following arguments as an object:

- `scrollLocation: ListScrollLocation` - the current scroll location (same object as the one passed to the `onScroll` callback and the one available from `useScrollLocation` hook)
- `scrollInProgress: boolean` - whether or not the list is currently scrolling
- `atBottom: boolean` - whether the list is scrolled to the bottom _before_ the new items are appended
- `data: Data[]` - the data that was appended
- `context: Context` - the context object passed to the list

The function should return:

- a boolean value, `false` meaning that no scroll should happen, `true` meaning that the list should scroll to the bottom instantly
- a string value, one of `"smooth"`, `"auto"` or `"instant"` to control the scroll behavior - the list will scroll to the bottom with the specified behavior
- a location object, `{ index: number | 'LAST', align: 'start' | 'center' | 'end', behavior: 'smooth' | 'auto' }` to control the scroll behavior and the alignment of the new items. You can use this to scroll to the bottom, or to scroll the first new message to the top of the list.

Experiment with the live example below to see how the scroll behavior changes when appending new items.

```tsx live
import { VirtuosoMessageList, VirtuosoMessageListLicense, VirtuosoMessageListMethods } from '@virtuoso.dev/message-list'
import { useRef } from 'react'

export default function App() {
  const ref = useRef<VirtuosoMessageListMethods>(null)
  const offset = useRef(100)

  return (
    <>
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList
          ItemContent={({ data }) => <div>{data}</div>}
          ref={ref}
          style={{ height: 500 }}
          initialData={Array.from({ length: 100 }, (_, index) => index)}
        />
      </VirtuosoMessageListLicense>
      <button
        onClick={() => {
          ref.current.data.append(
            Array.from({ length: 10 }, (_, index) => index + offset.current),
            (params) => true
          )
          offset.current = offset.current + 10
        }}
      >
        Append 10 items
      </button>
    </>
  )
}
```

## Updating Data

It is highly recommended that, in addition to the message content itself, you also keep any necessary state in the objects present in data. This includes things like message reactions, read status, but also ephemeral state like whether the message has been expanded to display additional details, for example. Keeping this information there makes it easy to restore the message look when it has been scrolled out of the viewport and then back in. Also, using the `data.map` function lets the list readjust its scroll to bottom location if the updates increase the size of the message element. A common use case for this is [displaying reactions to messages](/virtuoso-message-list/examples/reactions).

The `data.map` method accepts the following arguments:

- `callbackfn: (item: Data) => Data` - a function that takes the current data item and returns the updated data item. The function should return the same object if no changes are needed.
- `autoscrollToBottomBehavior?: 'smooth' | 'auto'` - an optional field that lets you specify the necessary behavior if the data mapping causes the list to be no longer at the bottom.

To see a `data.map` example usage, visit the [Reactions example](/virtuoso-message-list/examples/reactions). The tutorial also uses `data.map` for [the optimistic rendering of sent messages](/virtuoso-message-list/tutorial/send-messages).

## Removing Data

The `data.findAndDelete(predicate: (item: Data) => boolean)` method lets you remove a message from the list. The predicate function receives the data item and should return a boolean value indicating whether the item should be removed. The example below adds a button next to each item that removes it.

```tsx live
import { VirtuosoMessageList, useVirtuosoMethods, VirtuosoMessageListLicense, VirtuosoMessageListMethods } from '@virtuoso.dev/message-list'

function ItemContent({ data }) {
  const virtuosoMethods = useVirtuosoMethods()
  return (
    <div>
      Item {data}
      <button onClick={() => virtuosoMethods.data.findAndDelete((item) => item === data)}>Remove</button>
    </div>
  )
}

export default function App() {
  return (
    <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList
        ItemContent={ItemContent}
        style={{ height: 500 }}
        initialData={Array.from({ length: 100 }, (_, index) => index)}
      />
    </VirtuosoMessageListLicense>
  )
}
```

You can remove multiple items at once with the `data.deleteRange` method.

```tsx live
import { VirtuosoMessageList, useVirtuosoMethods, VirtuosoMessageListLicense, VirtuosoMessageListMethods } from '@virtuoso.dev/message-list'
import { useRef } from 'react'

function ItemContent({ data }) {
  return <div>Item {data}</div>
}

export default function App() {
  const ref = useRef<VirtuosoMessageListMethods>(null)
  return (
    <>
      <button onClick={() => ref.current.data.deleteRange(5, 10)}>Remove 10 items starting from 5</button>
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList
          ref={ref}
          ItemContent={ItemContent}
          style={{ height: 500 }}
          initialData={Array.from({ length: 100 }, (_, index) => index)}
        />
      </VirtuosoMessageListLicense>
    </>
  )
}
```

## Replacing Data

In case you're building a chat application with multiple channels, you might want to switch the message list to a different channel. The `data.replace` method lets you replace the current list of messages with a new one.
The method accepts `data` and, optionally, an `options: { initalLocation: ItemLocation, purgeItemSizes?: boolean }` to specify the initial scroll position and weather to clear the cached item sizes. Purging the item sizes is useful when the new data has different item sizes than the previous data.

```tsx live
import { VirtuosoMessageList, VirtuosoMessageListLicense, VirtuosoMessageListMethods } from '@virtuoso.dev/message-list'
import { useRef } from 'react'

export default function App() {
  const ref = useRef<VirtuosoMessageListMethods>(null)

  return (
    <>
      <button
        onClick={() => {
          const newData = Array.from({ length: 100 }, (_, index) => index + 100)
          ref.current.data.replace(newData, {
            initialLocation: { index: 'LAST', align: 'end' },
            purgeItemSizes: true,
          })
        }}
      >
        Replace with 100 items (100-200)
      </button>

      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList
          ItemContent={({ data }) => <div>{data}</div>}
          ref={ref}
          initialLocation={{ index: 'LAST', align: 'end' }}
          style={{ height: 500 }}
          initialData={Array.from({ length: 100 }, (_, index) => index)}
        />
      </VirtuosoMessageListLicense>
    </>
  )
}
```

## Querying Data

To retrieve records from the current data set, you can use `find` and `findIndex` methods, which work like their array counterparts.
You can also access the entire data set through the `get` method, which returns a shallow copy of the data.
The subset of data that is currently rendered can be accessed through the `getCurrentlyRendered` method.
