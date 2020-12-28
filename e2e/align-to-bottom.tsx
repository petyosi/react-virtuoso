import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  const [total, setTotal] = React.useState(10)
  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <Virtuoso
        computeItemKey={key => `item-${key}`}
        alignToBottom={true}
        totalCount={total}
        followOutput={'smooth'}
        itemContent={index => <div style={{ height: 30 }}>Item {index}</div>}
        style={{ height: '100%', flex: 1 }}
        components={{
          Header: () => <div>header</div>,
        }}
      />
      <div style={{ padding: '1rem' }}>
        <button onClick={() => setTotal(val => val + 2)}>bump</button>
      </div>
    </div>
  )
}

/*
      header={() => <>Header</>}
      footer={() => <>Footer</>}
      HeaderContainer={() => 'foo'}
      FooterContainer={() => 'foo'}
      ItemContainer={({ children, ...props }) => (
        <div style={{ border: '1px solid blue' }} {...props}>
          {children}
        </div>
      )}
      emptyComponent={() => <div>No records</div>}
      ListContainer={React.forwardRef<{}, { style: React.CSSProperties }>(({ children, style, ...props }, ref) => (
        <div style={{ ...style, border: '1px solid red' }} {...props} ref={ref}>
          {children}
        </div>
      ))}
      ScrollContainer={React.forwardRef<{}, { style: React.CSSProperties }>(({ children, style, ...props }, ref) => (
        <div style={{ ...style, border: '1px solid black' }} {...props} ref={ref}>
          {children}
        </div>
      ))}
   */

ReactDOM.render(<App />, document.getElementById('root'))
