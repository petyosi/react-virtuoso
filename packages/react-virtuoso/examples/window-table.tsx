import * as React from 'react'
import { TableVirtuoso } from '../src/'

export function Example() {
  return (
    <div style={{ paddingTop: 100, paddingBottom: 100 }}>
      <p>red background should match the size of the table</p>
      <div style={{ background: 'red' }}>
        <TableVirtuoso
          totalCount={100}
          useWindowScroll
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
          fixedHeaderContent={() => {
            return (
              <tr style={{ background: 'white' }}>
                <th key={1} style={{ height: 50, border: '1px solid black', background: 'white' }}>
                  TH 1
                </th>
                <th key={2} style={{ height: 50, border: '1px solid black', background: 'white' }}>
                  TH meh
                </th>
              </tr>
            )
          }}
          itemContent={(index) => {
            return (
              <>
                <td style={{ height: 30 }}>{index}Cell 1</td>
                <td>Cell 2</td>
              </>
            )
          }}
        />
      </div>
    </div>
  )
}
