import * as React from 'react'

import { Cell, EngineProvider, useCellValue } from '../'

const a$ = Cell('foo')
function Inner() {
  const a = useCellValue(a$)
  return <div>{a}</div>
}

export function TestProviderUnmount() {
  const [providerKey, setProviderKey] = React.useState(0)
  return (
    <>
      <button
        onClick={() => {
          setProviderKey((k) => k + 1)
        }}
      >
        Remount
      </button>
      <EngineProvider key={`provider-${providerKey}`}>
        <Inner />
      </EngineProvider>
    </>
  )
}
