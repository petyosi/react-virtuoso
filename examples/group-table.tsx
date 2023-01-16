import React, { useMemo } from 'react'
import { GroupedTableVirtuoso } from '../src/'

export default function App() {
  const groupCounts = useMemo(() => {
    return Array(1000).fill(10) as number[]
  }, [])

  return (
    <GroupedTableVirtuoso
      groupCounts={groupCounts}
      style={{ height: 700 }}
      fixedHeaderContent={() => {
        return (
          <tr style={{ background: 'white', textAlign: 'left' }}>
            <th key={1} style={{ width: '140px' }}>
              Item index
            </th>
            <th key={2} style={{ width: '140px' }}>
              Greetings
            </th>
          </tr>
        )
      }}
      itemContent={(index) => {
        return (
          <>
            <td style={{ height: 21 }}>{index}</td>
            <td style={{ height: 21 }}>Hello</td>
          </>
        )
      }}
      groupContent={(index) => {
        return (
          <>
            <td style={{ height: 21, background: 'white' }}>Group {index}</td>
            <td style={{ height: 21, background: 'white' }} />
          </>
        )
      }}
    />
  )
}
