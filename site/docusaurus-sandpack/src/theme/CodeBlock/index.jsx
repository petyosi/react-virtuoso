import { Sandpack, SandpackCodeViewer, SandpackProvider, SandpackThemeProvider } from '@codesandbox/sandpack-react'
import React from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import './style.css'

const dataCode = `
import faker from 'faker'
import { groupBy } from 'lodash'
import React from 'react'

const randomHeight = () => Math.floor(Math.random() * 30 + 24)

const generateRandomItems = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    text: \`Item \${i + 1}\`,
    height: randomHeight(),
    longText: faker.lorem.paragraphs(1),
  }))
}

const generated = []

export function toggleBg(index) {
  return index % 2 ? '#f5f5f5' : 'white'
}

export function user(index = 0) {
  let firstName = faker.name.firstName()
  let lastName = faker.name.lastName()

  return {
    index: index + 1,
    bgColor: toggleBg(index),
    name: \`\${firstName} $\{lastName}\`,
    initials: \`$\{firstName.substr(0, 1)}\${lastName.substr(0, 1)}\`,
    jobTitle: faker.name.jobTitle(),
    description: faker.lorem.sentence(10),
    longText: faker.lorem.paragraphs(1),
  }
}

export const getUser = (index) => {
  if (!generated[index]) {
    generated[index] = user(index)
  }

  return generated[index]
}

const userSorter = (a, b) => {
  if (a.name < b.name) {
    return -1
  }
  if (a.name > b.name) {
    return 1
  }
  return 0
}

export function generateUsers(length, startIndex = 0) {
  return Array.from({ length }).map((_, i) => getUser(i + startIndex))
}

export function generateGroupedUsers(length) {
  const users = Array.from({ length })
    .map((_, i) => getUser(i))
    .sort(userSorter)
  const groupedUsers = groupBy(users, (user) => user.name[0])
  const groupCounts = Object.values(groupedUsers).map((users) => users.length)
  const groups = Object.keys(groupedUsers)

  return { users, groupCounts, groups }
}

export const avatar = () =>
  React.createElement(
    'div',
    {
      style: {
        backgroundColor: 'blue',
        borderRadius: '50%',
        width: 50,
        height: 50,
        paddingTop: 15,
        paddingLeft: 15,
        color: 'white',
        boxSizing: 'border-box'
      },
    },
    "AB"
  )

export const avatarPlaceholder = (text = ' ') =>
  React.createElement(
    'div',
    {
      style: {
        backgroundColor: '#eef2f4',
        borderRadius: '50%',
        width: 50,
        height: 50,
      },
    },
    text
  )

const range = (len) => {
  const arr = []
  for (let i = 0; i < len; i++) {
    arr.push(i)
  }
  return arr
}

const newPerson = () => {
  const statusChance = Math.random()
  return {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    age: Math.floor(Math.random() * 30),
    visits: Math.floor(Math.random() * 100),
    progress: Math.floor(Math.random() * 100),
    status: statusChance > 0.66 ? 'relationship' : statusChance > 0.33 ? 'complicated' : 'single',
  }
}

export function makeData(...lens) {
  const makeDataLevel = (depth = 0) => {
    const len = lens[depth]
    return range(len).map((d) => {
      return {
        ...newPerson(),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
      }
    })
  }

  return makeDataLevel()
}
`

const RenderSandpack = (props) => {
  const { siteConfig } = useDocusaurusContext()
  const sandpackPluginOptions = siteConfig.themeConfig.sandpack

  const { children, template = 'react', file = '/App.js', theme = sandpackPluginOptions.theme } = props

  if (props.live) {
    const occurrences = children.split(/(```(.*?[^\\])```)/gms).filter((line) => line.startsWith('```'))

    const files = occurrences.reduce((acc, curr) => {
      const [firstLine, ...content] = curr.replace(/```/g, '').split('\n')
      const fileName = firstLine.match(/file=(.+)/)?.[1] ?? ''

      return {
        ...acc,
        [fileName]: {
          code: content.join('\n'),
        },
      }
    }, {})
    return (
      <Sandpack
        editorHeight={600}
        customSetup={{
          dependencies: {
            'react-virtuoso': 'latest',
            ...(props['include-data'] ? { faker: '5.1.0', lodash: 'latest' } : {}),
            ...(props['import'] === '@mui/material'
              ? { '@mui/material': 'latest', '@emotion/styled': 'latest', '@emotion/react': 'latest' }
              : {}),
            ...(props['import'] === '@tanstack/react-table' ? { '@tanstack/react-table': 'latest' } : {}),
            ...(props['import'] === 'react-sortable-hoc' ? { 'react-sortable-hoc': '^1.11.0' } : {}),
            ...(props['import'] === 'react-beautiful-dnd' ? { 'react-beautiful-dnd': 'latest' } : {}),
            ...(props['import'] === '@emotion/styled' ? { '@emotion/styled': 'latest', '@emotion/react': 'latest' } : {}),
          },
        }}
        files={
          children
            ? occurrences.length
              ? files
              : {
                  [file]: children,
                  ...(props['include-data'] ? { '/data.js': { code: dataCode, hidden: true } } : {}),
                }
            : undefined
        }
        template={template}
        theme={theme}
      />
    )
  }

  return (
    <SandpackProvider
      customSetup={{
        entry: 'index.ts',
        files: { 'index.ts': children.trim() },
      }}
    >
      <SandpackThemeProvider theme={theme}>
        <button
          className="sandpack__copy-button"
          onClick={() => {
            navigator.clipboard.writeText(children.trim())
          }}
        >
          <svg fill="none" height="100%" viewBox="0 0 12 13" width="100%">
            <g clipPath="url(#a)">
              <path
                d="M8.21 1.344H2.317c-.54 0-.983.463-.983 1.03v7.212h.983V2.374H8.21v-1.03Zm1.474 2.06H4.281c-.54 0-.983.464-.983 1.03v7.213c0 .566.442 1.03.983 1.03h5.403c.54 0 .983-.464.983-1.03V4.435c0-.567-.442-1.03-.983-1.03Zm0 8.243H4.281V4.435h5.403v7.212Z"
                fill="currentColor"
              />
            </g>
            <defs>
              <clipPath id="a">
                <path d="M0 0h12v12H0z" fill="currentColor" transform="translate(0 .676)" />
              </clipPath>
            </defs>
          </svg>
        </button>
        <SandpackCodeViewer />
      </SandpackThemeProvider>
    </SandpackProvider>
  )
}

export default RenderSandpack
