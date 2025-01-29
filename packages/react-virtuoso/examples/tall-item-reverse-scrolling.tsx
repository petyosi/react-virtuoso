import { Virtuoso } from '../src'

export function Example() {
  return (
    <Virtuoso
      initialTopMostItemIndex={99}
      itemContent={(index) => (
        <div style={{ border: '1px solid black' }}>
          Item {index}
          <div>
            {Array.from({ length: index % 2 ? 3 : 20 }, (_, i) => (
              <div key={i}>Line {i}</div>
            ))}
          </div>
        </div>
      )}
      style={{ height: 300 }}
      totalCount={100}
    />
  )
}
