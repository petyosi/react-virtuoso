import React, { useRef, useState } from 'react'
import styled from '@emotion/styled'
import { Virtuoso } from '../src/'
import faker from 'faker'

interface BubbleProps {
  text: string
  fromUser?: boolean
  className?: string
}

const BubbleWrap = styled.div<{ fromUser?: boolean }>`
  display: flex;
  justify-content: ${({ fromUser }) => fromUser && 'flex-end'};
  width: 100%;
  padding: 12px 0;
`

const Content = styled.div<{ fromUser?: boolean }>`
  background: ${({ fromUser }) => (fromUser ? 'orange' : 'red')};
  color: white;
  width: 60%;
  padding: 12px;
  border-radius: 4px;
  word-break: break-word;
`

function Bubble({ text, fromUser, className }: BubbleProps) {
  return (
    <BubbleWrap fromUser={fromUser} className={className}>
      <Content fromUser={fromUser}>{text}</Content>
    </BubbleWrap>
  )
}

interface ChatListProps {
  messages: { id: string; message: string }[]
  userId: string
  onSend: (message: string) => void
  onReceive: () => void
  height?: number
  placeholder?: string
}

const Root = styled.div<{ fromUser?: boolean }>`
  padding: 12px 24px;
`

const TextWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  margin-top: 12px;
`

function ChatList({ userId, messages = [], onSend, onReceive, placeholder }: ChatListProps) {
  const [newMessage, setNewMessage] = useState('')
  const ref = useRef(null)
  const isMyOwnMessage = useRef(false)
  const onSendMessage = () => {
    isMyOwnMessage.current = true
    onSend(newMessage)
    setNewMessage('')
  }

  const onReceiveMessage = () => {
    isMyOwnMessage.current = false
    onReceive()
  }

  const row = React.useMemo(
    () => (i: number, { message, id }: { message: string; id: string }) => {
      const fromUser = id === userId
      return <Bubble key={i} fromUser={fromUser} text={message} />
    },
    [userId]
  )

  return (
    <Root
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid red',
      }}
    >
      <Virtuoso
        ref={ref}
        style={{ flex: 1 }}
        initialTopMostItemIndex={messages.length - 1}
        followOutput={(isAtBottom) => {
          if (isMyOwnMessage.current) {
            // if the user has scrolled away and sends a message, bring him to the bottom instantly
            return isAtBottom ? 'smooth' : 'auto'
          } else {
            // a message from another user has been received - don't pull to bottom unless already there
            return isAtBottom ? 'smooth' : false
          }
        }}
        itemContent={row}
        data={messages}
      />
      <TextWrapper style={{ flex: 0, minHeight: 30 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSendMessage()
          }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage((e.target as HTMLInputElement).value)}
            placeholder={placeholder}
          />
          <button type="submit">send</button> |
          <button type="button" onClick={onReceiveMessage}>
            receive
          </button>
        </form>
      </TextWrapper>
    </Root>
  )
}

const data = Array.from({ length: 130 }, (_) => ({
  id: faker.random.number({ min: 1, max: 2 }).toString(),
  message: faker.lorem.sentences(),
}))

export default function App() {
  const [messages, setMessages] = React.useState(data)
  const userId = '1'
  return (
    <div
      style={{
        height: '500px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ChatList
        messages={messages}
        userId="1"
        placeholder="Say hi!"
        onSend={(message) => setMessages((x) => [...x, { id: userId, message }])}
        onReceive={() => {
          setMessages((x) => [...x, { id: '2', message: faker.lorem.sentences() }])
        }}
      />
    </div>
  )
}
