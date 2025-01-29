import { Virtuoso } from '../src'

export function Example() {
  return (
    <Virtuoso
      components={{
        Footer: () => <div style={{ height: 60 }}>Footer</div>,
        Header: () => <div style={{ height: 150 }}>Header</div>,
      }}
      itemContent={(index) => <div style={{ background: 'gray', height: 100, padding: '100px 0px' }}>Item {index}</div>}
      overscan={150}
      style={{ height: 600 }}
      topItemCount={1}
      totalCount={100}
    />
  )
}
