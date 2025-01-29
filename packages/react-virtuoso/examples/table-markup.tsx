import * as React from 'react'

import { TableVirtuoso, TableVirtuosoHandle } from '../src/'

export function Example() {
  const ref = React.useRef<TableVirtuosoHandle>(null)
  return (
    <>
      <TableVirtuoso
        components={{
          EmptyPlaceholder: () => {
            return (
              <tbody>
                <tr>
                  <td>Empty</td>
                </tr>
              </tbody>
            )
          },
        }}
        fixedFooterContent={() => {
          return (
            <tr style={{ background: 'white' }}>
              <th key={1} style={{ background: 'white', border: '1px solid black', height: 150 }}>
                Footer TH 1
              </th>
              <th key={2} style={{ background: 'white', border: '1px solid black', height: 150 }}>
                Footer TH meh
              </th>
            </tr>
          )
        }}
        fixedHeaderContent={() => {
          return (
            <tr style={{ background: 'white' }}>
              <th key={1} style={{ background: 'white', border: '1px solid black', height: 150 }}>
                TH 1
              </th>
              <th key={2} style={{ background: 'white', border: '1px solid black', height: 150 }}>
                TH meh
              </th>
            </tr>
          )
        }}
        itemContent={(index) => {
          return (
            <>
              <td style={{ height: 21 }}>{index}Cell 1</td>
              <td style={{ height: 21 }}>Cell 2</td>
            </>
          )
        }}
        ref={ref}
        style={{ height: 700 }}
        totalCount={1000}
      />
      <button
        onClick={() =>
          ref.current?.scrollToIndex({
            align: 'start',
            index: 900,
          })
        }
      >
        scroll 900 start
      </button>
      <button
        onClick={() =>
          ref.current?.scrollToIndex({
            align: 'end',
            index: 900,
          })
        }
      >
        scroll 900 end
      </button>

      <button
        onClick={() =>
          ref.current?.scrollToIndex({
            align: 'center',
            index: 900,
          })
        }
      >
        scroll 900 center
      </button>
      <button
        onClick={() =>
          ref.current?.scrollIntoView({
            index: 50,
          })
        }
      >
        scroll 50 into view
      </button>
      <p>Buttons should align 900 correctly </p>
    </>
  )
}
