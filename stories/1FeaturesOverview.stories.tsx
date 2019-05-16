import React, { useState } from 'react'
import { Virtuoso, GroupedVirtuoso } from '../src/index'
import { getUser, generateGroupedUsers, TUser } from './FakeData'
import { ExampleListItem, ExampleAvatar, ExampleUserInfo, ExampleGroup } from './ExampleComponents'
import { storiesOf } from '@storybook/react'
import { ExampleInfo, ExampleTitle } from './ExampleInfo'

const group = storiesOf('Features Overview', module)

// An example item render prop;
// the ExampleListItem, ExampleAvatar and ExampleUserInfo are simple wrappers around styled divs and spans -
// you don't need those in your implementation

const UserItem: React.FC<{ user: TUser; index: number }> = ({ user, index }) => {
  const title = `${index + 1}. ${user.name}`
  return (
    <ExampleListItem even={index % 2 === 0}>
      <ExampleAvatar style={{ color: user.fgColor, backgroundColor: user.bgColor }}>{user.initials}</ExampleAvatar>
      <ExampleUserInfo title={title}>{user.description}</ExampleUserInfo>
    </ExampleListItem>
  )
}

const GenerateItem = (index: number) => {
  return <UserItem user={getUser(index)} index={index} />
}

const GroupedItems = () => {
  const { users, groups, groupCounts } = generateGroupedUsers(500)

  return (
    <>
      <ExampleInfo>
        <ExampleTitle />
      </ExampleInfo>

      <GroupedVirtuoso
        style={{ height: '500px', width: '500px' }}
        groupCounts={groupCounts}
        group={index => {
          return <ExampleGroup>{groups[index]}</ExampleGroup>
        }}
        item={index => {
          return <UserItem user={users[index]} index={index} />
        }}
      />
    </>
  )
}

group.add('Grouped Items', () => <GroupedItems />)

// Pinned Top Items

const TopItems = () => {
  return (
    <>
      <ExampleInfo>
        <ExampleTitle>Fixed Top Items</ExampleTitle>
        <p>
          The Virtuoso component accepts an optional <code>topItems</code> number property that allows you to pin the
          first <code>N</code> items of the list.
        </p>
        <p>Scroll the list below - the first two items remain fixed and always visible.</p>
      </ExampleInfo>

      <Virtuoso style={{ height: '500px', width: '500px' }} topItems={2} totalCount={100000} item={GenerateItem} />
    </>
  )
}

group.add('Fixed top items', () => <TopItems />)

// Footer

const ListWithFooter = () => {
  return (
    <>
      <ExampleInfo>
        <ExampleTitle>Footer</ExampleTitle>
        <p>
          The Virtuoso component accepts an optional <code>footer</code> render property which is appended at the end of
          the list. The footer can be used for loading indicators or load more buttons.
        </p>
        <p>
          Scroll to the bottom of the list to see <code>-- end reached --</code>.
        </p>
      </ExampleInfo>

      <Virtuoso
        style={{ height: '300px', width: '500px' }}
        totalCount={100}
        item={GenerateItem}
        footer={() => <div style={{ padding: '1rem', textAlign: 'center' }}>-- end reached --</div>}
      />
    </>
  )
}

group.add('Footer', () => <ListWithFooter />)

// Resizable list

const ResizableList = () => {
  return (
    <>
      <ExampleInfo>
        <ExampleTitle>Automatic Resizing</ExampleTitle>
        <p>
          The Virtuoso component will automatically handle changes of the items&apos; heights (due to content being
          resized, images being loaded, etc). You don&apos;t have to configure anything additional.
        </p>
        <p>Resize your browser and scroll the list around &ndash; the items reposition correctly without overlap.</p>
      </ExampleInfo>

      <Virtuoso
        style={{ width: '60%' }}
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
    </>
  )
}

group.add('Auto Resizing', () => <ResizableList />)

// Scrolling State Change

const HideAvatarsWhenScrolling = () => {
  const [isScrolling, setIsScrolling] = useState(false)
  return (
    <>
      <ExampleInfo>
        <ExampleTitle>Handling scrolling</ExampleTitle>
        <p>Loading and rendering images while scrolling ruins the scrolling performance.</p>
        <p>
          To deal with this, the Virtuoso component emits <code>scrollingStateChange</code> when the user starts / stops
          scrolling. The callback receives <code>true</code> when the user starts scrolling and <code>false</code>{' '}
          shortly after the last scroll event.
        </p>
        <p>
          Handling this event can be used to optimize performance by hiding/replacing certain elements in the items.
        </p>
        <p>In the example above, the image avatars are replaced with placeholders when the user starts scrolling.</p>
      </ExampleInfo>

      <Virtuoso
        style={{ height: '350px', width: '80%', maxWidth: '500px' }}
        totalCount={100}
        scrollingStateChange={scrolling => setIsScrolling(scrolling)}
        item={(index: number) => {
          const user = getUser(index)
          const title = `${index + 1}. ${user.name}`
          return (
            <ExampleListItem even={index % 2 === 0}>
              {isScrolling ? (
                <ExampleAvatar style={{ backgroundColor: '#ccc' }}>&nbsp;</ExampleAvatar>
              ) : (
                <img src={user.avatar} style={{ width: '50px', height: '50px', flex: 'none', borderRadius: '50%' }} />
              )}

              <ExampleUserInfo title={title}>{user.description}</ExampleUserInfo>
            </ExampleListItem>
          )
        }}
      />
    </>
  )
}

group.add('Scroll Handling', () => <HideAvatarsWhenScrolling />)
