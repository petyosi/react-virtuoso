---
id: virtuoso-message-list-examples-reactions
title: Virtuoso Message List Examples - Reactions
sidebar_label: Reactions
sidebar_position: 4
slug: /virtuoso-message-list/examples/reactions
---

# Reactions

A common problem in messaging interfaces is how to handle reactions to messages. Displaying reactions can change the size of the message element, which can displace the rest of the messages in the list, canceling the automatic scroll behavior when new messages come in. To address this, the `data.map` method has an additional `autoscrollToBottomBehavior` field in the argument, which lets you specify the necessary behavior if the data mapping causes the list to be no longer at the bottom.

:::info
The approach above is not exclusive to reactions - the same principle should be applied to any message state change that will change the message height (for example, expanding details, etc). 
:::

```tsx live 
import { VirtuosoMessageList, VirtuosoMessageListLicense, useVirtuosoMethods, VirtuosoMessageListProps, VirtuosoMessageListMethods } from '@virtuoso.dev/message-list'
import * as React from 'react'
import { randTextRange, rand } from '@ngneat/falso'

interface Message {
  key: string
  text: string
  user: 'me' | 'other'
  liked: boolean
}

let idCounter = 0

function randomMessage(user: Message['user']): Message {
  return { liked: false, user, key: `${idCounter++}`, text: randTextRange({ min: user === 'me' ? 20 : 100, max: 200 }) }
}

const ItemContent: VirtuosoMessageListProps<Message, null>['ItemContent'] = ({ data }) => {
  const methods = useVirtuosoMethods<Message, {}>()
  return (
    <div
      style={{
        paddingBottom: '2rem',
        display: 'flex',
        flexDirection: data.user === 'me' ? 'row-reverse' : 'row',
      }}
    >
      <div
        style={{
          maxWidth: '80%',
          display: 'flex',
          flexDirection: data.user === 'me' ? 'row-reverse' : 'row',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: data.user === 'me' ? '#0253B3' : '#F0F0F3',
            borderRadius: '1rem',
            padding: '1rem',
          }}
        >
          {data.text}
          {data.liked ? <div>❤️</div> : ''}
        </div>
        <button
          style={{ appearance: 'none', border: 'none', background: 'transparent', cursor: 'pointer' }}
          onClick={() => {
            methods.data.map((item) => {
                return item.key === data.key ? { ...item, liked: !item.liked } : item
              }, 
            'smooth')
          }}
        >
          {data.liked ? '❤️' : '🤍'}
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const messages = React.useMemo(() => Array.from({ length: 100 }, () => randomMessage(rand(['me', 'other']))), [])
  const virtuoso = React.useRef<VirtuosoMessageListMethods<Message>>(null)

  return (
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList<Message, null>
          ref={virtuoso}
          initialData={messages}
          style={{ height: '100%' }}
          computeItemKey={({ data }) => data.key}
          initialLocation={{ index: 'LAST', align: 'end' }}
          ItemContent={ItemContent}
        />
      </VirtuosoMessageListLicense>
  )
}

 
```

