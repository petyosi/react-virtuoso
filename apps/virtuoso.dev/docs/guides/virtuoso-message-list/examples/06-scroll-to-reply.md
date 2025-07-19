---
id: virtuoso-message-list-examples-scroll-to-reply
title: Virtuoso Message List Examples - Scroll to Reply
sidebar_label: Scroll to Reply
sidebar_position: 6
slug: /virtuoso-message-list/examples/scroll-to-reply
---

# Scroll to Reply

This example showcases a chat with a message that replies to another message. Clicking on the quoted content will scroll the list to the replied message and highlight it. The index of the replied message is retrieved with the `data.findIndex` method. The `align` property is set to `start` to make the replied message visible at the top of the viewport.

```tsx live
import { useState, useCallback } from 'react'
import {
  VirtuosoMessageList,
  VirtuosoMessageListLicense,
  VirtuosoMessageListProps,
  VirtuosoMessageListMethods,
  DataWithScrollModifier,
  useVirtuosoMethods,
} from '@virtuoso.dev/message-list'
import { randPhrase, randTextRange } from '@ngneat/falso'

interface Message {
  key: string
  text: string
  user: 'me' | 'other'
  replyTo?: string
  highlighted?: boolean
}

interface MessageListContext {
  scrollAndHighlight: (key: Message['key']) => void
}

let idCounter = 0

function randomMessage(user: Message['user']): Message {
  const message: Message = { user, key: `${idCounter++}`, text: randTextRange({ min: user === 'me' ? 20 : 100, max: 200 }) }
  if (idCounter % 18 === 0) {
    message.replyTo = (idCounter - 12).toString() // reply to a message 15 messages above
  }
  return message
}

const ItemContent: VirtuosoMessageListProps<Message, MessageListContext>['ItemContent'] = ({ data, context }) => {
  const methods = useVirtuosoMethods<Message>()
  const replyTo = data.replyTo ? methods.data.find((item) => item.key === data.replyTo) : null
  return (
    <div style={{ paddingBottom: '2rem', display: 'flex' }}>
      <div
        style={{
          fontSize: '0.8rem',
          maxWidth: '50%',
          marginLeft: data.user === 'me' ? 'auto' : undefined,
          backgroundColor: data.highlighted ? 'var(--highlight)' : data.user === 'me' ? 'var(--background)' : 'var(--alt-background)',
          transition: 'background-color 0.5s',
          borderRadius: '1rem',
          padding: '1rem',
        }}
      >
        {replyTo ? (
          <div
            style={{
              width: '80%',
              marginBottom: '1rem',
              backgroundColor: 'var(--alt-background)',
              borderRadius: '1rem',
              padding: '1rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
            onClick={() => {
              context.scrollAndHighlight(data.replyTo!)
            }}
          >
            {replyTo.text}
          </div>
        ) : null}
        {data.text}
        <br />
      </div>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState<DataWithScrollModifier<Message>>(() => {
    return {
      data: Array.from({ length: 20 }, (_, index) => {
        const author = ['me', 'other'][index % 2 ? 0 : 1]
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

  const virtuoso = React.useRef<VirtuosoMessageListMethods<Message>>(null)

  const scrollAndHighlight = useCallback(
    (itemKey: Message['key']) => {
      // highlight the item after 100ms so that the transition is visible
      setTimeout(() => {
        setData((prev) => ({
          data: (prev?.data ?? []).map((item) => {
            if (item.key === itemKey) {
              return { ...item, highlighted: true }
            }
            return item
          }),
        }))
      }, 100)

      // remove the highlight after 2 seconds
      setTimeout(() => {
        setData((prev) => ({
          data: (prev?.data ?? []).map((item) => {
            if (item.key === itemKey) {
              return { ...item, highlighted: false }
            }
            return item
          }),
        }))
      }, 2000)

      const replyToIndex = (data.data ?? []).findIndex((item) => item.key === itemKey)

      virtuoso.current?.scrollToItem({
        index: replyToIndex,
        align: 'center',
        behavior: 'smooth',
        done: () => {
          console.log('scrolled to item', replyToIndex)
        },
      })
    },
    [data]
  )

  return (
    <div className="tall-example" style={{ height: '100%', fontSize: '70%' }}>
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList<Message, MessageListContext>
          ref={virtuoso}
          style={{ height: '100%' }}
          context={{ scrollAndHighlight }}
          computeItemKey={({ data }) => data.key}
          data={data}
          ItemContent={ItemContent}
        />
      </VirtuosoMessageListLicense>
    </div>
  )
}
```

## Scroll to a message that's not loaded

In case the reply message is not loaded, the `scrollToItem` method will not work. To handle that case, you need to first "jump" to the set of messages that contain the replied message. To see a complete example on how to do this, check out the [jump-to-replied](https://github.com/virtuoso-dev/message-list-jump-to-replied) GitHub repository, where jumping to a message is implemented using the Redux Toolkit state management library.
