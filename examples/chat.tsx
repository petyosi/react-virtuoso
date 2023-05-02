import React from 'react'
import { StateSnapshot, Virtuoso, VirtuosoHandle } from '../src/'
import { faker } from '@faker-js/faker'
import { produce } from 'immer'

const OWN_USER_ID = '1'

interface Message {
  id: string
  message: string
}

function generateMessages(length: number): Message[] {
  return Array.from({ length }, (_) => ({
    id: faker.datatype.number({ min: 1, max: 2 }).toString(),
    message: faker.lorem.sentences(),
  }))
}

interface Channel {
  id: number
  firstItemIndex: number
  name: string
  messages: Message[]
  newMessageReceived: boolean
}

const initialChannelData: Channel[] = Array.from({ length: 3 }, (_, index) => {
  return {
    id: index,
    firstItemIndex: 200000,
    name: `Channel ${index}`,
    messages: generateMessages(20),
    newMessageReceived: false,
  }
})

initialChannelData.push({
  id: 3,
  firstItemIndex: 200000,
  name: 'Channel 3',
  messages: generateMessages(1),
  newMessageReceived: false,
})

export function Example() {
  const [channels, setChannels] = React.useState(initialChannelData)
  const [currentChannelId, setCurrentChannelId] = React.useState<number | null>(null)
  const channel = channels.find((x) => x.id === currentChannelId)
  const virtuosoRef = React.useRef<VirtuosoHandle>(null)
  const channelStateCache = React.useRef(new Map<number | null, StateSnapshot>())
  const [newMessage, setNewMessage] = React.useState('')

  const addMessage = React.useCallback(
    (message: Message) => {
      setChannels((channels) => {
        return produce(channels, (draft) => {
          const channel = draft.find((x) => x.id === currentChannelId)!
          channel.messages.push(message)
          channel.newMessageReceived = true
        })
      })
    },
    [currentChannelId, channels]
  )

  const loadOlderMessages = React.useCallback(() => {
    setTimeout(() => {
      setChannels((channels) => {
        return produce(channels, (draft) => {
          const channel = draft.find((x) => x.id === currentChannelId)!
          channel.messages.unshift(...generateMessages(20))
          channel.firstItemIndex -= 20
          // reset the flag so that followOutput does not bring the scroll down
          channel.newMessageReceived = false
        })
      })
    }, 300)
  }, [currentChannelId, channels])

  const selectChannel = React.useCallback(
    (id: number) => {
      if (currentChannelId !== null) {
        virtuosoRef.current?.getState((snapshot) => {
          channelStateCache.current.set(currentChannelId, snapshot)
        })
      }
      setCurrentChannelId(id)
    },
    [currentChannelId]
  )

  const followOutput = React.useCallback(
    (isAtBottom: boolean) => {
      // don't follow if messages are being added to the top
      if (!channel || !channel.newMessageReceived) {
        return false
      }

      const isOwnMessage = channel.messages[channel.messages.length - 1]?.id === OWN_USER_ID
      if (isOwnMessage) {
        // if the user has scrolled away and sends a message, bring him to the bottom instantly
        return isAtBottom ? 'smooth' : 'auto'
      } else {
        // a message from another user has been received - don't pull to bottom unless already there
        return isAtBottom ? 'smooth' : false
      }
    },
    [channel]
  )

  const channelState = channelStateCache.current.get(currentChannelId)

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 0, minWidth: 150 }}>
        <ul>
          {channels.map((x) => (
            <li key={x.id}>
              <button onClick={() => selectChannel(x.id)}>{x.name}</button>
            </li>
          ))}
        </ul>
      </div>
      <div
        style={{
          height: '500px',
          display: 'flex',
          minWidth: 300,
          flex: 1,
          flexDirection: 'column',
        }}
      >
        {channel ? (
          <>
            <h1>{channel.name}</h1>

            <Virtuoso
              key={`channel-${channel.id}}`}
              ref={virtuosoRef}
              context={{ ownUserId: OWN_USER_ID, channel }}
              restoreStateFrom={channelState}
              style={{ flex: 1 }}
              increaseViewportBy={{ top: 0, bottom: 100 }}
              alignToBottom
              followOutput={followOutput}
              itemContent={virtosoItemContent}
              data={channel.messages}
              firstItemIndex={channel.firstItemIndex}
              startReached={loadOlderMessages}
              {...(channelState ? {} : { initialTopMostItemIndex: channel.messages.length - 1 })}
            />

            <div
              style={{
                marginTop: 12,
                flex: 0,
                minHeight: 30,
                gap: 8,
              }}
            >
              <form
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
                onSubmit={(e) => {
                  e.preventDefault()
                  addMessage({ id: OWN_USER_ID, message: newMessage })
                }}
              >
                <input
                  style={{ flex: 1 }}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage((e.target as HTMLInputElement).value)}
                  placeholder="Say hi!"
                />
                <button type="submit">send</button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    addMessage({ id: '2', message: faker.lorem.sentences() })
                  }}
                >
                  Receive
                </button>
              </form>
            </div>
          </>
        ) : (
          'Select a channel..'
        )}
      </div>
    </div>
  )
}

function virtosoItemContent(_: number, { id, message }: Message, { ownUserId }: { ownUserId: string }) {
  const fromUser = id === ownUserId
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: fromUser ? 'flex-end' : 'flex-start',
        width: '100%',
        padding: '12px 0',
      }}
    >
      <div
        style={{
          background: fromUser ? 'orange' : 'red',
          color: 'white',
          width: '60%',
          padding: 12,
          borderRadius: 4,
          wordBreak: 'break-word',
        }}
      >
        {message}
      </div>
    </div>
  )
}
