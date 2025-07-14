---
id: virtuoso-message-list-tutorial-receive-messages
title: Virtuoso Message List Tutorial - Receive Messages
sidebar_label: Receive Messages
sidebar_position: 4
slug: /virtuoso-message-list/tutorial/receive-messages
---

# Part 5 - Receive Messages

In this part, we're going to implement a simulation of receiving messages from the server. Since we have no actual backend, we're going to use a button for that. Receiving messages has a specific scroll behavior; if the list is at the bottom, it should automatically scroll to the bottom. If the user has scrolled up to read previous messages, the list should remain at the same scroll position and display a notification that new messages are available. Let's add a counter for the unread messages first:

```ts
const [unseenMessages, setUnseenMessages] = useState(0)
```

Then, add the following button somewhere below the message list:

```tsx
//...
<div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
  <button
    onClick={() => {
      const otherMessages = [createMessage(otherUser), createMessage(otherUser)]
      setMessageListData((current) => {
        return {
          data: [...(current?.data ?? []), ...otherMessages],
          scrollModifier: {
            type: 'auto-scroll-to-bottom',
            autoScroll: ({ atBottom, scrollInProgress }) => {
              if (atBottom || scrollInProgress) {
                return 'smooth'
              }
              setUnseenMessages((prev) => prev + otherMessages.length)
              return false
            },
          },
        }
      })
    }}
  >
    Receive 2 messages
  </button>
</div>
```

:::note
Since we're using a smooth scroll, there's a slight chance of a new message coming in _while_ the list is scrolling to the bottom. In that case, the list will scroll to the bottom again, and the user will see the new message. That's the reason for the `scrollInProgress` check.
:::

:::note
The `auto-scroll-to-bottom` modifier is used for adding new messages to the end of the list. Through the `autoScroll` callback, you can conditionally determine if the list should catch up with the new messages or not.
:::

If everything works as expected, pressing the button will display a new message from another user with a smooth scroll animation.

## Display the New Message Counter

We will use the add the new message counter next to the scroll to bottom button, by passing the `unseenMessages` counter through the `context` prop. Let's extend our context and pass the additional flag:

```tsx
interface MessageListContext {
  loadingNewer: boolean
  channel: ChatChannel
  // highlight-next-line
  unseenMessages: number
}
// ...

<VirtuosoMessageList<ChatMessage, MessageListContext>
  key={channel.name}
// highlight-next-line
  context={{ loadingNewer, channel, unseenMessages }}
```

Now, change the `StickyFooter` component to display the new message counter:

```tsx
// highlight-next-line
const StickyFooter: VirtuosoProps['StickyFooter'] = ({ context: { unseenMessages } }) => {
  const location = useVirtuosoLocation()
  const virtuosoMethods = useVirtuosoMethods()
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 50,
        }}
      >
        {location.bottomOffset > 200 && (
          <>
            // highlight-next-line
            {unseenMessages > 0 && <span>{unseenMessages} new messages</span>}
            <button
              style={{
                backgroundColor: 'white',
                border: '2px solid black',
                borderRadius: '100%',
                width: 30,
                height: 30,
                color: 'black',
              }}
              onClick={() => {
                virtuosoMethods.scrollToItem({ index: 'LAST', align: 'end', behavior: 'auto' })
              }}
            >
              &#9660;
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

## Reset the New Message Counter

A more sophisticated logic can be implemented, but for now, we would like to reset the counter when the user scrolls to the bottom. Add the following code to the `onScroll` event handler:

```tsx
  const onScroll = React.useCallback(
    (location: ListScrollLocation) => {
//highlight-start
      if (location.bottomOffset < 100) {
        setUnseenMessages(0)
      }
//highlight-end
```

Scroll up the message list and press the button - the indicator of new messages should appear. Clicking the button will scroll to the bottom of the list and reset the indicator.
