import 'react-app-polyfill/ie11'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/Virtuoso'

const App = () => {
  return (
    <div className="d-flex justify-content-center">
      <div style={{ height: '500px', width: '100%' }}>
        <Virtuoso
          totalCount={2000}
          overscan={200}
          itemHeight={40}
          item={(index: number) => {
            return <div style={{ height: '40px', lineHeight: '40px' }}>Item {index}</div>
          }}
        />
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
