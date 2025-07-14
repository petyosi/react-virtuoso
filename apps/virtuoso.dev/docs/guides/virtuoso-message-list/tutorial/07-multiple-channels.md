---
id: virtuoso-message-list-tutorial-multiple-channels
title: Virtuoso Message List Tutorial - Multiple Channels
sidebar_label: Multiple Channels
sidebar_position: 7
slug: /virtuoso-message-list/tutorial/multiple-channels
---

# Part 7 - Multiple Channels

So far, our tutorial has focused on a single chat channel. In this part, we will extend the application to support multiple channels. We've already added the foundation for this previously, but now we're going to add a sidebar for channels and allow switching between them.

## Channel Sidebar

Let's add another channel and then add some flex box wrappers for a channel sidebar to the left of the message list.

```tsx
const [channelsData, setChannelsData] = useState<ChannelsData>(() => ({
  general: null,
  marketing: null,
  sales: null,
  frontend: null,
}))

// introduce a callback to switch channels
const switchChannel = useCallback((channel: string) => {
  setChannelsData((current) => {
    return {
      ...current,
      [channel]: {
        data: current[channel]?.data ?? null,
        // when we switch channels, we want to reset the scroll position to the bottom.
        scrollModifier: InitialDataScrollModifier,
      },
    }
  })
  setCurrentChannel(channel)
}, [])
```

Add some styling to the main div, and render a side bar with buttons for each channel:

```tsx
  return <div style={{ display: 'flex', gap: '2rem' }}>
    <div>
      <ul>
        {Object.keys(channelsData).map((channelName) => (
          <li key={channelName}>
            <button style={{ fontWeight: currentChannel === channelName ? 'bold' : 'normal' }} onClick={() => switchChannel(channelName)}>
              {channelName}
            </button>
          </li>
        ))}
      </ul>
    </div>
    <div style={{ height: 'calc(100vh - 6rem)', display: 'flex', flexDirection: 'column', flexGrow: '1' }}>
      <VirtuosoMessageListLicense licenseKey="">
  //...
```

If everything is set up correctly, you should see a list of buttons on the left side of the screen. Clicking on a them should switch the message list to that channel or create a new channel.

## Summary

Congratulations for making it this far! In this tutorial, we covered the essential features of the `VirtuosoMessageList` component - sending and receiving messages while managing the scroll position, optimistic updates, loading older messages, displaying additional UI like loading indicators, scroll to bottom buttons, and multiple channels. The `data` prop lets you build more advanced features like chatbot streaming messages, reactions and deleting messages. As next steps, you can check the detailed guides for each capability for a more in-depth understanding of the component.
