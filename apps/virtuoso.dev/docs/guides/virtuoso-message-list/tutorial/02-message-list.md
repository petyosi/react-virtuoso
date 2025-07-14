---
id: virtuoso-message-list-tutorial-message-list
title: Virtuoso Message List Tutorial - Message List
sidebar_label: Message List
sidebar_position: 2
slug: /virtuoso-message-list/tutorial/message-list
---

# Part 2 - Message List

In the second part of the tutorial, we're going to add the Virtuoso Message List
component to our application and bind it to data generated from the utilities in
the previous step. Install the NPM package:

```bash
npm i @virtuoso.dev/message-list
```

:::info
The tutorial will not explicitly list the import statements for the components
and classes used in the code snippets. Most likely, your IDE will automatically
add the necessary imports when you paste the code. If not, you can add them
manually.
:::

## Load a channel with some simple messages

In this step, we will modify the homepage of the application to display message
list with several chat messages in the `VirtuosoMessageList`. First, let's add
the state: Replace the contents of `src/App.tsx` with the following code:

```tsx
// The channel data type defines the `data` prop passed to the VirtuosoMessageList component.
// The prop accepts an object defining the data to display and optional instructions on how the scroll location should change.
type ChannelData = DataWithScrollModifier<ChatMessage> | null

type ChannelsData = Record<string, ChannelData>

// use this shape to start channels at the bottom of the list
const InitialDataScrollModifier: ScrollModifier = {
  type: 'item-location',
  location: {
    index: 'LAST',
    align: 'end',
  },
  purgeItemSizes: true,
}

// This function is used to generate key properties for the message list items based on the data rendered.
// use a stable identifier to avoid unnecessary re-mounts when the message list data changes.
const computeItemKey: VirtuosoMessageListProps<ChatMessage, null>['computeItemKey'] = ({ data }) => {
  if (data.id !== null) {
    return data.id
  }
  return `l-${data.localId}`
}

function App() {
  // we will start with a single 'general' channel
  const [channelsData, setChannelsData] = useState<ChannelsData>(() => ({
    general: null,
  }))

  const [currentChannel, setCurrentChannel] = useState<string>('general')

  const messageListData = useMemo(() => {
    return channelsData[currentChannel] ?? null
  }, [channelsData, currentChannel])

  const setMessageListData = useCallback(
    (cb: (current: ChannelData) => ChannelData) => {
      setChannelsData((current) => {
        return {
          ...current,
          [currentChannel]: cb(current[currentChannel] ?? null),
        }
      })
    },
    [currentChannel]
  )

  const [currentUser, otherUser] = useMemo(() => {
    return [createUser(1), createUser(2)]
  }, [])

  // this loads the initial data in the channel, simulating a network request
  useEffect(() => {
    if (messageListData === null || messageListData.data === null) {
      setTimeout(() => {
        setMessageListData((current) => {
          if (current?.data?.length) {
            return current
          }
          const messages = Array.from({ length: 120 }, (_, i) => createMessage(i % 3 === 0 ? currentUser : otherUser))
          return {
            data: messages,
            scrollModifier: InitialDataScrollModifier,
          }
        })
      }, 500)
    }
  }, [currentUser, otherUser, setMessageListData, messageListData])

  return <div>Coming soon</div>
}
```

Initially, we make a single-channel interface; In the next steps of the
tutorial, we will add the ability to switch between channels.

## Virtuoso Message List

Now we will add the `VirtuosoMessageList` component. Replace the `coming soon`
div with the following code:

```tsx
return (
  <div>
    <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList<ChatMessage, null> style={{ height: '80vh' }} data={messageListData} computeItemKey={computeItemKey} />
    </VirtuosoMessageListLicense>
  </div>
)
```

Let's go over each part of the code, as several key concepts are introduced
here:

### The message list data with scroll modifier

The `messageListData` is the data that the component will render and,
optionally, a scroll modifier that will be used to control the scroll position
of the list, which lets you position the list at the end of the data, prepend
older messages when loading history, or automatically scroll to the bottom when
new messages are added. At this step, we're using the `item-location` modifier,
which will position the list at the end of the data when the data is loaded.

### The License wrapper

The Message List component is a commercial product and requires a valid license
key to work in production. For now, we'll leave the key empty, but remember to
purchase add a valid key before you deploy the application to production.

### The message list generic parameters

The `VirtuosoMessageList` component has two generic type parameters. The first
one is the type of the data items, and the second one is the type of the
additional `context` prop you can pass to the component. This context lets you
pass state updates into the component items and its custom components (headers
and footers) without re-defining the components themselves. In this case, we're
using `null`, as we're not passing any additional context. We will cover this
feature in more detail in the next parts of the tutorial.

### The `style` prop

**The Message List needs a height to render correctly**. We're setting the
height to `80vh` to have a full-screen chat interface with a bit of space at the
bottom. In your real world application, you might put the component into a flex
box layout or use other methods to control the component's height - this works
as well.

### The `computeItemKey` prop

The `computeItemKey` prop is used to compute a unique key for each item in the
list. We're using the message ids as keys. Eventually, when we implement
optimistic rendering, we will work with local, temporary messages that don't
have an id. That's why we're also providing a key using the `localId`. The
`computeItemKey` prop is a function that takes an item and returns a string. The
function should be stable - it should return the same key for the same item on
each render.

### Initial data loading

The `useEffect` hook is used to load the initial data when the component mounts.
We're using a `setTimeout` to simulate a network request. In a real-world
application, you are likely going to use a library like `react-query` or `swr`
for data fetching.

If everything works as expected, after a short delay (caused by the `setTimeout`
network simulations) you should see a plain-looking list of twenty `Item N`
elements rendered. This is a good start, but we need to address two issues:

- A blank loading screen is not a good user experience.
- The messages don't look like chat messages.

## Displaying the messages

We're going to build a custom message item component to render the chat messages
named `ItemContent`. The item will display alternating messages, depending on
who's sent them. For this, it has to distinguish between the current user and
other users - we are going to utilize the context prop for this. Let's add some
utility types:

```tsx
// we will use this context to pass the current user to the message list item
interface MessageListContext {
  currentUser: ChatUser
}

// a shorthand for the message list props
type MessageListProps = VirtuosoMessageListProps<ChatMessage, MessageListContext>

const ItemContent: MessageListProps['ItemContent'] = ({ data: message, context }) => {
  const ownMessage = context.currentUser === message.user
  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        paddingBottom: '2rem',
        flexDirection: ownMessage ? 'row-reverse' : 'row',
      }}
    >
      <img
        src={message.user.avatar}
        style={{
          borderRadius: '100%',
          width: 30,
          height: 30,
          border: '1px solid #ccc',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxWidth: '50%',
        }}
      >
        <div
          style={{
            background: ownMessage ? '#3A5BC7' : '#F0F0F3',
            color: ownMessage ? 'white' : 'black',
            borderRadius: '1rem',
            padding: '1rem',
            ...(ownMessage ? { borderTopRightRadius: '0' } : { borderTopLeftRadius: 'auto' }),
          }}
        >
          {message.message}
        </div>
        {!message.delivered && <div style={{ textAlign: 'right' }}>Delivering...</div>}
      </div>
    </div>
  )
}
```

Now, let's pass `ItemContent` to the `VirtuosoMessageList` component and the
`currentUser` to the context:

```tsx
return (
  <div>
    <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList<ChatMessage, MessageListContext>
        style={{ height: '80vh' }}
        // highlight-next-line
        context={{ currentUser }}
        // highlight-next-line
        ItemContent={ItemContent}
        data={messageListData}
        computeItemKey={computeItemKey}
      />
    </VirtuosoMessageListLicense>
  </div>
)
```

## Showing a loading indicator

The message list accepts an `EmptyPlaceholder` prop that lets you define a custom
component to render when the no data is present. Let's use it add a simple loading
indicator to the component.

```tsx
const EmptyPlaceholder: VirtuosoProps['EmptyPlaceholder'] = ({ context }) => {
  return <div>{!context.channel.loaded ? 'Loading...' : 'Empty'}</div>
}
//.... Add the prop to the component
return (
  <div>
    <VirtuosoMessageList<ChatMessage, MessageListContext>
      style={{ height: '80vh' }}
      context={{ currentUser }}
      ItemContent={ItemContent}
      // highlight-next-line
      EmptyPlaceholder={EmptyPlaceholder}
      data={messageListData}
      computeItemKey={computeItemKey}
    />
  </div>
)
```

:::warning Don't inline the custom components

The custom components should be placed outside of the body of the page
component - in a separate file or at the module level. This way, you can
easily re-use them in different parts of the application. Also, they won't be
re-defined on each render, which causes performance issues.
:::

If necessary, you can also extend the context with additional data to distinguish between an empty state and a loading state, and then change the content of the `EmptyPlaceholder` accordingly.
