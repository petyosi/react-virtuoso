import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  return (
    <Virtuoso
      computeItemKey={key => `item-${key}`}
      initialItemCount={30}
      totalCount={100}
      itemContent={index => <div style={{ height: 30 }}>Item {index}</div>}
      style={{ height: 300 }}
    />
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
