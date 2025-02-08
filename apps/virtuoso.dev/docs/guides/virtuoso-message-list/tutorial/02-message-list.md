---
id: virtuoso-message-list-tutorial-message-list
title: Virtuoso Message List Tutorial - Message List
sidebar_label: Message List
sidebar_position: 2
slug: /virtuoso-message-list/tutorial/message-list
---

# Part 2 - Message List

In the second part of the tutorial, we're going to add the Virtuoso Message List component to our application and bind it to the data from the `ChatChannel` class we added in the previous step. Install the NPM package:

```bash
npm i @virtuoso.dev/message-list
```

:::note
The tutorial will not explicitly list the import statements for the components and classes used in the code snippets. Most likely, your IDE will automatically add the necessary imports when you paste the code. If not, you can add them manually.
:::

## Expose the ChatChannel Class in the Application

Let's modify the homepage of the application. We will store an instance of the `ChatChannel` class in the page component state. Then, we'll add the `VirtuosoMessageList` component and bind it to the channel's messages. 

:::important
First, ensure that the page runs on the client. Add `'use client';` at the top of the `app/page.tsx` file.
:::

Add the following to `app/page.tsx` component:

```tsx
export default function Home() {
  const [channels, setChannels] = useState<ChatChannel[]>(() => [
    new ChatChannel("general", 500),
  ]);
  const [channel, setChannel] = useState(channels[0]);
```

Initially, we will design a single-channel interface; In the next steps of the tutorial, we will add the ability to switch between channels. 

## Virtuoso Message List 

Now we will add the `VirtuosoMessageList` component to the `Home` page and bind it to the messages of the current channel. Remove the default page contents and add the following code:

```tsx
const messageListRef = useRef<VirtuosoMessageListMethods<ChatMessage, {}>>(null);

return (
  <main>
    <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList<ChatMessage, {}>
        style={{ height: "calc(100vh - 50px)" }}
        ref={messageListRef}
        initialData={channel.messages}
      />
    </VirtuosoMessageListLicense>
  </main>
)
```

Let's go over each part of the code, as several key concepts are introduced here:

### The ref 

The `messageListRef` will hold a reference to the component imperative API object - typed as `VirtuosoMessageListMethods`. The type is a generic one, with the first type parameter specifying the type of the data items (in this case, `ChatMessage`) that the component will operate with.

### The License Wrapper

The Message List component is a commercial product and requires a valid license key to work in production. For now, we'll leave the key empty, but remember to purchase add a valid key before you deploy the application to production.

### The Message List Generic Parameters

The component and its API object has two generic type parameters. The first one is the type of the data items, and the second one is the type of the additional `context` prop that you can pass to the component. This context lets you pass state updates into the component items and its custom components (headers and footers) without re-defining the components themselves. In this case, we're using the default empty object `{}`, as we're not passing any additional context. We will cover this feature in more detail in the next parts of the tutorial.

### The `style` prop

**The Message List needs a height to render correctly**. We're setting the height to `calc(100vh - 50px)` to have a full-screen chat interface with a bit of space at the bottom.

:::note
In your real world application, you might put the component into a flex box layout or use other methods to control the component's height - this works as well.
:::

### The `initialData` prop

The `initialData` prop is the initial data set that the component will render. In this case, we're passing the messages from the current channel. However, the channel itself has no messages yet, so the component will render an empty list. We will fix this in the next step.

We are going to use the message ids as keys. Eventually, when we implement optimistic rendering, we will work with local, temporary messages that don't have an id. That's why we're also providing a key using the `localId`.

## Load Initial Messages

We're going to add a `useEffect` hook to the `Home` component to load the initial messages when the component mounts. Add the following code to the `Home` component:

```tsx
  useEffect(() => {
    if (!channel.loaded) {
      channel
        .getMessages({ limit: 20 })
        .then((messages) => {
          if (messages !== null) {
            messageListRef.current?.data.append(messages);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [channel]);
```

If everything works as expected, after a short delay (caused by the `setTimeout` network simulations) you should see a plain-looking list of twenty `Item N` elements rendered. This is a good start, but we need to address two issues:

- A blank loading screen is not a good user experience.
- The messages don't look like chat messages.

## Computing the Item Keys

To optimize rendering, React uses a unique key to identify each item in a list. By default, the Message List component uses the items index for that, but this index might change as we load new messages. To fix this, we're going to provide a unique key for each message. Add the following property:

```tsx
  <VirtuosoMessageList<ChatMessage, {}>
// highlight-start
    computeItemKey={({ data }) => {
      if (data.id !== null) {
        return data.id
      } else {
        return `l-${data.localId}`
      }
    }}
// highlight-end
```

## Add a Loading Indicator 

The component accepts an `EmptyPlaceholder` prop that lets you define a custom component to render when the no data is present. Let's add a simple loading indicator to the component - we're going to take advantage of the `context` prop to pass the channel to the custom component. Add the following code above the `Home` component:

```tsx
interface MessageListContext {
  channel: ChatChannel
}

type VirtuosoProps = VirtuosoMessageListProps<ChatMessage, MessageListContext>

const EmptyPlaceholder: VirtuosoProps['EmptyPlaceholder'] = ({ context }) => {
  return (<div>{!context.channel.loaded ? 'Loading...' : 'Empty'}</div>)
}
```

:::note
The custom components should be placed outside of the body of the page component - in a separate file or at the top of the file. This way, you can easily re-use them in different parts of the application. Also, they won't be re-defined on each render, which causes performance issues.
:::

The component above lets us present different interfaces when the chat channel is loading and when its empty because there are no messages. Let's update the ref with the new type and then `VirtuosoMessageList` component to use the `EmptyPlaceholder` prop and its newly defined `MessageListContext` interface:

```tsx
//highlight-next-line
  const messageListRef = useRef<VirtuosoMessageListMethods<ChatMessage, MessageListContext>>(null);
//...
// highlight-start
  <VirtuosoMessageList<ChatMessage, MessageListContext>
    context={{ channel }}
    EmptyPlaceholder={EmptyPlaceholder}
// highlight-end
    style={{ height: "calc(100vh - 50px)" }}
    ref={messageListRef}
    initialData={channel.messages}
  />
```

## Customize the Message Rendering

By default, the component renders each data item as `Item {index}`. We're going to build a custom `ItemContent` component to render the chat messages. Add the following code above the `Home` component:

```tsx
const ItemContent: VirtuosoProps['ItemContent'] = ({ data: message, context }) => {
  const ownMessage = context.channel.currentUser === message.user
  return (
    <div style={{ display: 'flex', gap: '1rem', paddingBottom: '2rem', flexDirection: ownMessage ? 'row-reverse' : 'row' }}>
      <img src={message.user.avatar} style={{ borderRadius: '100%', width: 30, height: 30, border: '1px solid #ccc' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '50%' }}>
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

The above component renders a chat message with the user's avatar and a message bubble. The component also shows a "Delivering..." message when the message is not yet delivered (we will get to that later). Pass it to the `ItemContent` prop:

```tsx
  <VirtuosoMessageList<ChatMessage, MessageListContext>
    context={{ channel }}
    EmptyPlaceholder={EmptyPlaceholder}
    // highlight-next-line
    ItemContent={ItemContent}
    style={{ height: "calc(100vh - 50px)" }}
    ref={messageListRef}
    initialData={channel.messages}
  />
```

If everything is set up correctly, you should see the chat messages rendered in the list. However, the list is likely scrolled at the top initially. We fix this next.

## Initial Scroll Position

The `initialLocation` prop lets you control the initial scroll position of the list. We're going to scroll to the bottom of the list when the initial messages are loaded. Add the following code to the `VirtuosoMessageList` component:

```tsx
  <VirtuosoMessageList<ChatMessage, MessageListContext>
    context={{ channel }}
    EmptyPlaceholder={EmptyPlaceholder}
    ItemContent={ItemContent}
    style={{ height: "calc(100vh - 50px)" }}
    ref={messageListRef}
    initialData={channel.messages}
    // highlight-next-line
    initialLocation={{ index: 'LAST', align: 'end' }}
  />
```

The `initialLocation` is a powerful property - it lets you control the scroll position when the list is rendered, skipping a rendering cycle that could potentially render top items and then scroll to the bottom. In the real world, You can also start from the first unread message, the last message, or any specific message. 

