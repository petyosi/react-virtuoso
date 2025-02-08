---
id: virtuoso-message-list-tutorial-receive-messages
title: Virtuoso Message List Tutorial - Receive Messages
sidebar_label: Receive Messages
sidebar_position: 4
slug: /virtuoso-message-list/tutorial/receive-messages
---

# Part 5 - Receive Messages

In this part, we're going to implement a simulation of receiving messages from the server. Since we have no actual backend, we're going to use a button for that.

## Receive Message Button

Our `ChatChannel` class exposes a convenience method called `createNewMessageFromAnotherUser`. Let's add a button below the list component to simulate receiving a message:

```tsx
//...
  <div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
    <button
      onClick={() => {
        channel.createNewMessageFromAnotherUser()
      }}
    >
      Receive message from another user
    </button>
  </div>
</main>
```

## New Messages and Scroll Position

By default, when a new message is received, the list should scroll to the bottom so that the user can follow the conversation. However, if the user has scrolled up to read previous messages, the list should should remain at the same scroll position and they should see a notification that new messages are available. To implement this, we are going to add an event listener for new messages and a counter that will show the number of new messages if the user has scrolled up. Add a state counter to the `Home` component:

```tsx
const [unseenMessages, setUnseenMessages] = useState(0);
```
## New Messages Event Handler

The `ChatChannel` has a simple event callback that gets called when new messages come in that we will override in the `useEffect`. Add the following code to the existing `useEffect` call and refresh the page:

```tsx
  useEffect(() => {
    channel.onNewMessages = (messages) => {
      messageListRef.current?.data.append(messages, ({ atBottom, scrollInProgress }) => {
        if (atBottom || scrollInProgress) {
          return 'smooth'
        } else {
          setUnseenMessages((val) => val + 1)
          return false
        }
      })
    }
```

The `data.append` method accepts an optional `scrollToBottom` argument that lets us specify if we want the list to scroll to the bottom when the new message is added. If the list is at the bottom, we will smooth scroll to the latest message. If not, we increment the `unseenMessages` counter. 

:::note
Since we're using a smooth scroll, there's a slight chance of a new message coming in *while* the list is scrolling to the bottom. In that case, the list will scroll to the bottom again, and the user will see the new message. That's the reason for the `scrollInProgress` check.
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



