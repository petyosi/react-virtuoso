import React from 'react'
import renderer from 'react-test-renderer'
import { GroupedVirtuoso } from '../src'
import { Virtuoso } from '../src/Virtuoso'

test('Test rendering of empty list', () => {
  expect(
    renderer.create(
      <div>
        <Virtuoso totalCount={100} item={() => <div />} />
      </div>
    )
  ).toMatchSnapshot()
})

test('Test rendering of empty grouped list', () => {
  expect(
    renderer.create(
      <div>
        <GroupedVirtuoso groupCounts={[]} group={() => <div />} item={() => <div />} />
      </div>
    )
  ).toMatchSnapshot()
})
