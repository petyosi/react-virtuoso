import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Virtuoso } from '../src/Virtuoso'
import { TUser, getUser } from './FakeData'
import { ExampleListItem, ExampleAvatar, ExampleUserInfo } from './ExampleComponents'
import { storiesOf } from '@storybook/react'
import { ExampleInfo, ExampleTitle } from './ExampleInfo'

const group = storiesOf('Scenarios', module)

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

// Press to load more

const PressToLoadMore = () => {
  const [total, setTotal] = useState(0)
  const items = useRef<TUser[]>([])
  const [loading, setLoading] = useState(false)

  // the setTimeout below simulates a network request.
  // In the real world, you can fetch data from a service.
  // the setTotal call will trigger a refresh for the list, so make sure you call it last
  const loadMore = useCallback(() => {
    setLoading(true)

    setTimeout(() => {
      for (let index = total; index < total + total + 20; index++) {
        items.current = [...items.current, getUser(index)]
      }
      setLoading(false)
      setTotal(items.current.length)
    }, 500)
  }, [])

  useEffect(() => {
    loadMore()
  }, [])

  return (
    <>
      <ExampleInfo>
        <ExampleTitle>Press to load more</ExampleTitle>
        <p>The footer render property can be used to host a load more button that appends more items to the list.</p>
        <p>Scroll to the bottom of the list and press the load more button to load 20 more items.</p>
      </ExampleInfo>
      <Virtuoso
        style={{ width: '400px', height: '300px' }}
        totalCount={total}
        item={Item}
        footer={() => {
          return (
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
              <button disabled={loading} onClick={loadMore}>
                {loading ? 'Loading...' : 'Press to load more'}
              </button>
            </div>
          )
        }}
      />
    </>
  )
}

group.add('Press to load more', () => <PressToLoadMore />)

const EndlessScrolling = () => {
  const [total, setTotal] = useState(0)
  const items = useRef<TUser[]>([])
  const loading = useRef(false)

  // the setTimeout below simulates a network request.
  // In the real world, you can fetch data from a service.
  // the setTotal call will trigger a refresh for the list, so make sure you call it last
  const loadMore = useCallback(() => {
    if (loading.current) {
      return
    }
    loading.current = true

    setTimeout(() => {
      for (let index = total; index < total + total + 20; index++) {
        items.current = [...items.current, getUser(index)]
      }
      loading.current = false
      setTotal(items.current.length)
    }, 2000)
  }, [])

  useEffect(() => {
    loadMore()
  }, [])

  return (
    <>
      <ExampleInfo>
        <ExampleTitle>Endless Scrolling</ExampleTitle>
        <p>
          The <code>endReached</code> callback can be used to automatically load more items when the user scrolls to the
          bottom of the list.
        </p>
        <p>Scroll fast to the bottom of the list to see additional items being loaded.</p>
      </ExampleInfo>
      <Virtuoso
        style={{ width: '400px', height: '300px' }}
        totalCount={total}
        item={Item}
        endReached={() => loadMore()}
        footer={() => {
          return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        }}
      />
    </>
  )
}

group.add('Endless Scrolling', () => <EndlessScrolling />)
