---
id: virtuoso-message-list-examples-date-separators
title: Virtuoso Message List Examples - Date Separators
sidebar_label: Date Separators
sidebar_position: 5
slug: /virtuoso-message-list/examples/date-separators
---

# Date Separators

Date separators are an useful addition to long conversations, making it easier for the user to follow the conversation flow.
The message list component allows you to implement separators in the ItemContent message by passing `prevData` and `nextData` props.

In addition to the separators, you might want to display a sticky date header, which is always visible when the messages are scrolled.
To achieve this, you can use the `useCurrentlyRenderedData` hook to get the first message and display the date of the first message.

The example below demonstrates how to implement date separators in a message list.

```tsx live
import { useMemo } from 'react'
import {
  VirtuosoMessageList,
  VirtuosoMessageListLicense,
  VirtuosoMessageListProps,
  useCurrentlyRenderedData,
  DataWithScrollModifier,
} from '@virtuoso.dev/message-list'
import { randTextRange, rand } from '@ngneat/falso'

interface Message {
  key: string
  text: string
  user: 'me' | 'other'
  date: Date
}

let idCounter = 0

// fake consecutive dates for the messages
const startDate = new Date()
startDate.setDate(startDate.getDate() - 50)

function randomMessage(user: Message['user']): Message {
  return {
    user,
    key: `${idCounter++}`,
    date: new Date(startDate.getTime() + idCounter * 1000 * 60 * 60 * 4),
    text: randTextRange({ min: user === 'me' ? 20 : 100, max: 200 }),
  }
}

const StickyHeader: VirtuosoMessageListProps<Message, null>['StickyHeader'] = () => {
  const firstItem = useCurrentlyRenderedData<{ date: Date }>()[0] as { date: Date } | undefined
  return (
    <div style={{ width: '100%', position: 'absolute', top: 0 }}>
      <div style={{ textAlign: 'center', fontWeight: 300 }}>
        <span
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'var(--alt-background)',
            padding: '0.1rem 2rem',
            borderRadius: '0.5rem',
          }}
        >
          {firstItem?.date.toDateString()}
        </span>
      </div>
    </div>
  )
}

const ItemContent: VirtuosoMessageListProps<Message, null>['ItemContent'] = ({ data, prevData }) => {
  const dateSeparator =
    !prevData || prevData.date.getDate() !== data.date.getDate() ? (
      <div style={{ padding: '0.5rem 0' }}>
        <div style={{ textAlign: 'center', fontWeight: 300 }}>
          <span
            style={{
              backgroundColor: 'var(--alt-background)',
              border: '1px solid var(--border)',
              padding: '0.1rem 2rem',
              borderRadius: '0.5rem',
            }}
          >
            {data.date.toDateString()}
          </span>
        </div>
      </div>
    ) : null

  return (
    <>
      {dateSeparator}
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
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              padding: '1rem',
            }}
          >
            {data.text}
          </div>
        </div>
      </div>
    </>
  )
}

export default function App() {
  const data = useMemo<DataWithScrollModifier<Message>>(
    () => ({
      data: Array.from({ length: 100 }, () => randomMessage(rand(['me', 'other']))),
      scrollModifier: { type: 'item-location', location: { index: 'LAST', align: 'end' } },
    }),
    []
  )

  return (
    <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList<Message, null>
        data={data}
        style={{ height: '100%', fontSize: '90%' }}
        computeItemKey={({ data }) => data.key}
        ItemContent={ItemContent}
        StickyHeader={StickyHeader}
      />
    </VirtuosoMessageListLicense>
  )
}
```
