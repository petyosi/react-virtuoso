---
id: virtuoso-message-list-examples-reactions
title: Virtuoso Message List Examples - Reactions
sidebar_label: Reactions
sidebar_position: 4
slug: /virtuoso-message-list/examples/reactions
---

# Reactions

A common problem in messaging interfaces is how to handle reactions to messages. Displaying reactions can increase the size of the message element, which can displace the rest of the messages in the list, canceling the automatic scroll behavior when new messages come in. To address this, the `items-change` scroll modifier allows you to keep the list at the bottom in case it is there and the change of the data causes a size increase.

:::info
The approach above is not exclusive to reactions - the same principle should be applied to any message state change that will change the message height (for example, expanding details, etc).
:::

```tsx live
import {
  ScrollModifier,
  VirtuosoMessageList,
  VirtuosoMessageListLicense,
  useVirtuosoMethods,
  VirtuosoMessageListProps,
  VirtuosoMessageListMethods,
} from '@virtuoso.dev/message-list'
import { useState, useCallback } from 'react'
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

interface MessageListContext {
  toggleLike: (key: Message['key']) => void
}

const InitialDataScrollModifier: ScrollModifier = {
  type: 'item-location',
  location: {
    index: 'LAST',
    align: 'end',
  },
}

const ItemsChangeScrollModifier: ScrollModifier = {
  type: 'items-change',
  // set to auto for instant adjustment
  behavior: 'smooth',
}

const ItemContent: VirtuosoMessageListProps<Message, MessageListContext>['ItemContent'] = ({ data, context }) => {
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
            backgroundColor: data.user === 'me' ? 'var(--background)' : 'var(--alt-background)',
            border: '1px solid var(--border)',
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
            context.toggleLike(data.key)
          }}
        >
          {data.liked ? '❤️' : '🤍'}
        </button>
      </div>
    </div>
  )
}

type MessageListProps = VirtuosoMessageListProps<Message, MessageListContext>

export default function App() {
  const [data, setData] = useState<MessageListProps['data']>(() => {
    return {
      data: Array.from({ length: 100 }, () => randomMessage(rand(['me', 'other']))),
      scrollModifier: InitialDataScrollModifier,
    }
  }, [])

  const toggleLike = useCallback((key: Message['key']) => {
    setData((current) => {
      return {
        data: (current?.data ?? []).map((item) => {
          if (item.key === key) {
            return { ...item, liked: !item.liked }
          }
          return item
        }),
        scrollModifier: ItemsChangeScrollModifier,
      }
    })
  }, [])

  return (
    <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList<Message, MessageListContext>
        data={data}
        context={{ toggleLike }}
        style={{ height: '100%' }}
        computeItemKey={({ data }) => data.key}
        ItemContent={ItemContent}
      />
    </VirtuosoMessageListLicense>
  )
}
```
