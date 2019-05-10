import React from 'react'
import { storiesOf } from '@storybook/react'
import { Virtuoso } from '../src/Virtuoso'

const SmallList = () => {
  return (
    <div style={{ height: '150px', width: '300px' }}>
      <Virtuoso
        overscan={0}
        totalCount={1000}
        itemHeight={35}
        item={index => {
          return (
            <div
              style={{
                textAlign: 'center',
                backgroundColor: index % 2 ? '#ccc' : '#fff',
                lineHeight: '35px',
                fontFamily: 'sans-serif',
                fontSize: '12px',
              }}
            >
              Row {index}
            </div>
          )
        }}
      />
    </div>
  )
}

storiesOf('Demos from react window', module).add('first one', () => <SmallList />)
