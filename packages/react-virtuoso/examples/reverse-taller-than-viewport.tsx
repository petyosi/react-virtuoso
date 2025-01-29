import { Virtuoso } from '../src'

// @ts-expect-error I know, I know, I know
globalThis.VIRTUOSO_LOG_LEVEL = 0

const itemContent = (index: number) => <div style={{ background: 'white', height: index == 90 ? 400 : 35 }}>Item {index}</div>
export function Example() {
  return <Virtuoso initialTopMostItemIndex={99} itemContent={itemContent} style={{ height: 300 }} totalCount={100} />
}
