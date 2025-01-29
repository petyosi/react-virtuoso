import { Virtuoso } from '../src'

export function Example() {
  return <Virtuoso initialTopMostItemIndex={8} itemContent={itemContent} style={{ height: 100 }} totalCount={12} />
}
function itemContent(index: number) {
  const height = index === 7 ? 120 : 30
  const backgroundColor = index === 7 ? 'red' : 'transparent'
  return <div style={{ backgroundColor, height }}>Item {index}</div>
}
