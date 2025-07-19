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

- The custom empty placeholder is used for the loading message.
- The custom header is used to display a loading message when loading older messages.
- Sending/receiving messages implements a scroll location so that the list can scroll to the bottom when a new message is sent or received.
- Optimistic updates are used to display a message before it is delivered.

## Live Example

```tsx live
import { randFullName, randNumber, randSentence } from '@ngneat/falso'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DataWithScrollModifier,
  ListScrollLocation,
  ScrollModifier,
  VirtuosoMessageList,
  VirtuosoMessageListLicense,
  VirtuosoMessageListProps,
} from '@virtuoso.dev/message-list'

interface ChatUser {
  id: number
  name: string
  avatar: string
}

interface ChatMessage {
  delivered: boolean
  localId?: number | null
  id: number | null
  user: ChatUser
  message: string
}

function createUser(id: number): ChatUser {
  const name = randFullName()
  return {
    id,
    name,
    avatar: `https://i.pravatar.cc/30?u=${encodeURIComponent(name)}`,
  }
}

let remoteIdCounter = 0

function createMessage(user: ChatUser): ChatMessage {
  const message = randSentence({
    length: randNumber({ min: 1, max: 5 }),
  }).join(' ')
  return {
    id: ++remoteIdCounter,
    user,
    message,
    delivered: true,
  }
}

let localIdCounter = 0

function createLocalMessage(user: ChatUser): ChatMessage {
  const message = randSentence({
    length: randNumber({ min: 1, max: 5 }),
  }).join(' ')
  return {
    id: null,
    localId: ++localIdCounter,
    user,
    message,
    delivered: false,
  }
}

interface MessageListContext {
  loadingNewer: boolean
  loaded: boolean
  currentUser: ChatUser
}

type VirtuosoProps = VirtuosoMessageListProps<ChatMessage, MessageListContext>

const EmptyPlaceholder: VirtuosoProps['EmptyPlaceholder'] = ({ context }) => <div>{!context.loaded ? 'Loading...' : 'Empty'}</div>

const Header: VirtuosoProps['Header'] = ({ context }) => {
  return <div style={{ height: 30 }}>{context.loadingNewer ? 'Loading...' : ''}</div>
}

const ItemContent: VirtuosoProps['ItemContent'] = ({ data: message, context }) => {
  const ownMessage = context.currentUser === message.user
  return (
    <div style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', flexDirection: ownMessage ? 'row-reverse' : 'row' }}>
      <img src={message.user.avatar} style={{ borderRadius: '100%', width: 30, height: 30, border: '1px solid #ccc' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '50%' }}>
        <div
          style={{
            background: ownMessage ? 'var(--background)' : 'var(--alt-background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
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

const OwnMessageScrollModifier: ScrollModifier = {
  type: 'auto-scroll-to-bottom',
  autoScroll: ({ atBottom }) => {
    if (atBottom) {
      return 'smooth'
    }
    return 'auto'
  },
}

const MessageUpdatedScrollModifier: ScrollModifier = {
  type: 'auto-scroll-to-bottom',
  autoScroll: ({ atBottom }) => {
    if (atBottom) {
      return 'smooth'
    }
    return false
  },
}

const InitialDataScrollModifier: ScrollModifier = {
  type: 'item-location',
  location: {
    index: 'LAST',
    align: 'end',
  },
  purgeItemSizes: true,
}

const ReceivedMessagesScrollModifier: ScrollModifier = {
  type: 'auto-scroll-to-bottom',
  autoScroll: ({ atBottom, scrollInProgress }) => {
    if (atBottom || scrollInProgress) {
      return 'smooth'
    }
    return false
  },
}

type ChannelData = DataWithScrollModifier<ChatMessage> | null

type ChannelsData = Record<string, ChannelData>

export default function App() {
  const [channelData, setChannelData] = useState<ChannelsData>(() => ({
    'channel-1': null,
    'channel-2': null,
    'channel-3': null,
    'channel-4': null,
  }))

  const [currentChannel, setCurrentChannel] = useState<string>('channel-1')

  const setMessageListData = useCallback(
    (cb: (current: ChannelData) => ChannelData) => {
      setChannelData((current) => {
        return {
          ...current,
          [currentChannel]: cb(current[currentChannel] ?? null),
        }
      })
    },
    [currentChannel]
  )

  const messageListData = useMemo(() => {
    return channelData[currentChannel] ?? null
  }, [channelData, currentChannel])

  const [loadingNewer, setLoadingNewer] = useState(false)

  const [currentUser, otherUser] = useMemo(() => {
    return [createUser(1), createUser(2)]
  }, [])

  const switchChannel = useCallback((channel: string) => {
    setChannelData((current) => {
      return {
        ...current,
        [channel]: {
          data: current[channel]?.data ?? null,
          scrollModifier: InitialDataScrollModifier,
        },
      }
    })
    setCurrentChannel(channel)
  }, [])

  // initial loading
  useEffect(() => {
    if (messageListData === null || messageListData.data === null) {
      setTimeout(() => {
        setMessageListData((current) => {
          if (current?.data?.length) {
            return current
          }
          const messages = Array.from({ length: 20 }, (_, i) => createMessage(i % 3 === 0 ? currentUser : otherUser))
          return {
            data: messages,
            scrollModifier: InitialDataScrollModifier,
          }
        })
      }, 500)
    }
  }, [currentUser, otherUser, setMessageListData, messageListData])

  // prepend older messages when the user scrolls to the top
  const onScroll = useCallback(
    (location: ListScrollLocation) => {
      // offset is 0 at the top, -totalScrollSize + viewportHeight at the bottom
      if (location.listOffset > -100 && !loadingNewer && messageListData !== null && messageListData.data?.length) {
        setLoadingNewer(true)
        setTimeout(() => {
          setMessageListData((current) => {
            return {
              data: [
                ...Array.from({ length: 10 }, (_, i) => createMessage(i % 3 === 0 ? currentUser : otherUser)),
                ...(current?.data ?? []),
              ],
              scrollModifier: 'prepend',
            }
          })
          setLoadingNewer(false)
        }, 1000)
      }
    },
    [loadingNewer, otherUser, currentUser, setMessageListData, messageListData]
  )

  return (
    <div className="tall-example" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '70%' }}>
      <div>
        <button style={{ fontWeight: currentChannel === 'channel-1' ? 'bold' : 'normal' }} onClick={() => switchChannel('channel-1')}>
          Channel 1
        </button>

        <button style={{ fontWeight: currentChannel === 'channel-2' ? 'bold' : 'normal' }} onClick={() => switchChannel('channel-2')}>
          Channel 2
        </button>
        <button style={{ fontWeight: currentChannel === 'channel-3' ? 'bold' : 'normal' }} onClick={() => switchChannel('channel-3')}>
          Channel 3
        </button>
      </div>
      <div style={{ height: 'calc(100vh - 6rem)', display: 'flex', flexDirection: 'column', flexGrow: '1' }}>
        <VirtuosoMessageListLicense licenseKey={''}>
          <VirtuosoMessageList<ChatMessage, MessageListContext>
            context={{ loadingNewer, loaded: messageListData !== null, currentUser }}
            data={messageListData}
            onScroll={onScroll}
            shortSizeAlign="bottom-smooth"
            EmptyPlaceholder={EmptyPlaceholder}
            computeItemKey={({ data }) => {
              if (data.id !== null) {
                return data.id
              }
              return `l-${data.localId}`
            }}
            Header={Header}
            style={{ flex: 1 }}
            ItemContent={ItemContent}
            increaseViewportBy={1000}
          />
        </VirtuosoMessageListLicense>

        <button
          onClick={() => {
            const localMessage = createLocalMessage(currentUser)
            setMessageListData((current) => {
              return {
                data: [...(current?.data ?? []), localMessage],
                scrollModifier: OwnMessageScrollModifier,
              }
            })
            // simulate receiving the confirmation from the server
            setTimeout(() => {
              setMessageListData((current) => {
                return {
                  data: current?.data?.map((item) => {
                    if (item.localId === localMessage.localId) {
                      return { ...item, localId: null, id: ++remoteIdCounter, delivered: true }
                    }
                    return item
                  }),
                  scrollModifier: MessageUpdatedScrollModifier,
                }
              })
            }, 1000)
          }}
        >
          Send
        </button>

        <button
          onClick={() => {
            const otherMessages = [createMessage(otherUser), createMessage(otherUser)]
            setMessageListData((current) => {
              return {
                data: [...(current?.data ?? []), ...otherMessages],
                scrollModifier: ReceivedMessagesScrollModifier,
              }
            })
          }}
        >
          Receive
        </button>
      </div>
    </div>
  )
}
```
