import React from 'react'
import renderer from 'react-test-renderer'
import { GroupedVirtuoso } from '../src'
import { Virtuoso } from '../src/Virtuoso'

test('render empty list', () => {
  expect(
    renderer.create(
      <div>
        <Virtuoso totalCount={100} item={() => <div />} />
      </div>
    )
  ).toMatchSnapshot()
})

test('server side rendering', () => {
  const render = renderer.create(<Virtuoso totalCount={100} initialItemCount={20} item={() => <div />} />)
  const items = (render.toJSON() as any).children[0].children[0].children
  expect(items).toHaveLength(20)
})

test('render empty grouped list', () => {
  expect(
    renderer.create(
      <div>
        <GroupedVirtuoso groupCounts={[]} group={() => <div />} item={() => <div />} />
      </div>
    )
  ).toMatchSnapshot()
})
