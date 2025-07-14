---
id: virtuoso-message-list-tutorial-send-messages
title: Virtuoso Message List Tutorial - Send Messages
sidebar_label: Send Messages
sidebar_position: 6
slug: /virtuoso-message-list/tutorial/send-messages
---

# Part 6 - Send Messages

In this part of the tutorial, we will add the ability to send messages to the chat channel on behalf of the current user.
Since the focus of this tutorial is the message list itself, we will use a button rather than a text input to simulate sending messages. But first let's cover some of the specifics of the feature.

## Sending Messages and Scroll Position

Unlike receiving messages, sending messages should always scroll the list to the bottom. This is because the user is sending a message, and they should see it immediately. The `autoScroll` callback will let us handle this.

## Optimistic Updates

When sending a message, we want to show it immediately in the list, even before the server acknowledges it. We will simulate this by creating a temporary message object with a `localId` field. The `localId` will be used to match the temporary message with the one received from the server later.

## Send Message Button

Add the following button next to the receive messages button:

```tsx
<button
  onClick={() => {
    const localMessage = createLocalMessage(currentUser)
    setMessageListData((current) => {
      return {
        data: [...(current?.data ?? []), localMessage],
        scrollModifier: {
          type: 'auto-scroll-to-bottom',
          autoScroll: ({ atBottom }) => {
            if (atBottom) {
              return 'smooth'
            }
            return 'auto'
          },
        },
      }
    })
    // simulate receiving the confirmation from the server
    setTimeout(() => {
      setMessageListData((current) => {
        return {
          data: current?.data?.map((item) => {
            if (item.localId === localMessage.localId) {
              return { ...item, localId: null, id: nextRemoteId(), delivered: true }
            }
            return item
          }),
          scrollModifier: {
            type: 'auto-scroll-to-bottom',
            autoScroll: ({ atBottom }) => {
              if (atBottom) {
                return 'smooth'
              }
              return false
            },
          },
        }
      })
    }, 1000)
  }}
>
  Send
</button>
```

If everything works as expected, pressing the button will display a new message from the current user with a smooth scroll animation. After a short delay, the `Delivering...` indicator below the message should disappear.
