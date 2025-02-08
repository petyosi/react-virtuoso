---
id: virtuoso-message-list-tutorial-loading-older-messages
title: Virtuoso Message List Tutorial - Loading Older Messages
sidebar_label: Loading Older Messages
sidebar_position: 3
slug: /virtuoso-message-list/tutorial/loading-older-messages
---

# Part 3 - Loading Older Messages

In this part, we will automatically load older messages when the user scrolls near the top of the list. We will do that by adding an event handler to the `onScroll` component property. 

## Cursor Pagination

Our `ChatChannel` class uses the so called cursor-based pagination, which is suitable for live data. Rather than using offsets, cursor-based pagination uses a pointer to a specific item in a list of results. This pointer is called a cursor. In our case, we're going to use the first loaded message as a cursor to load older messages. Add the following ref to the `Home` component:

```tsx
  const firstMessageId = React.useRef<number | null>(null)
```

Then, we will track the first message id in the initial data load. Add the following code to the `useEffect` hook:

```tsx 
  if (!channel.loaded) {
    channel
      .getMessages({ limit: 20 })
      .then((messages) => {
        if (messages !== null) {
// highlight-next-line
          firstMessageId.current = messages[0].id
          messageListRef.current?.data.append(messages)
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }
```

## `onScroll` Event Handler

The `onScroll` event handler receives a `ListScrollLoaction` object as a parameter. The object contains several fields that denote the current state of the list. In this case, we are going to look at the `listOffset` - the distance from the top of the list to the top of the viewport. The value is `0` when the list is scrolled all the way to the top, and `-N` when the list is scrolled `N` pixels down. We will start loading the newer messages when the scroll position is near the top (`> -100`). Our handler should look like this:

```tsx
  const [loadingNewer, setLoadingNewer] = React.useState(false)
// ...
  const onScroll = React.useCallback(
    (location: ListScrollLocation) => {
      // offset is 0 at the top, -totalScrollSize + viewportHeight at the bottom
      if (location.listOffset > -100 && !loadingNewer && firstMessageId.current) {
        setLoadingNewer(true)
        channel
          .getMessages({ limit: 20, before: firstMessageId.current })
          .then((messages) => {
            if (messages !== null) {
              firstMessageId.current = messages[0].id
              messageListRef.current?.data.prepend(messages)
              setLoadingNewer(false)
            }
          })
          .catch((error) => {
            console.error(error)
          })
      }
    },
    [channel, loadingNewer]
  )
```

The implementation above uses the imperative `data` API of the component to prepend a set of messages at the top of the list. Calling the `prepend` method automatically adjusts the scroll position to keep the list in the same visible position. 

Let's add the event handler to the `VirtuosoMessageList` component:

```tsx
  <VirtuosoMessageList<ChatMessage, MessageListContext>
    // highlight-start
    onScroll={onScroll}
    context={{ loadingNewer, channel }}
    // highlight-end
```

Notice that we're also going to add the `loadingNewer` flag into the context prop, so we need to update our interface as well:

```tsx
interface MessageListContext {
  loadingNewer: boolean
  channel: ChatChannel
}
```

### Loading Indicator

The code above introduced an additional state flag - `loadingNewer`. This flag prevents the component from loading messages when the previous request is still in progress. We're going to make an additional use of this flag by displaying a loading indicator at the top of the list when the component is loading older messages. We are going to make a custom Header component for that purpose. Declare the Header component next to your `EmptyPlaceholder`: 

```tsx
const Header: VirtuosoProps['Header'] = ({ context }) => {
  return <div style={{ height: 30 }}>{context.loadingNewer ? 'Loading...' : ''}</div>
}
```

Then, add the component to the `VirtuosoMessageList` props:

```tsx
  <VirtuosoMessageList<ChatMessage, MessageListContext>
    // highlight-start
    Header={Header}
```

If everything works as expected, you should see 'Loading...' when you scroll near the top of the list, and older messages should be loaded. 
