import React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../../src/'
import radar from '../lag-radar'

export default function App() {
  const radarRef = React.useRef(null)
  React.useEffect(() => {
    radar({ parent: radarRef.current, size: 100 })
  }, [radarRef])
  return (
    <div style={{ height: '100%' }}>
      <Virtuoso
        style={{ width: '100%', height: '600px' }}
        totalCount={200}
        defaultItemHeight={20}
        initialTopMostItemIndex={200}
        item={index => (
          <div style={{ height: index % 2 ? 80 : 20, boxSizing: 'border-box', border: '1px solid black' }}>
            Item {index}
          </div>
        )}
      />
      <div ref={radarRef} style={{ position: 'absolute', bottom: '30px', right: '30px' }} id="radar-container"></div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
