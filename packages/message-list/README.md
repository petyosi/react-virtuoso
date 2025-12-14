# Virtuoso Message List

[![npm version](https://img.shields.io/npm/v/@virtuoso.dev/message-list.svg)](https://www.npmjs.com/package/@virtuoso.dev/message-list) [![npm downloads](https://img.shields.io/npm/dm/@virtuoso.dev/message-list.svg)](https://www.npmjs.com/package/@virtuoso.dev/message-list) [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A virtualized message list component for React, built specifically for human/chatbot conversations.

## Features

- **Virtualized rendering** - renders only visible items for optimal performance with large message histories
- **Declarative scroll control** - scroll position updates via data property with optional smooth animation
- **Automatic scroll on new messages** - configurable auto-scroll behavior when messages arrive or update
- **Customizable components** - header, footer, sticky header/footer, loading indicators, scroll-to-bottom buttons
- **Flexible positioning** - control vertical positioning for short conversations that don't fill the viewport
- **Unstyled by default** - easily integrate with your design system and UI component library

## License

The `@virtuoso.dev/message-list` package is distributed under a commercial license.

## Installation

```bash
npm install @virtuoso.dev/message-list
```

## Quick Start

```tsx
import { VirtuosoMessageListLicense, VirtuosoMessageList, VirtuosoMessageListProps } from '@virtuoso.dev/message-list'
import { useMemo } from 'react'

const licenseKey = 'your-license-key'

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

## Links

- [Documentation](https://virtuoso.dev/message-list/)
- [API Reference](https://virtuoso.dev/message-list/api-reference/)
- [Contributing](https://github.com/petyosi/react-virtuoso/blob/master/CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
