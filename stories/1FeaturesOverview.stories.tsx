import React from 'react'
import { Virtuoso } from '../src/Virtuoso'
import { getUser } from './FakeData'
import { ExampleListItem, ExampleAvatar, ExampleUserInfo } from './ExampleComponents'
import { storiesOf } from '@storybook/react'

const group = storiesOf('Features Overview', module)

// An example item render prop;
// the ExampleListItem, ExampleAvatar and ExampleUserInfo are simple wrappers around styled divs and spans -
// you don't need those in your implementation

const Item = (index: number) => {
  const user = getUser(index)
  const title = `${index + 1}. ${user.name}`
  return (
    <ExampleListItem even={index % 2 === 0}>
      <ExampleAvatar style={{ color: user.fgColor, backgroundColor: user.bgColor }}>{user.initials}</ExampleAvatar>
      <ExampleUserInfo title={title}>{user.description}</ExampleUserInfo>
    </ExampleListItem>
  )
}

// 100 000 items example

const HundredThousandItems = () => {
  return (
    <>
      <h2>100 000 Items</h2>
      <div style={{ height: '500px', width: '300px' }}>
        <Virtuoso overscan={0} totalCount={100000} item={Item} />
      </div>
    </>
  )
}

group.add('100 000 items', () => <HundredThousandItems />)

// Pinned Top Items

const TopItems = () => {
  return (
    <>
      <div className="example-description">
        <h2>Fixed Top Items</h2>
        <p>
          {' '}
          The Virtuoso component accepts an optional <code>topItems</code> number property that allows you to pin the
          first <code>N</code> items of the list.{' '}
        </p>
        <p>Scroll the list below - the first two items remain fixed and always visible</p>
      </div>

      <div style={{ height: '500px', width: '300px' }}>
        <Virtuoso topItems={2} totalCount={100000} item={Item} />
      </div>
    </>
  )
}

group.add('Fixed top items', () => <TopItems />)

// Footer

const ListWithFooter = () => {
  return (
    <>
      <div className="example-description">
        <h2>Footer</h2>
        <p>
          The virtuoso component accepts an optional <code>footer</code> render property which is appended at the end of
          the list. The footer can be used for loading indicators or "load more" buttons.
        </p>
        <p>Scroll to the bottom of the list to see "-- end reached --".</p>
      </div>

      <div style={{ height: '500px', width: '300px' }}>
        <Virtuoso
          totalCount={100}
          item={Item}
          footer={() => <div style={{ padding: '1rem', textAlign: 'center' }}>-- end reached --</div>}
        />
      </div>
    </>
  )
}

group.add('Footer', () => <ListWithFooter />)

// Resizable list

const ResizableList = () => {
  return (
    <>
      <div className="example-description">
        <h2>Automatic Resizing</h2>
        <p>
          The Virtuoso Component will automatically handle changes of the items&apos; heights (due to content being
          resized, images being loaded, etc).
        </p>
        <p>Resize your browser and scroll the list around - the items reposition correctly without overlap.</p>
      </div>

      <div style={{ height: '500px', width: '50%' }}>
        <Virtuoso
          totalCount={100}
          item={(index: number) => {
            const user = getUser(index)
            const title = `${index + 1}. ${user.name}`
            return (
              <ExampleListItem even={index % 2 === 0}>
                <ExampleAvatar style={{ color: user.fgColor, backgroundColor: user.bgColor }}>
                  {user.initials}
                </ExampleAvatar>
                <ExampleUserInfo title={title}>{user.longText}</ExampleUserInfo>
              </ExampleListItem>
            )
          }}
          footer={() => <div style={{ padding: '1rem', textAlign: 'center' }}>-- end reached --</div>}
        />
      </div>
    </>
  )
}

group.add('Resizable List', () => <ResizableList />)
