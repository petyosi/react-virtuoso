---
id: virtuoso-message-list-examples-scroll-to-reply
title: Virtuoso Message List Examples - Scroll to Reply
sidebar_label: Scroll to Reply
sidebar_position: 6
slug: /virtuoso-message-list/examples/scroll-to-reply
---

# Scroll to Reply


This example showcases a chat with a message that replies to another message. Clicking on the quote icon will scroll the list to the replied message and highlight it. The index of the replied message is retrieved with the `data.findIndex` method. The `align` property is set to `start` to make the replied message visible at the top of the viewport.


```tsx live noInline
interface Message {
  key: string
  text: string
  user: 'me' | 'other'
  replyTo?: string
  highlighted?: boolean
}

let idCounter = 0

function randomMessage(user: Message['user']): Message {
  const message: Message = { user, key: `${idCounter++}`, text: randPhrase({ min: 8, max: 10 }) }
  if (idCounter == 20) {
    message.replyTo = '3'
  }
  return message
}

const ItemContent: VirtuosoMessageListProps<Message, null>['ItemContent'] = ({ data }) => {
  const methods = useVirtuosoMethods<Message>()
  const replyTo = data.replyTo ? methods.data.find((item) => item.key === data.replyTo) : null
  return (
    <div style={{ paddingBottom: '2rem', display: 'flex' }}>
      <div
        style={{
          fontSize: '0.8rem',
          maxWidth: '50%',
          marginLeft: data.user === 'me' ? 'auto' : undefined,
          backgroundColor: data.highlighted ? 'yellow' : data.user === 'me' ? 'lightblue' : 'lightgreen',
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
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
            onClick={() => {
              // highlight the item after 100ms so that the transition is visible
              setTimeout(() => {
                methods.data.map((item) => {
                  if (item.key === data.replyTo) {
                    return { ...item, highlighted: true }
                  } else {
                    return item
                  }
                })
              }, 100)

              // remove the highlight after 2 seconds
              setTimeout(() => {
                methods.data.map((item) => {
                  if (item.key === data.replyTo) {
                    return { ...item, highlighted: false }
                  } else {
                    return item
                  }
                })
              }, 2000)

              const replyToIndex = methods.data.findIndex((item) => item.key === data.replyTo)
              methods.scrollToItem({ index: replyToIndex, align: 'start' })
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

function App() {
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
          const author = ['me', 'other'][index % 2 ? 0 : 1]
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
          return randomMessage(author as any)
        })
      )
    })
  }, [])
  return (
    <>
      <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList<Message, null>
        ref={virtuoso}
        style={{ height: 400 }}
        computeItemKey={({ data }) => data.key}
        initialLocation={{ index: 'LAST', align: 'end' }}
        ItemContent={ItemContent}
      />
      </VirtuosoMessageListLicense>
    </>
  )
}

render(<App />)
```

## Scroll to a message that's not loaded

In case the reply message is not loaded, the `scrollToItem` method will not work. To handle that case, you need to first "jump" to the set of messages that contain the replied message. To see a complete example on how to do this, check out the [jump-to-replied](https://github.com/virtuoso-dev/message-list-jump-to-replied) GitHub repository, where jumping to a message is implemented using the Redux Toolkit state management library. 
