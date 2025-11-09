import { useState } from 'react'

import { Virtuoso } from '../src'

const Row = (props: any) => {
  const { expanded, rowIndex, setExpanded } = props
  const [ex, setEx] = useState(expanded)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const color = Math.floor(Math.abs(Math.sin(rowIndex) * 16777215) % 16777215).toString(16)
  return (
    <div style={{}}>
      <div
        onClick={() => {
          setExpanded(!expanded)
          setEx(!ex)
        }}
        style={{
          background: 'grey',
          border: '4px solid black',
          padding: '40px 0px',
        }}
      >
        This is row #{rowIndex} rendered at {Date.now()}
        <div style={{ height: ex ? '100%' : rowIndex % 2 === 0 ? '2px' : '35px', overflow: 'hidden' }}>
          <div
            style={{
              background: `#${color}`,
              height: '250px',
            }}
          />
        </div>
      </div>
    </div>
  )
}
type IExpanded = Record<number, boolean>
export function Example() {
  const [expanded, setExpanded] = useState<IExpanded>({})

  const itemContent = (rowIndex: number) => (
    <Row
      expanded={expanded[rowIndex]}
      rowIndex={rowIndex}
      setExpanded={(expanded: boolean) => {
        setExpanded((old) => Object.assign(old, { [rowIndex]: expanded }))
      }}
    />
  )
  return <Virtuoso initialTopMostItemIndex={100} itemContent={itemContent} style={{ height: 900 }} totalCount={500} />
}
