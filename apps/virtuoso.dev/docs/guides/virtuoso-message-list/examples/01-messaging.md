---
id: virtuoso-message-list-examples-messaging
title: Virtuoso Message List Examples - Messaging
sidebar_label: Messaging Interface
sidebar_position: 1
slug: /virtuoso-message-list/examples/messaging
---

# Messaging Interface

The example below is a simplified version of the final result of the tutorial - a messaging user interface. Sending and receiving messages is simulated with buttons. The `ChatChannel` class is used to simulate server-client communication. The source of the `ChatChannel` class is available in the [first part of the tutorial](/virtuoso-message-list/tutorial/intro).

## Key Points

* The custom empty placeholder is used for the loading message. 
* The custom header is used to display a loading message when loading older messages.
* Sending/receiving messages implements a scroll location so that the list can scroll to the bottom when a new message is sent or received.
* Optimistic updates are used to display a message before it is delivered.

## Live Example 

```tsx live noInline 
interface MessageListContext {
  loadingNewer: boolean
  channel: ChatChannel
}

type VirtuosoProps = VirtuosoMessageListProps<ChatMessage, MessageListContext>

const ItemContent: VirtuosoProps['ItemContent'] = ({ data: message, context }) => {
  const ownMessage = context.channel.currentUser === message.user
  return (
    <div style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', flexDirection: ownMessage ? 'row-reverse' : 'row' }}>
      <img src={message.user.avatar} style={{ borderRadius: '100%', width: 30, height: 30, border: '1px solid #ccc' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '50%' }}>
        <div
          style={{
            background: ownMessage ? '#0253B3' : '#F0F0F3',
            color: ownMessage ? 'white' : 'black',
            borderRadius: '0.5rem',
            padding: '0.5rem',
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

const EmptyPlaceholder: VirtuosoProps['EmptyPlaceholder'] = ({ context }) => <div>{!context.channel.loaded ? 'Loading...' : 'Empty'}</div>

const Header: VirtuosoProps['Header'] = ({ context }) => {
  return <div style={{ height: 30 }}>{context.loadingNewer ? 'Loading...' : ''}</div>
}

function App() {
  const channel = React.useMemo(() => new ChatChannel('general', 500), [])
  const messageListRef = React.useRef<VirtuosoMessageListMethods<ChatMessage>>(null)
  const [loadingNewer, setLoadingNewer] = React.useState(false)
  const firstMessageId = React.useRef<number | null>(null)

  React.useEffect(() => {
    channel.onNewMessages = (messages) => {
      // cleanup messages that map to the same localId, they got delivered
      const updatingMessageIds: number[] = []
      messageListRef.current?.data.map((item) => {
        const updatedItem = !item.delivered && messages.find((m) => m.localId === item.localId)
        if (updatedItem) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          updatingMessageIds.push(updatedItem.id!)
          return updatedItem
        } else {
          return item
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const nonUpdatingMessages = messages.filter((m) => !updatingMessageIds.includes(m.id!))

      messageListRef.current?.data.append(nonUpdatingMessages, ({ atBottom, scrollInProgress }) => {
        if (atBottom || scrollInProgress) {
          return 'smooth'
        } else {
          return false
        }
      })
    }

    if (!channel.loaded) {
      channel
        .getMessages({ limit: 20 })
        .then((messages) => {
          if (messages !== null) {
            firstMessageId.current = messages[0].id
            messageListRef.current?.data.append(messages)
          }
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }, [channel])

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

  return (
    <div className="tall-example" style={{ height: 800, display: 'flex', flexDirection: 'column', fontSize: '70%' }}>
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList<ChatMessage, MessageListContext>
          key={channel.name}
          context={{ loadingNewer, channel }}
          initialData={channel.messages}
          shortSizeAlign="bottom-smooth"
          initialLocation={{ index: 'LAST', align: 'end' }}
          onScroll={onScroll}
          EmptyPlaceholder={EmptyPlaceholder}
          computeItemKey={({ data }) => {
            if (data.id !== null) {
              return data.id
            } else {
              return `l-${data.localId}`
            }
          }}
          Header={Header}
          style={{ flex: 1 }}
          ItemContent={ItemContent}
          ref={messageListRef}
        />
      </VirtuosoMessageListLicense>
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem', justifyItems: 'end' }}>
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
          Send
        </button>

        <button
          onClick={() => {
            channel.createNewMessageFromAnotherUser()
          }}
        >
          Receive
        </button>
      </div>
    </div>
  )
}
render(<App />)
```
