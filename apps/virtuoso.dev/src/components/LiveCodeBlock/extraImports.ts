import * as _Falso from '@ngneat/falso'
import * as _Masonry from '@virtuoso.dev/masonry'
import * as _ML from '@virtuoso.dev/message-list'
import React from 'react'
import * as _V from 'react-virtuoso'

// third-pary
import falsoTypeDefs from '../../../node_modules/@ngneat/falso/src/index.d.ts?raw'
// react
import reactGlobalTypeDefs from '../../../node_modules/@types/react/global.d.ts?raw'
import reactTypeDefs from '../../../node_modules/@types/react/index.d.ts?raw'
import reactJsxRuntimeTypeDefs from '../../../node_modules/@types/react/jsx-runtime.d.ts?raw'
import masonryTypeDefs from '../../../node_modules/@virtuoso.dev/masonry/dist/index.d.ts?raw'
import messageListTypeDefs from '../../../node_modules/@virtuoso.dev/message-list/dist/index.d.ts?raw'
// components
import reactVirtuosoTypeDefs from '../../../node_modules/react-virtuoso/dist/index.d.ts?raw'

export const importMap: Record<string, unknown> = {
  '@ngneat/falso': _Falso,
  '@virtuoso.dev/masonry': _Masonry,
  '@virtuoso.dev/message-list': _ML,
  react: React,
  'react-virtuoso': _V,
}

export const libDefinitions = [
  {
    content: reactGlobalTypeDefs,
    filePath: 'file:///node_modules/@types/react/global.d.ts',
  },
  {
    content: reactTypeDefs,
    filePath: 'file:///node_modules/@types/react/index.d.ts',
  },
  {
    content: reactJsxRuntimeTypeDefs,
    filePath: 'file:///node_modules/@types/react/jsx-runtime.d.ts',
  },
  {
    content: reactVirtuosoTypeDefs,
    filePath: 'file:///node_modules/@types/react-virtuoso/index.d.ts',
  },
  {
    content: messageListTypeDefs,
    filePath: 'file:///node_modules/@types/virtuoso.dev__message-list/index.d.ts',
  },
  {
    content: masonryTypeDefs,
    filePath: 'file:///node_modules/@types/virtuoso.dev__masonry/index.d.ts',
  },
  {
    content: falsoTypeDefs,
    filePath: 'file:///node_modules/@types/ngneat__falso/index.d.ts',
  },
]
