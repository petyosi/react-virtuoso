/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as React from 'react'
import { useState } from 'react'
import { Virtuoso } from '../src'

const Row = (props: any) => {
  const { rowIndex, expanded, setExpanded } = props
  const [ex, setEx] = useState(expanded)
  const color = Math.floor(Math.abs(Math.sin(rowIndex) * 16777215) % 16777215).toString(16)
  return (
    <div style={{}}>
      <div
        style={{
          background: 'grey',
          padding: '40px 0px',
          border: '4px solid black',
        }}
        onClick={() => {
          setExpanded(!expanded)
          setEx(!ex)
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
interface IExpanded {
  [key: number]: boolean
}
export function Example() {
  const [expanded, setExpanded] = useState<IExpanded>({})

  const itemContent = (rowIndex: number) => (
    <Row
      rowIndex={rowIndex}
      expanded={!!expanded[rowIndex]}
      setExpanded={(expanded: boolean) => {
        setExpanded((old) => Object.assign(old, { [rowIndex]: expanded }))
      }}
    />
  )
  return <Virtuoso style={{ height: 900 }} totalCount={500} itemContent={itemContent} initialTopMostItemIndex={100} />
}
