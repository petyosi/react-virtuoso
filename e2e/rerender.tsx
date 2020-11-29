import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso, VirtuosoGrid } from '../src/'

const App = () => {
  const [foo, setFoo] = React.useState(Symbol())
  const [bar, setBar] = React.useState([])
  console.log(foo)

  return (
    <>
      <button onClick={() => setFoo(Symbol())}>Bam!</button>
      <button onClick={() => setBar([{ name: 'test' }])}>Jam</button>
      <Virtuoso initialItemCount={30} totalCount={1000} style={{ height: 300 }} initialTopMostItemIndex={100} />
      <hr />
      <Virtuoso
        data={bar}
        style={{ height: 300 }}
        itemContent={(index, item) => {
          if (item === undefined) {
            debugger
          }
          return 'foo'
        }}
      />
      <hr />
      <VirtuosoGrid initialItemCount={10} totalCount={1000} style={{ height: 300 }} />
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
