import * as React from 'react'
import { Virtuoso } from '../src'

// @ts-expect-error I know
globalThis['VIRTUOSO_LOG_LEVEL'] = 0

const itemContent = (index: number) => <div style={{ height: index == 90 ? 400 : 35, background: 'white' }}>Item {index}</div>
export default function App() {
  return <Virtuoso totalCount={100} itemContent={itemContent} initialTopMostItemIndex={99} style={{ height: 300 }} />
}
