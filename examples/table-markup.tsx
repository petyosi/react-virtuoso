import * as React from 'react'
import { TableVirtuoso } from '../src/'

export default function App() {
  return (
    <>
      <div style={{ height: 200 }}>Top content</div>
      <TableVirtuoso
        totalCount={1000}
        style={{ height: 700 }}
        fixedHeaderContent={() => {
          return (
            <tr style={{ background: 'white' }}>
              <th key={1} style={{ height: 200, border: '1px solid black', background: 'white' }}>
                TH 1
              </th>
              <th key={2} style={{ height: 200, border: '1px solid black', background: 'white' }}>
                TH meh
              </th>
            </tr>
          )
        }}
        itemContent={(index) => {
          return (
            <>
              <td>{index}Cell 1</td>
              <td>Cell 2</td>
            </>
          )
        }}
      />
    </>
  )
}
