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
import * as React from 'react'
import { VirtuosoMessageList, VirtuosoMessageListLicense, VirtuosoMessageListProps, VirtuosoMessageListMethods } from '@virtuoso.dev/message-list'
import { randTextRange } from './helpers'

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
  const mounted = React.useRef(false)
  const virtuoso = React.useRef<VirtuosoMessageListMethods<Message>>(null)

  React.useEffect(() => {
    if (mounted.current) {
      return
    }
    mounted.current = true

    setTimeout(() => {
      virtuoso.current?.data.append(
        Array.from({ length: 20 }, (_, index) => {
          const author = ['me', 'other'][index % 4 ? 0 : 1]
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
          return randomMessage(author as any)
        })
      )
    })
  }, [])
  return (
    <div class="tall-example" style={{fontSize: '70%'}}>
      <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList<Message, null>
        ref={virtuoso}
        style={{ height: 800 }}
        computeItemKey={({ data }) => data.key}
        initialLocation={{ index: 'LAST', align: 'end' }}
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
                  backgroundColor: data.user === 'me' ? '#0253B3' : '#E6B253',
                  color: data.user === 'me'  ? 'white' : 'black',
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
          virtuoso.current?.data.append([randomMessage('me')], ({ scrollInProgress, atBottom }) => {
            if (atBottom || scrollInProgress) {
              return 'smooth'
            } else {
              return 'auto'
            }
          })
        }}
      >
        Send message
      </button>

      <button
        onClick={() => {
          virtuoso.current?.data.append([randomMessage('other')], ({ scrollInProgress, atBottom }) => {
            if (atBottom || scrollInProgress) {
              return 'smooth'
            } else {
              return false
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

