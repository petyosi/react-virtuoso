import * as React from 'react'
import { TableVirtuoso, TableVirtuosoHandle } from '../src/'

export default function App() {
  const ref = React.useRef<TableVirtuosoHandle>(null)
  return (
    <>
      <TableVirtuoso
        ref={ref}
        totalCount={1000}
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
        style={{ height: 700 }}
        fixedHeaderContent={() => {
          return (
            <tr style={{ background: 'white' }}>
              <th key={1} style={{ height: 150, border: '1px solid black', background: 'white' }}>
                TH 1
              </th>
              <th key={2} style={{ height: 150, border: '1px solid black', background: 'white' }}>
                TH meh
              </th>
            </tr>
          )
        }}
        fixedFooterContent={() => {
          return (
            <tr style={{ background: 'white' }}>
              <th key={1} style={{ height: 150, border: '1px solid black', background: 'white' }}>
                Footer TH 1
              </th>
              <th key={2} style={{ height: 150, border: '1px solid black', background: 'white' }}>
                Footer TH meh
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
      />
      <button
        onClick={() =>
          ref.current.scrollToIndex({
            index: 900,
            align: 'start',
          })
        }
      >
        scroll 900 start
      </button>
      <button
        onClick={() =>
          ref.current.scrollToIndex({
            index: 900,
            align: 'end',
          })
        }
      >
        scroll 900 end
      </button>

      <button
        onClick={() =>
          ref.current.scrollToIndex({
            index: 900,
            align: 'center',
          })
        }
      >
        scroll 900 center
      </button>
      <p>Buttons should align 900 correctly </p>
    </>
  )
}
