import { Virtuoso } from '../src'

export function Example() {
  return (
    <Virtuoso
      data={Array.from({ length: 100 }, (_, index) => {
        return { text: `Item ${index}` }
      })}
      initialItemCount={30}
      itemContent={(_, item) => <div>{item.text}</div>}
      style={{ height: 300 }}
    />
  )
}
