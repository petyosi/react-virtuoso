/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import { TableVirtuoso, GroupedVirtuoso, Virtuoso, VirtuosoGrid } from '../../../../dist/'
import faker from 'faker'
import styled from '@emotion/styled'
import { groupBy } from 'lodash'
import { makeStyles } from '@material-ui/core/styles'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Avatar from '@mui/material/Avatar'
import * as ReactSortableHOC from 'react-sortable-hoc'
import * as ReactBeautifulDnd from 'react-beautiful-dnd'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import makeData from './makeData'
import { useTable } from 'react-table'

const randomHeight = () => Math.floor(Math.random() * 30 + 24)

const generateRandomItems = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    text: `Item ${i + 1}`,
    height: randomHeight(),
    longText: faker.lorem.paragraphs(1),
  }))
}

const avatar = () =>
  React.createElement('img', {
    src: '/img/avatar.png',
    style: { width: 50, height: 50, display: 'block' },
  })

const avatarPlaceholder = (text = ' ') =>
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

const generated = []

function toggleBg(index) {
  return index % 2 ? 'var(--ifm-background-color)' : 'var(--ifm-color-emphasis-200)'
}

function user(index = 0) {
  let firstName = faker.name.firstName()
  let lastName = faker.name.lastName()

  return {
    index: index + 1,
    bgColor: toggleBg(index),
    name: `${firstName} ${lastName}`,
    initials: `${firstName.substr(0, 1)}${lastName.substr(0, 1)}`,
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

const generateUsers = (length, startIndex = 0) => {
  return Array.from({ length }).map((_, i) => getUser(i + startIndex))
}

const generateGroupedUsers = (length) => {
  const users = Array.from({ length })
    .map((_, i) => getUser(i))
    .sort(userSorter)
  const groupedUsers = groupBy(users, (user) => user.name[0])
  const groupCounts = Object.values(groupedUsers).map((users) => users.length)
  const groups = Object.keys(groupedUsers)

  return { users, groupCounts, groups }
}

// Add react-live imports you need here
const ReactLiveScope = {
  ReactBeautifulDnd,
  ReactSortableHOC,
  React,
  ...React,
  Virtuoso,
  GroupedVirtuoso,
  VirtuosoGrid,
  TableVirtuoso,
  generateRandomItems,
  avatar,
  toggleBg,
  avatarPlaceholder,
  getUser,
  user,
  generateGroupedUsers,
  generateUsers,
  styled,
  useTable,
  makeData,
  MaterialUI: {
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListSubheader,
    makeStyles,
  },
  MUI: {
    Table,
    TableRow,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
  },
}

export default ReactLiveScope
