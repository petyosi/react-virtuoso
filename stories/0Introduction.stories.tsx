import React from 'react'
import { Virtuoso } from '../src/Virtuoso'
import { getUser } from './FakeData'
import { ExampleListItem, ExampleAvatar, ExampleUserInfo } from './ExampleComponents'
import { storiesOf } from '@storybook/react'
import { ExampleInfo, ExampleTitle } from './ExampleInfo'

const group = storiesOf('Introduction', module)

// 100 000 items example

const HundredThousandItems = () => {
  return (
    <>
      <ExampleInfo>
        <ExampleTitle>100 000 Items</ExampleTitle>
        <p>
          The Virtuoso component is built for the display of huge lists - you do not have to configure anything apart
          from the total item count and the <code>item</code> prop renderer.
        </p>

        <p>
          The prop render callback accepts <code>index</code> parameter, which specifies the absolute index of the item
          being rendered; It is up to you to build and return the respective content for it.
        </p>

        <p>
          For a detailed overview and usage instructions, check the{' '}
          <a href="https://github.com/petyosi/react-virtuoso">Github README</a>.
        </p>
      </ExampleInfo>

      <Virtuoso
        totalCount={100000}
        overscan={200}
        item={(index: number) => {
          const user = getUser(index)
          const title = `${index + 1}. ${user.name}`
          return (
            <ExampleListItem even={index % 2 === 0}>
              <ExampleAvatar style={{ color: user.fgColor, backgroundColor: user.bgColor }}>
                {user.initials}
              </ExampleAvatar>
              <ExampleUserInfo title={title}>{user.description}</ExampleUserInfo>
            </ExampleListItem>
          )
        }}
        style={{ height: '400px', width: '80%', maxWidth: '600px' }}
      />
    </>
  )
}

group.add('100 000 items', () => <HundredThousandItems />, {
  title: 'Custom title',
  description: ' Sample desc',
  name: 'foo',
  options: {},
})
