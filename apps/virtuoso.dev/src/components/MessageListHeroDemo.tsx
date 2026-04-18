import { useRef, useState } from 'react'

import { randPhrase, randTextRange } from '@ngneat/falso'
import { VirtuosoMessageList, VirtuosoMessageListLicense } from '@virtuoso.dev/message-list'

import type { VirtuosoMessageListMethods, VirtuosoMessageListProps } from '@virtuoso.dev/message-list'

interface Message {
  key: string
  text: string
  user: 'me' | 'other'
}

let idCounter = 0

function randomMessage(user: Message['user']): Message {
  return { key: `${idCounter++}`, text: randTextRange({ max: 200, min: user === 'me' ? 20 : 100 }), user }
}

const ItemContent: VirtuosoMessageListProps<Message, null>['ItemContent'] = ({ data }) => {
  const ownMessage = data.user === 'me'
  return (
    <div className="flex pb-4">
      <div
        className={`
          max-w-[60%] rounded-2xl border border-gray-300 p-4 text-sm
          dark:border-gray-700
          ${
            ownMessage
              ? `
                ml-auto bg-gray-100
                dark:bg-gray-800
              `
              : `
                bg-white
                dark:bg-gray-900
              `
          }
        `}
      >
        {data.text}
      </div>
    </div>
  )
}

export default function MessageListHeroDemo() {
  const virtuoso = useRef<VirtuosoMessageListMethods<Message>>(null)
  const [data, setData] = useState<VirtuosoMessageListProps<Message, null>['data']>(() => {
    return {
      data: Array.from({ length: 100 }, (_, index) => randomMessage(index % 2 === 0 ? 'me' : 'other')),
      scrollModifier: {
        location: {
          align: 'end',
          index: 'LAST',
        },
        type: 'item-location',
      },
    }
  })

  return (
    <div className="not-content flex h-96 w-full flex-col">
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList<Message, null>
          className={`
            flex-1 border border-gray-300 bg-gray-50
            dark:border-gray-700 dark:bg-gray-900
          `}
          computeItemKey={({ data: item }) => item.key}
          data={data}
          ItemContent={ItemContent!}
          ref={virtuoso}
        />
      </VirtuosoMessageListLicense>

      <button
        className={`
          mt-3 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white
          transition-colors
          hover:bg-gray-700
          dark:bg-gray-700 dark:hover:bg-gray-600
        `}
        onClick={(e) => {
          // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
          ;(e.target as HTMLButtonElement).disabled = true
          setData((current) => {
            const myMessage = randomMessage('me')
            return {
              data: [...(current?.data ?? []), myMessage],
              scrollModifier: {
                autoScroll: ({ atBottom, scrollInProgress }) => {
                  return {
                    align: 'start',
                    behavior: atBottom || scrollInProgress ? 'smooth' : 'auto',
                    index: 'LAST',
                  }
                },
                type: 'auto-scroll-to-bottom',
              },
            }
          })

          setTimeout(() => {
            const botMessage = randomMessage('other')
            setData((current) => {
              return {
                data: [...(current?.data ?? []), botMessage],
              }
            })

            let counter = 0
            const interval = setInterval(() => {
              if (counter++ > 20) {
                clearInterval(interval)
                // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
                ;(e.target as HTMLButtonElement).disabled = false
              }

              setData((current) => {
                const nextData = [...(current?.data ?? [])]
                const botMessageIndex = nextData.findIndex((message) => message.key === botMessage.key)
                if (botMessageIndex !== -1) {
                  const currentBotMessage = nextData[botMessageIndex]!
                  nextData[botMessageIndex] = { ...currentBotMessage, text: `${currentBotMessage.text} ${randPhrase()}` }
                }

                return {
                  data: nextData,
                  scrollModifier: {
                    behavior: 'smooth',
                    type: 'items-change',
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
