import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src'

const FancyScroller = React.forwardRef(({ children, ...props }, ref: React.Ref<HTMLDivElement>) => {
  return (
    <div style={{ border: '1px solid pink' }}>
      <div {...props} ref={ref as any}>
        {children}
      </div>
    </div>
  )
})

const App = () => {
  return (
    <Virtuoso
      components={{
        Scroller: FancyScroller,
      }}
      computeItemKey={key => `item-${key}`}
      totalCount={100}
      itemContent={index => <div style={{ height: 30 }}>Item {index}</div>}
      style={{ height: 300 }}
    />
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
