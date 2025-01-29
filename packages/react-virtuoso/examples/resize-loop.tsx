import React, { FC, ReactNode } from 'react'

import { Virtuoso } from '../src'

// window.addEventListener('error', (event) => {
//   console.log(event)
// })

const ResizingDiv: FC<{ children: ReactNode }> = ({ children }) => {
  const [height, setHeight] = React.useState(60)
  React.useEffect(() => {
    setHeight(() => 120)
  }, [])
  return <div style={{ border: '1px solid blue', height, transition: 'all 0.5s linear' }}>{children}</div>
}

export function Example() {
  return <Virtuoso itemContent={(index) => <ResizingDiv>Item {index}</ResizingDiv>} style={{ height: 300 }} totalCount={100} />
}
