---
id: virtuoso-message-list-examples-ai-chatbot
title: Virtuoso Message List Examples - AI Chatbot
sidebar_label: AI Chatbot
sidebar_position: 2
slug: /virtuoso-message-list/examples/ai-chatbot
---

# Chatbot Conversation

The example below simulates a conversation with a chatbot. Shortly after the question is sent, a response is received, then continuously updated.

## Key Points

* The `data.map` method is used to stream the incoming response.
* The initial message positioning is set through `shortSizeAlign`
* The `autoscrollToBottomBehavior` is set to `smooth` to animate the scroll when the streaming response scroll beyond the visible area.


## Live Example 

```tsx live noInline 

interface Message {
  key: string
  text: string
  user: 'me' | 'other'
}

let idCounter = 0

function randomMessage(user: Message['user']): Message {
  return { user, key: `${idCounter++}`, text: randTextRange({ min: user === 'me' ? 20 : 100, max: 200 }) }
}

const ItemContent: VirtuosoMessageListProps<Message, null>['ItemContent'] = ({ data }) => {
  const ownMessage = data.user === 'me'
  return (
    <div style={{ paddingBottom: '2rem', display: 'flex' }}>
      <div
        style={{
          maxWidth: '80%',
          marginLeft: data.user === 'me' ? 'auto' : undefined,

          background: ownMessage ? '#0253B3' : '#F0F0F3',
          color: ownMessage ? 'white' : 'black',
          borderRadius: '1rem',
          padding: '1rem',
        }}
      >
        {data.text}
      </div>
    </div>
  )
}

function App() {
  const virtuoso = React.useRef<VirtuosoMessageListMethods<Message>>(null)

  return (
    <div className="tall-example" style={{ height: 500, display: 'flex', flexDirection: 'column', fontSize: '70%' }}>
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList<Message, null>
          ref={virtuoso}
          style={{ flex: 1 }}
          computeItemKey={({ data }) => data.key}
          initialLocation={{ index: 'LAST', align: 'end' }}
          shortSizeAlign="bottom-smooth"
          ItemContent={ItemContent}
        />
      </VirtuosoMessageListLicense>

      <button
        onClick={() => {
          const myMessage = randomMessage('me')
          virtuoso.current?.data.append([myMessage], ({ scrollInProgress, atBottom }) => {
            return {
              index: 'LAST',
              align: 'end',
              behavior: atBottom || scrollInProgress ? 'smooth' : 'auto',
            }
          })

          setTimeout(() => {
            const botMessage = randomMessage('other')
            virtuoso.current?.data.append([botMessage])

            let counter = 0
            const interval = setInterval(() => {
              if (counter++ > 20) {
                clearInterval(interval)
              }
              virtuoso.current?.data.map((message) => {
                  return message.key === botMessage.key ? { ...message, text: message.text + ' ' + randPhrase() } : message
                },
                'smooth'
              )
            }, 150)
          }, 1000)
        }}
      >
        Ask the bot a question!
      </button>
    </div>
  )
}

render(<App />)
```
