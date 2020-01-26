import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../../src/'
import radar from '../lag-radar'
import faker from 'faker'

function makeLogLine(idx: number) {
  const message = faker.lorem.paragraph(Math.round(Math.random() * 10 + 1))

  return {
    index: idx,
    id: faker.random.uuid(),
    message,
  }
}

function generateLogLines(startIndex: number, count: number) {
  return Array(count)
    .fill(true)
    .map((_, idx) => {
      return makeLogLine(idx + startIndex)
    })
}

export const LogViewer = () => {
  const ref = useRef<Virtuoso>(null)
  const [logLines, setLogLines] = useState([])
  const topRecordIndex = useRef(100)
  const tailInterval = useRef(null)
  const initialRecordSize = 200
  const prependRecordCount = 100
  const tailRecordCount = 5
  const [showScrollToBottom, setShowScrollToBottom] = useState(true)

  useEffect(() => {
    setLogLines(generateLogLines(topRecordIndex.current, initialRecordSize))
  }, [])

  const tailRecords = useCallback(
    atBottom => {
      setShowScrollToBottom(!atBottom)
      if (atBottom) {
        clearInterval(tailInterval.current)
        tailInterval.current = setInterval(() => {
          setLogLines([...logLines, ...generateLogLines(topRecordIndex.current + logLines.length, tailRecordCount)])
        }, 100)
      } else {
        tailInterval.current && clearInterval(tailInterval.current)
      }
    },
    [logLines]
  )

  const prependRecords = useCallback(() => {
    console.log('prepending')
    topRecordIndex.current -= prependRecordCount
    setLogLines([...generateLogLines(topRecordIndex.current, prependRecordCount), ...logLines])
    ref.current.adjustForPrependedItems(prependRecordCount)
  }, [logLines, topRecordIndex, ref])

  const LogLine = (index: number) => {
    return (
      <div
        style={{
          display: 'flex',
          paddingTop: '10px',
          borderBottom: '1px solid #ccc',
          boxSizing: 'border-box',
        }}
      >
        <strong>{logLines[index].index}</strong>
        <p style={{ margin: 0, padding: '10px' }}>{logLines[index].message}</p>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          height: '30px',
          zIndex: 100,
          background: 'gray',
          top: 0,
          padding: '10px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {showScrollToBottom && (
          <button onClick={() => ref.current.scrollToIndex(logLines.length - 1)}>Scroll To Bottom</button>
        )}
      </div>
      <Virtuoso
        ref={ref}
        style={{ width: '100%', height: '100%' }}
        totalCount={logLines.length}
        initialTopMostItemIndex={initialRecordSize - 50}
        atBottomStateChange={tailRecords}
        followOutput={true}
        maxHeightCacheSize={500}
        rangeChanged={({ startIndex }) => {
          if (startIndex < 30) {
            prependRecords()
          }
        }}
        item={LogLine}
      />
    </div>
  )
}

export default function App() {
  const radarRef = React.useRef(null)
  React.useEffect(() => {
    radar({ parent: radarRef.current, size: 100 })
  }, [radarRef])
  return (
    <div style={{ height: '100%' }}>
      <LogViewer />
      <div ref={radarRef} style={{ position: 'absolute', bottom: '30px', right: '30px' }} id="radar-container"></div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
