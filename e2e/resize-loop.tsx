import * as React from 'react'
import { Virtuoso } from '../src/'

window.addEventListener('error', event => {
  // console.log(event)
})

const ResizingDiv = ({ children }) => {
  const [height, setHeight] = React.useState(60)
  React.useEffect(() => {
    setHeight(() => 120)
  }, [])
  return <div style={{ height, transition: 'all 0.5s linear', border: '1px solid blue' }}>{children}</div>
}

export default function App() {
  return <Virtuoso totalCount={100} itemContent={index => <ResizingDiv>Item {index}</ResizingDiv>} style={{ height: 300 }} />
}
