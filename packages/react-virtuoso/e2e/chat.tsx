import * as React from 'react'
import { forwardRef } from 'react'
import * as ReactDOM from 'react-dom'
import styled from 'styled-components'
import { Virtuoso } from '../src/'

const data = [
  { id: '1', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '1', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '1', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '1', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '1', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '1', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '1', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '1', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '1', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '1', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
  { id: '2', message: 'lorem ipsum sin amet' },
]

interface ChatListProps {
  messages: { id: string; message: string }[]
  height?: number
  userId: string
}

const Root = styled.div<{ fromUser?: boolean; height?: number }>`
  width: 100%;
  height: ${({ height }) => (height ? `${height}px` : '100%')};
  position: relative;
  box-shadow: 0px 0px 10px #d92534;
  border-radius: 4px;
  overflow: hidden;
  padding: 12px 24px;
`

const BubbleWrapper = styled.div<{ fromUser?: boolean }>`
  display: flex;
  justify-content: ${({ fromUser }) => fromUser && 'flex-end'};
  width: 100%;
`

const Bubble = styled.div<{ fromUser?: boolean }>`
  margin: 12px 0;
  background: ${({ fromUser }) => (fromUser ? 'red' : 'orange')};
  color: white;
  width: 60%;
  padding: 12px;
  border-radius: 4px;
`

const Chat = forwardRef(({ userId, messages = [], height }: ChatListProps, ref: React.Ref<any>) => {
  const row = (i: number) => {
    const { message, id } = messages[i]
    const fromUser = id === userId
    return (
      <BubbleWrapper fromUser={fromUser} key={i}>
        <Bubble key={i} fromUser={fromUser}>
          {i} - {message}
        </Bubble>
      </BubbleWrapper>
    )
  }

  return (
    <Root height={height}>
      <Virtuoso
        ref={ref}
        style={{ height }}
        totalCount={messages.length}
        initialTopMostItemIndex={messages.length - 1}
        followOutput="smooth"
        item={i => row(i)}
      />
    </Root>
  )
})

function App() {
  const [messages, setMessages] = React.useState(data)
  const onSend = () => {
    setMessages(x => [...x, { id: '1', message: 'This is a new random message!!!' }])
  }
  return (
    <>
      <Chat userId="1" messages={messages} height={500} />
      <button onClick={() => onSend()}>add message</button>
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
