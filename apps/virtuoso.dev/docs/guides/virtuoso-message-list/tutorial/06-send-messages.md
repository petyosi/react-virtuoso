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

Unlike receiving messages, sending messages should always scroll the list to the bottom. This is because the user is sending a message, and they should see it immediately. The `autoScrollToBottom` callback will let us handle this.

## Optimistic Updates

When sending a message, we want to show it immediately in the list, even before the server acknowledges it. Our `ChatChannel` class exposes a `sendOwnMessage` method which will return a "temporary" message with the `delivered` field set to false. After a short delay (simulating the network round trip), we are going to receive the "real" message back through the `onNewMessages` event handler. 

## Send Message Button

Add the following button after the 'receive message' button from the previous part:

```tsx
  <button
    onClick={() => {
      const tempMessage = channel.sendOwnMessage()
      messageListRef.current?.data.append([tempMessage], ({ scrollInProgress, atBottom }) => {
        if (atBottom || scrollInProgress) {
          return 'smooth'
        } else {
          return 'auto'
        }
      })
    }}
  >
    Send own message
  </button>
```
After a short delay, the `ChatChannel` will call the `onNewMessages` event handler, and we will replace the temporary message with the real one. Modify the `onNewMessages` event handler to handle the delivery of the message:

```tsx
  channel.onNewMessages = (messages) => {
// highlight-start
    const updatingMessageIds: number[] = []
    messageListRef.current?.data.map((item) => {
      const updatedItem = !item.delivered && messages.find((m) => m.localId === item.localId)
      if (updatedItem) {
        updatingMessageIds.push(updatedItem.id!)
        return updatedItem
      } else {
        return item
      }
    })

    const nonUpdatingMessages = messages.filter((m) => !updatingMessageIds.includes(m.id!))
// highlight-end

    messageListRef.current?.data.append(
      // highlight-next-line
      nonUpdatingMessages,
      ({ atBottom, scrollInProgress }) => {
        if (atBottom || scrollInProgress) {
          return 'smooth'
        } else {
          setUnseenMessages((val) => val + 1)
          return false
        }
      })
  }
```

The snippet above uses `data.map` to replace any temporary messages with the ones received from the server using the `localId` field to match them. Just like before, the `append` method is then used to add the remaining messages to the list.

The approach above lets us handle concurrent updates, as the "acknowledgement" of the message can come batched with other new messages from the server. 

If everything works as expected, pressing the button will display a new message from the current user with a smooth scroll animation. After a short delay, the `Delivering...` indicator below the message should disappear.

