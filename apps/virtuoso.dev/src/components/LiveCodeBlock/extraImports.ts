import React from 'react'
import * as _V from 'react-virtuoso'

import * as _Falso from '@ngneat/falso'
import * as _DataTable from '@virtuoso.dev/data-table'
import * as _Masonry from '@virtuoso.dev/masonry'
import * as _ML from '@virtuoso.dev/message-list'
import * as jsxRuntime from 'react/jsx-runtime'

import * as _UiButton from '@/components/ui/button'
import * as _UiCard from '@/components/ui/card'
import * as _UiTooltip from '@/components/ui/tooltip'
import * as _Utils from '@/lib/utils'

import dataTableTypeDefs from '../../../../../packages/data-table/dist/index.d.ts?raw'
// third-pary
import falsoTypeDefs from '../../../node_modules/@ngneat/falso/src/index.d.ts?raw'
// react
import reactGlobalTypeDefs from '../../../node_modules/@types/react/global.d.ts?raw'
import reactTypeDefs from '../../../node_modules/@types/react/index.d.ts?raw'
import reactJsxRuntimeTypeDefs from '../../../node_modules/@types/react/jsx-runtime.d.ts?raw'
import masonryTypeDefs from '../../../node_modules/@virtuoso.dev/masonry/dist/index.d.ts?raw'
import messageListTypeDefs from '../../../node_modules/@virtuoso.dev/message-list/dist/index.d.ts?raw'
import reactVirtuosoTypeDefs from '../../../node_modules/react-virtuoso/dist/index.d.ts?raw'
import * as _DataTableUI from '../../../registry/new-york/data-table/data-table'
import dataTableUiSource from '../../../registry/new-york/data-table/data-table.tsx?raw'
import utilsSource from '../../lib/utils.ts?raw'
// components
import buttonSource from '../ui/button.tsx?raw'
import cardSource from '../ui/card.tsx?raw'
import tooltipSource from '../ui/tooltip.tsx?raw'

interface LocalSandboxFile {
  content: string
  dependencies: string[]
  filePath: string
  imports?: string[]
  sandboxPath: string
}

export const localFiles: Record<string, LocalSandboxFile> = {
  '@/components/ui/button': {
    content: buttonSource,
    dependencies: ['@radix-ui/react-slot', 'class-variance-authority'],
    filePath: 'file:///src/components/ui/button.tsx',
    imports: ['@/lib/utils'],
    sandboxPath: 'src/components/ui/button.tsx',
  },
  '@/components/ui/card': {
    content: cardSource,
    dependencies: [],
    filePath: 'file:///src/components/ui/card.tsx',
    imports: ['@/lib/utils'],
    sandboxPath: 'src/components/ui/card.tsx',
  },
  '@/components/ui/data-table': {
    content: dataTableUiSource,
    dependencies: ['@virtuoso.dev/data-table'],
    filePath: 'file:///src/components/ui/data-table.tsx',
    imports: ['@/lib/utils'],
    sandboxPath: 'src/components/ui/data-table.tsx',
  },
  '@/components/ui/tooltip': {
    content: tooltipSource,
    dependencies: ['@radix-ui/react-tooltip'],
    filePath: 'file:///src/components/ui/tooltip.tsx',
    imports: ['@/lib/utils'],
    sandboxPath: 'src/components/ui/tooltip.tsx',
  },
  '@/lib/utils': {
    content: utilsSource,
    dependencies: ['clsx', 'tailwind-merge'],
    filePath: 'file:///src/lib/utils.ts',
    sandboxPath: 'src/lib/utils.ts',
  },
}

export const importMap: Record<string, unknown> = {
  '@ngneat/falso': _Falso,
  '@virtuoso.dev/data-table': _DataTable,
  '@virtuoso.dev/masonry': _Masonry,
  '@virtuoso.dev/message-list': _ML,
  '@/components/ui/button': _UiButton,
  '@/components/ui/card': _UiCard,
  '@/components/ui/data-table': _DataTableUI,
  '@/components/ui/tooltip': _UiTooltip,
  '@/lib/utils': _Utils,
  react: React,
  'react/jsx-runtime': jsxRuntime,
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
    content: dataTableTypeDefs,
    filePath: 'file:///node_modules/@types/virtuoso.dev__data-table/index.d.ts',
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
  ...Object.values(localFiles).map(({ content, filePath }) => ({
    content,
    filePath,
  })),
]
