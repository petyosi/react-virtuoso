import Avatar from '@mui/material/Avatar'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import Paper from '@mui/material/Paper'
import * as MUIStyles from '@mui/material/styles'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import * as _Falso from '@ngneat/falso'
import * as TanstackReactTable from '@tanstack/react-table'
import * as _ML from '@virtuoso.dev/message-list'
import React from 'react'
import * as _V from 'react-virtuoso'
import * as _Masonry from '@virtuoso.dev/masonry'
import SimpleBar from 'simplebar-react'

// @ts-ignore
import messageListDtsCode from '!!raw-loader!../../../../node_modules/@virtuoso.dev/message-list/dist/index.d.ts'
// @ts-ignore
import masonryDtsCode from '!!raw-loader!../../../../node_modules/@virtuoso.dev/masonry/dist/index.d.ts'

// @ts-ignore
import reactVirtuosoDtsCode from '!!raw-loader!../../../../node_modules/react-virtuoso/dist/index.d.ts'

// @ts-ignore
import reactDtsCode from '!!raw-loader!../../../../node_modules/@types/react/index.d.ts'

// @ts-ignore
import jsxRuntimeDtsCode from '!!raw-loader!../../../../node_modules/@types/react/jsx-runtime.d.ts'

// @ts-ignore
import falsoDtsCode from '!!raw-loader!../../../../node_modules/@ngneat/falso/src/index.d.ts'

// @ts-ignore
import simplebarDtsCode from '!!raw-loader!../../../../node_modules/simplebar-react/dist/index.d.ts'

export const importMap = {
  react: React,
  'react-virtuoso': _V,
  '@virtuoso.dev/message-list': _ML,
  '@virtuoso.dev/masonry': _Masonry,
  '@ngneat/falso': _Falso,
  '@mui/material/List': List,
  '@mui/material/ListSubheader': ListSubheader,
  '@mui/material/ListItem': ListItem,
  '@mui/material/ListItemAvatar': ListItemAvatar,
  '@mui/material/Avatar': Avatar,
  '@mui/material/ListItemText': ListItemText,
  '@mui/material/Table': Table,
  '@mui/material/TableBody': TableBody,
  '@mui/material/TableCell': TableCell,
  '@mui/material/TableContainer': TableContainer,
  '@mui/material/TableHead': TableHead,
  '@mui/material/TableRow': TableRow,
  '@mui/material/Paper': Paper,
  '@mui/material/styles': MUIStyles,
  '@tanstack/react-table': TanstackReactTable,
  'simplebar-react': SimpleBar,
}

const tanstackReactTableDtsCode = `
export declare function flexRender<TProps extends object>(Comp: Renderable<TProps>, props: TProps): any;
export declare function useReactTable<TData extends RowData>(options: TableOptions<TData>): any;
export declare function getCoreRowModel(): any;
export declare function getSortedRowModel(): any;
`

const genericDefaultIsAnyDtsCode = `declare const _default: any;
export default _default;`

export const libDefinitions = [
  {
    content: messageListDtsCode as any as string,
    filePath: 'file:///node_modules/@types/virtuoso.dev__message-list/index.d.ts',
  },
  {
    content: reactDtsCode as any as string,
    filePath: 'file:///node_modules/@types/react/index.d.ts',
  },
  {
    content: jsxRuntimeDtsCode as any as string,
    filePath: 'file:///node_modules/@types/react/jsx-runtime.d.ts',
  },
  {
    content: reactVirtuosoDtsCode as any as string,
    filePath: 'file:///node_modules/@types/react-virtuoso/index.d.ts',
  },
  {
    content: falsoDtsCode as any as string,
    filePath: 'file:///node_modules/@types/ngneat__falso/index.d.ts',
  },
  {
    content: tanstackReactTableDtsCode as any as string,
    filePath: 'file:///node_modules/@types/tanstack__react-table/index.d.ts',
  },
  {
    content: messageListDtsCode as any as string,
    filePath: 'file:///node_modules/@types/virtuoso.dev__message-list/index.d.ts',
  },
  {
    content: reactDtsCode as any as string,
    filePath: 'file:///node_modules/@types/react/index.d.ts',
  },
  {
    content: jsxRuntimeDtsCode as any as string,
    filePath: 'file:///node_modules/@types/react/jsx-runtime.d.ts',
  },
  {
    content: reactVirtuosoDtsCode as any as string,
    filePath: 'file:///node_modules/@types/react-virtuoso/index.d.ts',
  },
  {
    content: falsoDtsCode as any as string,
    filePath: 'file:///node_modules/@types/ngneat__falso/index.d.ts',
  },
  {
    content: masonryDtsCode as any as string,
    filePath: 'file:///node_modules/@types/virtuoso.dev__masonry/index.d.ts',
  },
  {
    content: simplebarDtsCode as any as string,
    filePath: 'file:///node_modules/@types/simplebar-react/index.d.ts',
  },
  ...[
    'List',
    'ListSubheader',
    'ListItem',
    'ListItemAvatar',
    'Avatar',
    'ListItemText',
    'Table',
    'TableBody',
    'TableCell',
    'TableContainer',
    'TableHead',
    'TableRow',
    'Paper',
    'styles',
  ].map((component) => ({
    content: genericDefaultIsAnyDtsCode,
    filePath: `file:///node_modules/@types/mui__material/${component}/index.d.ts`,
  })),
]
