import { GroupedVirtuoso } from '../src/'

export function Example() {
  return (
    <>
      <p>Scroll fast, groups should be green placeholders</p>
      <GroupedVirtuoso
        components={{
          ScrollSeekPlaceholder: ({ height, index, type }) => (
            <div style={{ color: type === 'group' ? 'green' : 'red', height }}>Placeholder {index}</div>
          ),
        }}
        computeItemKey={(key) => `item-${key}`}
        groupContent={(index) => <div style={{ height: '30px' }}>Group {index}</div>}
        groupCounts={Array.from({ length: 20 }).fill(20) as number[]}
        itemContent={(index) => <div style={{ height: '20px' }}>Item {index}</div>}
        scrollSeekConfiguration={{
          enter: (velocity) => Math.abs(velocity) > 200,
          exit: (velocity) => Math.abs(velocity) < 30,
        }}
        style={{ height: 800 }}
      />
    </>
  )
}
