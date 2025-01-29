import { GroupedVirtuoso } from '../src'

export function Example() {
  return (
    <GroupedVirtuoso
      groupContent={(index) => <div style={{ backgroundColor: 'gray', height: '30px' }}>Group {index}</div>}
      groupCounts={Array.from({ length: 20 }).fill(3) as number[]}
      itemContent={(index) => <div style={{ height: '20px' }}>Item {index}</div>}
      style={{ height: '300px' }}
      useWindowScroll
    />
  )
}
