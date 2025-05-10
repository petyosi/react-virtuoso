---
id: virtuoso-message-list
title: Virtuoso Message List
sidebar_label: Overview
sidebar_position: 1
slug: /virtuoso-message-list
---

# Virtuoso Message List

The Virtuoso message list component is built specifically for human/chatbot conversations. In addition to the virtualized rendering, the component exposes an imperative data management API that gives you the necessary control over the scroll position when older messages are loaded, new messages arrive, and when the user submits a message. The scroll position can update instantly or with a smooth scroll animation.

You can specify custom components as header, footer, sticky header, or sticky footer, for loading messages, scroll to bottom indicators, and new message notifications. You can also control the vertical positioning for short conversations that don't fill the viewport.

Apart from the structural styling necessary for the virtualized rendering, the component is completely unstyled. You can easily integrate it with your design system and UI component library of choice.

## Live Example

```tsx live
import { VirtuosoMessageListProps, VirtuosoMessageListMethods, VirtuosoMessageListLicense, VirtuosoMessageList } from '@virtuoso.dev/message-list'
import { randTextRange, randPhrase } from '@ngneat/falso'
import {useRef} from 'react'

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

  return (
    <div className="wide-example" style={{ height: 500, display: 'flex', flexDirection: 'column', fontSize: '70%' }}>
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList<Message, null>
          initialData={Array.from({ length: 100 }, (_, index) => randomMessage(index % 2 === 0 ? 'me' : 'other'))}
          ref={virtuoso}
          style={{ flex: 1 }}
          computeItemKey={({ data }) => data.key}
          initialLocation={{ index: 'LAST', align: 'end' }}
          ItemContent={ItemContent}
        />
      </VirtuosoMessageListLicense>

      <button
        style={{marginTop: '1rem', fontSize: '1.1rem', padding: '1rem' }}
        onClick={(e) => {
          (e.target as HTMLButtonElement).disabled = true
          const myMessage = randomMessage('me')
          virtuoso.current?.data.append([myMessage], ({ scrollInProgress, atBottom }) => {
            return {
              index: 'LAST',
              align: 'start',
              behavior: atBottom || scrollInProgress ? 'smooth' : 'auto',
            }
          })

          setTimeout(() => {
            const botMessage = randomMessage('other')
            virtuoso.current?.data.append([botMessage])

            let counter = 0
            const interval = setInterval(() => {
              if (counter++ > 20) {
                clearInterval(interval);
                (e.target as HTMLButtonElement).disabled = false
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
import { VirtuosoMessageListLicense, VirtuosoMessageList } from '@virtuoso.dev/message-list'

// const licenseKey = 'your-license-key'
const licenseKey = ''

export default function App() {
  return (
    <VirtuosoMessageListLicense licenseKey={licenseKey}>
      <VirtuosoMessageList
        style={{height: '100%'}}
        initialLocation={{ index: 'LAST', align: 'end' }}
        initialData={Array.from({length: 100}, (_, index) => ({ id: index, content: `Message ${index}` }))}
        ItemContent={({ data }) => <div>{data.content}</div>}
      />
    </VirtuosoMessageListLicense>
  )
}


```

To explore the features in an interactive way, you can jump straight to [Virtuoso Message List Tutorial](/virtuoso-message-list/tutorial/intro).

## Features at a Glance

The chat interface has a certain set of specifics - a live flow of new messages, scroll location updating when new messages arrive, message updates, etc. The `VirtuosoMessageList` component API is designed to handle these scenarios, while using the virtualized rendering approach.

### Virtualized Rendering

Out of the box, the component tracks the viewport and the items heights and renders only the items that are visible. This allows you to display thousands of messages without performance issues. You don't need to adjust anything or measure the items' heights manually.

### Imperative Data Management API

The component starts with an optional initial data set, passed through the `initialData` prop. Any subsequent data updates are handled through the component `data` methods API, giving you precise control over the scroll position adjustment necessary. For example, when the user submits a message, you append the new message to the exiting data set, and scroll to the bottom instantly or with a smooth scroll animation. A different behavior may be applied when messages from other users arrive, or when a chatbot response is updated.

:::info
#### What is an imperative API and why does the message list uses it?

There are two ways to work with React components - the imperative way and the declarative way. In the declarative way, you describe the UI based on the current state, and React takes care of updating the UI when the state changes.

The imperative API method works by creating a ref object with `useRef` and then passing it to the component. Afterwards, the `ref.current` object exposes the methods to interact with the component. This approach is necessary for the message list component because it needs to handle the scroll position in a specific way when new messages arrive, or when the user submits a message.

#### Why not just pass an updated data set to the component?

In the case of the message list, an updated data prop may have different underlying reasons - new incoming messages, older messages being loaded, or existing messages being updated (for example, someone liked a message). Reverse-engineering the intent from the data set is not always possible, and it's not always clear how the scroll position should be adjusted. The imperative API gives you the necessary control over the scroll position adjustment that the current data set change should cause.

#### Should I keep the data in my component state?

Yes, you should do that if your use case includes mounting/unmounting the component. You can pass the data state to the `initialData` prop, it will be picked up in the initial render.
:::


To learn more about the data management API, refer to the [Data Management](/virtuoso-message-list/working-with-data) section.

### Customizable Rendering

The component accepts custom components as header, footer, sticky header, or sticky footer. This allows you to display loading messages, scroll to bottom indicators, and new message notifications. Optionally, the sticky header/footer can overlay the message items if needed.

For interactive examples of headers and footers, refer to the [Headers and Footers](/virtuoso-message-list/headers-footers) section.
