import styled from 'styled-components'
import React from 'react'
import { FC } from 'react'

export const ExampleAvatar = styled.div`
  border-radius: 50%;
  width: 50px;
  height: 50px;
  text-align: center;
  line-height: 50px;
  flex: none;
  font-weight: bold;
  font-size: 1.2rem;
`
export const ExampleAvatarPlaceholder = styled.div`
  width: 50px;
  height: 50px;
  flex: none;
`
export const ExampleListItem = styled.div<{
  even: boolean
}>`
  background-color: ${props => (props.even ? '#fff' : '#f4f4f4')};
  border-radius: 3px;
  font-family: sans-serif;
  font-size: 12px;
  display: flex;
  padding: 1rem;
  color: #333;
`

export const ExampleGroup = styled.div`
  background-color: rgba(200, 200, 200, 0.8);
  color: #333;
  font-family: sans-serif;
  font-size: 12px;
  padding: 1rem;
  font-weight: bold;
`

export const ExampleUserInfo: FC<{ title: string }> = ({ title, children }) => {
  return (
    <div style={{ marginLeft: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ marginBottom: 0 }}>{children}</p>
    </div>
  )
}
