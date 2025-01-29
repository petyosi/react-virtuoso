import { JSDOM } from 'jsdom'
import * as React from 'react'
import ReactDOMServer from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { systemToComponent } from '../../src/react-urx'
/**
 * @jest-environment node
 */
import { connect, statefulStream, stream, system } from '../../src/urx'

const simpleSystem = () =>
  system(() => {
    const prop = stream<number>()
    const depot = statefulStream(10)
    connect(prop, depot)

    return { depot, prop }
  })

const Root: React.FC<{ id: string }> = ({ id }) => {
  const value = useEmitterValue('depot')
  return <div id={id}>{value}</div>
}
const { Component, useEmitterValue } = systemToComponent(
  simpleSystem(),
  {
    optional: { prop: 'prop' },
  },
  Root
)

describe('SSR component', () => {
  it('sets prop values', () => {
    const html = ReactDOMServer.renderToString(<Component id="root" prop={30} />)
    const { document } = new JSDOM(html).window
    expect(document.querySelector('#root')!.textContent).toEqual('30')
  })
})
