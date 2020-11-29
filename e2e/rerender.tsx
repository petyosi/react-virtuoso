import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  const [foo, setFoo] = React.useState(Symbol())
  console.log(foo)

  return (
    <>
      <button onClick={() => setFoo(Symbol())}>Bam!</button>
      <Virtuoso computeItemKey={key => `item-${key}`} initialItemCount={30} totalCount={100} />
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
