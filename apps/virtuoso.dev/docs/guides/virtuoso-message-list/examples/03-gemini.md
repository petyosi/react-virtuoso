---
id: virtuoso-message-list-examples-gemini
title: Virtuoso Message List Examples - Gemini-like Chatbot Scroll
sidebar_label: Gemini-like Chatbot Scroll
sidebar_position: 3
slug: /virtuoso-message-list/examples/gemini
---

# Gemini-like Chatbot Scroll

The example below simulates a conversation with a chatbot. The scroll behavior simulates the Gemini chatbot, where each new question is scrolled to the top, so that a space is preallocated for the answer. The streaming response is simulated with `setInterval`.

## Key Points

- Each question gets aligned to the top of the viewport when it is sent.
- The `data.map` method is used to stream the incoming response.
- The `autoscrollToBottomBehavior` is set to `smooth` to animate the scroll when the streaming response scroll beyond the visible area.

## Live Example

```tsx live
import { useState } from 'react'
import {
  VirtuosoMessageList,
  VirtuosoMessageListProps,
  VirtuosoMessageListMethods,
  VirtuosoMessageListLicense,
} from '@virtuoso.dev/message-list'
import { randTextRange, randPhrase } from '@ngneat/falso'

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
          border: '1px solid var(--border)',
          background: ownMessage ? 'var(--background)' : 'var(--alt-background)',
          color: 'var(--foreground)',
          borderRadius: '1rem',
          padding: '1rem',
        }}
      >
        {data.text}
      </div>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState<VirtuosoMessageListProps<Message, null>['data']>(() => {
    data: []
  })

  return (
    <div className="tall-example" style={{ height: 500, display: 'flex', flexDirection: 'column', fontSize: '70%' }}>
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList<Message, null>
          style={{ flex: 1 }}
          data={data}
          computeItemKey={({ data }) => data.key}
          ItemContent={ItemContent}
        />
      </VirtuosoMessageListLicense>

      <button
        style={{ marginTop: '1rem', fontSize: '1.1rem', padding: '1rem' }}
        onClick={(e) => {
          ;(e.target as HTMLButtonElement).disabled = true
          setData((current) => {
            const myMessage = randomMessage('me')
            return {
              data: [...(current?.data ?? []), myMessage],
              scrollModifier: {
                type: 'auto-scroll-to-bottom',
                autoScroll: ({ scrollInProgress, atBottom }) => {
                  return {
                    index: 'LAST',
                    align: 'start',
                    behavior: atBottom || scrollInProgress ? 'smooth' : 'auto',
                  }
                },
              },
            }
          })

          setTimeout(() => {
            const botMessage = randomMessage('other')
            setData((current) => {
              return {
                data: [...(current?.data ?? []), botMessage],
              }
            })

            let counter = 0
            const interval = setInterval(() => {
              if (counter++ > 20) {
                clearInterval(interval)
                ;(e.target as HTMLButtonElement).disabled = false
              }

              setData((current) => {
                return {
                  data: (current?.data ?? []).map((message) => {
                    return message.key === botMessage.key
                      ? { user: message.user, key: message.key, text: `${message.text} ${randPhrase()}` }
                      : message
                  }),
                  scrollModifier: {
                    type: 'items-change',
                    behavior: 'smooth',
                  },
                }
              })
            }, 150)
          }, 1000)
        }}
      >
        Ask the bot a question!
      </button>
    </div>
  )
}
```
