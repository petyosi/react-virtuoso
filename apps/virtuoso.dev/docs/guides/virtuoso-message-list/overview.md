---
id: virtuoso-message-list
title: Virtuoso Message List
sidebar_label: Overview
sidebar_position: 1
slug: /virtuoso-message-list
---

# Virtuoso Message List

The Virtuoso message list component is built specifically for human/chatbot conversations. In addition to the virtualized rendering, the component exposes declarative and imperative data/scroll position API that gives you the necessary control over the scroll position when older messages are loaded, new messages arrive, and when the user submits a message. The scroll position can update instantly or with a smooth scroll animation.

You can specify custom components as header, footer, sticky header, or sticky footer, for loading messages, scroll to bottom indicators, and new message notifications. You can also control the vertical positioning for short conversations that don't fill the viewport.

Apart from the structural styling necessary for the virtualized rendering, the component is completely unstyled. You can easily integrate it with your design system and UI component library of choice.

## Live Example

```tsx live
import {
  VirtuosoMessageListProps,
  VirtuosoMessageListMethods,
  VirtuosoMessageListLicense,
  VirtuosoMessageList,
} from '@virtuoso.dev/message-list'
import { randTextRange, randPhrase } from '@ngneat/falso'
import { useRef, useMemo, useState } from 'react'

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
          maxWidth: '60%',
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
  const virtuoso = useRef<VirtuosoMessageListMethods<Message>>(null)
  const [data, setData] = useState<VirtuosoMessageListProps<Message, null>['data']>(() => {
    return {
      data: Array.from({ length: 100 }, (_, index) => randomMessage(index % 2 === 0 ? 'me' : 'other')),
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
    <div className="wide-example" style={{ height: 500, display: 'flex', flexDirection: 'column', fontSize: '70%' }}>
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList<Message, null>
          data={data}
          ref={virtuoso}
          style={{ flex: 1 }}
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
              data: [...current.data, myMessage],
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
                data: [...current.data, botMessage],
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
                  data: current.data.map((message) => {
                    return message.key === botMessage.key ? { ...message, text: message.text + ' ' + randPhrase() } : message
                  }),
                  // scroll modifier that will make the list autoscroll when the bot response overflows the viewport.
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

## License

The `@virtuoso.dev/message-list` package is distributed under a commercial license. See [Licensing](/virtuoso-message-list/licensing) for more details.

## Installation

The message list component is distributed as an NPM package. Install `@virtuoso.dev/message-list` in your React project.

```bash
npm install @virtuoso.dev/message-list
```

Then, add the component along with your license to your application.

```tsx live
import { VirtuosoMessageListLicense, VirtuosoMessageList, VirtuosoMessageListProps } from '@virtuoso.dev/message-list'
import { useMemo } from 'react'

// const licenseKey = 'your-license-key'
const licenseKey = ''

export default function App() {
  const data = useMemo<VirtuosoMessageListProps<{ id: number; content: string }, null>['data']>(() => {
    return {
      data: Array.from({ length: 100 }, (_, index) => ({ id: index, content: `Message ${index}` })),
      scrollModifier: {
        type: 'item-location',
        location: {
          index: 'LAST',
          align: 'end',
        },
      },
    }
  }, [])

  return (
    <VirtuosoMessageListLicense licenseKey={licenseKey}>
      <VirtuosoMessageList style={{ height: '100%' }} data={data} ItemContent={({ data }) => <div>{data.content}</div>} />
    </VirtuosoMessageListLicense>
  )
}
```

To explore the features in an interactive way, you can jump straight to [Virtuoso Message List Tutorial](/virtuoso-message-list/tutorial/intro).

## Features at a Glance

The chat interface has a certain set of specifics - a live flow of new messages, scroll location updating when new messages arrive, message updates, etc. The `VirtuosoMessageList` component API is designed to handle these scenarios, while using the virtualized rendering approach.

### Virtualized Rendering

Out of the box, the component tracks the viewport and the items heights and renders only the items that are visible. This allows you to display thousands of messages without performance issues. You don't need to adjust anything or measure the items' heights manually.

### Data Management and Scroll Position Control

The `data` property of the component includes the data it should render and a optional `scrollModifier` object that specifies the location and the scroll behavior to apply when the data changes. For example, when the user submits a message, you append the new message to the exiting data set, and scroll to the bottom instantly or with a smooth scroll animation. A different behavior may be applied when messages from other users arrive, or when a chatbot response is updated.

More details about the scroll modifier type and its usage can be found in the [Scroll Modifier](/virtuoso-message-list/scroll-modifier) section.

### Customizable Rendering

The component accepts custom components as header, footer, sticky header, or sticky footer. This allows you to display loading messages, scroll to bottom indicators, and new message notifications. Optionally, the sticky header/footer can overlay the message items if needed.

For interactive examples of headers and footers, refer to the [Headers and Footers](/virtuoso-message-list/headers-footers) section.
