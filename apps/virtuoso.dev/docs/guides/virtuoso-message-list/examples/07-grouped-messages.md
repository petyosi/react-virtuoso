---
id: virtuoso-message-list-examples-grouped-messages
title: Virtuoso Message List Examples - Grouped Messages
sidebar_label: Grouped Messages
sidebar_position: 7
slug: /virtuoso-message-list/examples/grouped-messages
---

# Grouped Messages

This example showcases a chat that groups consecutive messages from the same user. The `ItemContent` component receives the `nextData` and `prevData` props, which allow you to determine the position of the message in the conversation. Based on the position, the message is styled differently to indicate the start, middle, or end of a message group.

You can use similar approach to render the users' avatars only once per group, or to display the message timestamp at the top of the group.

```tsx live
import { useState } from 'react'
import {
  VirtuosoMessageList,
  VirtuosoMessageListLicense,
  VirtuosoMessageListProps,
  DataWithScrollModifier,
  VirtuosoMessageListMethods,
} from '@virtuoso.dev/message-list'
import { randTextRange } from '@ngneat/falso'

interface Message {
  key: string
  text: string
  user: 'me' | 'other'
}

let idCounter = 0

function randomMessage(user: Message['user']): Message {
  return { user, key: `${idCounter++}`, text: randTextRange({ min: user === 'me' ? 20 : 100, max: 200 }) }
}

export default function App() {
  const [data, setData] = useState<DataWithScrollModifier<Message>>(() => {
    return {
      data: Array.from({ length: 20 }, (_, index) => {
        const author = ['me', 'other'][index % 4 ? 0 : 1]
        // biome-ignore lint/suspicious/noExplicitAny: this is an example
        return randomMessage(author as any)
      }),
      scrollModifier: {
        type: 'item-location',
        location: {
          index: 'LAST',
          align: 'end',
        },
      },
    }
  })
  return (
    <div className="tall-example" style={{ height: '100%', fontSize: '70%' }}>
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList<Message, null>
          data={data}
          style={{ height: '500px', fontSize: '80%' }}
          computeItemKey={({ data }) => data.key}
          ItemContent={({ data, nextData, prevData }) => {
            let groupType = 'none'
            if (nextData && nextData.user === data.user) {
              if (prevData && prevData.user === data.user) {
                groupType = 'middle'
              } else {
                groupType = 'top'
              }
            } else if (prevData && prevData.user === data.user) {
              groupType = 'bottom'
            }

            const borderRadiusStyle = {
              none: '1rem',
              top: '1rem 1rem 0.3rem 0.3rem',
              middle: '0.3rem',
              bottom: '0.3rem 0.3rem 1rem 1rem',
            }[groupType]

            const paddingBottomStyle = {
              none: '2rem',
              top: '0.2rem',
              middle: '0.2rem',
              bottom: '1rem',
            }[groupType]

            return (
              <div style={{ paddingBottom: paddingBottomStyle, display: 'flex' }}>
                <div
                  style={{
                    maxWidth: '50%',
                    marginLeft: data.user === 'me' ? 'auto' : undefined,
                    backgroundColor: data.user === 'me' ? 'var(--background)' : 'var(--alt-background)',
                    color: data.user === 'me' ? 'var(--foreground)' : 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: borderRadiusStyle,
                    padding: '1rem',
                  }}
                >
                  {data.text}
                </div>
              </div>
            )
          }}
        />
      </VirtuosoMessageListLicense>
      <button
        onClick={() => {
          setData((current) => {
            const myMessage = randomMessage('me')
            return {
              data: [...(current?.data ?? []), myMessage],
              scrollModifier: {
                type: 'auto-scroll-to-bottom',
                autoScroll: 'smooth',
              },
            }
          })
        }}
      >
        Send message
      </button>

      <button
        onClick={() => {
          setData((current) => {
            const myMessage = randomMessage('other')
            return {
              data: [...(current?.data ?? []), myMessage],
              scrollModifier: {
                type: 'auto-scroll-to-bottom',
                autoScroll: 'smooth',
              },
            }
          })
        }}
      >
        Receive message
      </button>
    </div>
  )
}
```
