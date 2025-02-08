---
id: virtuoso-message-list-tutorial-multiple-channels
title: Virtuoso Message List Tutorial - Multiple Channels
sidebar_label: Multiple Channels
sidebar_position: 7
slug: /virtuoso-message-list/tutorial/multiple-channels
---

# Part 7 - Multiple Channels

So far, our tutorial has focused on a single chat channel. In this part, we will extend the application to support multiple channels. We've already added the foundation for this with the `channels` state and the `setChannel` function. We will now add a channel switcher to the UI and implement the logic to switch between channels. To replace the current channel's messages with the selected channel's messages, we will use the `data.replace` method. 

## Channel Sidebar

Let's add another channel and then add some flex box wrappers for a channel sidebar to the left of the message list. Modify the `Home` component as follows:

```tsx
const [channels, setChannels] = React.useState<ChatChannel[]>(() => [
  new ChatChannel('general', 500), 
// highlight-next-line
  new ChatChannel('fun', 500)
])

const [channel, setChannel] = useState(channels[0]);
```

```tsx
<main>
  <div style={{ display: 'flex', flexDirection: 'row' }}>
    <div style={{ padding: '1rem', minWidth: 200, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
      <h2>Channels</h2>
      {channels.map((c) => {
        return (
          <button
            key={c.name}
            onClick={() => {
              if (c !== channel) {
                setChannel(c);
                messageListRef.current?.data.replace(c.messages, {
                  index: "LAST",
                  align: "end",
                });
              }
            }}
          >
            {c.name}
          </button>
        )
      })}

      <button
        onClick={() => {
          const channel = new ChatChannel(`channel-${channels.length}`, 0)
          setChannels([...channels, channel])
          setChannel(channel)
          messageListRef.current?.data.replace(channel.messages, {
            index: "LAST",
            align: "end",
          });
        }}
      >
        Add channel
      </button>
    </div>

    <div style={{ flex: 1 }}>
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList 
        ... />
      </VirtualMessageListLicense>

      <div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
        {/** buttons **/}
      </div>
    </div>
  </div>
</main>
```

If everything is set up correctly, you should see a list of buttons on the left side of the screen. Clicking on a them should switch the message list to that channel or create a new channel. 

# Vertical Align of Short Conversations

If you try to send/receive a new message in a new channel, you will notice that, by default, they are aligned to the top of the list. This might be the desired effect in some cases, but the message list component lets you configure the alignment in those cases through the `shortSizeAlign` property. It accepts `'top' | 'bottom' | 'bottom-smooth'` with `'top'` being the default value. The `'bottom-smooth'` value will use a CSS transition to smoothly pull new messages up when they are added to the list until the list is long enough to display a scroller, at which point the `autoscrollToBottom` logic will be used. Let's try the `'bottom-smooth'` value:

```tsx
<VirtuosoMessageList<ChatMessage, MessageListContext>
  context={{ loadingNewer, channel, unseenMessages }}
  initialData={channel.messages}
// highlight-next-line
  shortSizeAlign="bottom-smooth"
```

If everything is set up correctly, you should see the initial message in the new channels smoothly aligning to the bottom of the list. 

## Summary 

Congratulations for making it this far! In this tutorial, we covered the essential features of the `VirtuosoMessageList` component - sending and receiving messages while managing the scroll position, optimistic updates, loading older messages, displaying additional UI like loading indicators, scroll to bottom buttons, and multiple channels. The data API lets you build more advanced features like chatbot streaming messages, reactions and deleting messages. As next steps, you can check the detailed guides for each capability for a more in-depth understanding of the component. 
