import { Virtuoso } from '../src/'

export function Example() {
  return (
    <Virtuoso
      components={{
        ScrollSeekPlaceholder: ({ height, index }) => (
          <div aria-label="placeholder" style={{ color: 'red', height }}>
            Placeholder {index}
          </div>
        ),
      }}
      computeItemKey={(key) => `item-${key}`}
      itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
      scrollSeekConfiguration={{
        enter: (velocity) => Math.abs(velocity) > 200,
        exit: (velocity) => Math.abs(velocity) < 30,
      }}
      style={{ height: 300 }}
      totalCount={1000}
    />
  )
}
