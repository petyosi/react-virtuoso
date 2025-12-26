// @ts-check
import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import starlightUtils from '@lorenzo_lewis/starlight-utils'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField } from 'astro/config'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { docsSync } from './src/integrations/docs-sync'
import initAstroTypedoc from './src/plugins/astro-typedoc'
import { autoImports } from './src/plugins/auto-imports'
import { remarkCustomCodeBlocks } from './src/plugins/remark-custom-code-blocks'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Components that will be auto-imported when used in MDX files
const autoImportConfig = {
  imports: {
    LiveCodeBlock: {
      default: true,
      // Use absolute path from project root for MDX imports
      from: '/src/components/LiveCodeBlock/LiveCodeBlock.tsx',
    },
    StaticCodeBlock: {
      default: true,
      from: '/src/components/StaticCodeBlock/StaticCodeBlock.tsx',
    },
  },
}

// https://astro.build/config
export default defineConfig({
  env: {
    schema: {
      PADDLE_ENVIRONMENT: envField.string({ access: 'public', context: 'client' }),
      PADDLE_PRO_PRICE_ID: envField.string({ access: 'public', context: 'client' }),
      PADDLE_STANDARD_PRICE_ID: envField.string({ access: 'public', context: 'client' }),
      PADDLE_TOKEN: envField.string({ access: 'public', context: 'client' }),
    },
  },
  integrations: [
    docsSync({
      excludeFromCleanup: ['99.api-reference'],
      sources: [
        {
          dest: 'react-virtuoso',
          file: '../../packages/react-virtuoso/README.md',
          transform: (content) => {
            const frontmatter = `---
title: React Virtuoso
sidebar:
  label: Overview
  order: 0
---

`
            // Remove the H1 heading line and following blank line
            const withoutH1 = content.replace(/^# .+\n\n/, '')
            return frontmatter + withoutH1
          },
        },
        {
          dest: 'react-virtuoso',
          destFileName: '98.changelog.md',
          file: '../../packages/react-virtuoso/CHANGELOG.md',
        },
        {
          dest: 'react-virtuoso',
          path: '../../packages/react-virtuoso/docs',
        },
        {
          dest: 'masonry',
          file: '../../packages/masonry/README.md',
          transform: (content) => {
            const frontmatter = `---
title: Virtuoso Masonry
sidebar:
  label: Overview
  order: 0
---

`
            const withoutH1 = content.replace(/^# .+\n\n/, '')
            return frontmatter + withoutH1
          },
        },
        {
          dest: 'masonry',
          destFileName: '98.changelog.md',
          file: '../../packages/masonry/CHANGELOG.md',
          transform: (content) => {
            return content.split('\n').slice(1).join('\n')
          },
        },
        {
          dest: 'masonry',
          path: '../../packages/masonry/docs',
        },
        {
          dest: 'gurx',
          file: '../../packages/gurx/README.md',
          transform: (content) => {
            const frontmatter = `---
title: Gurx
sidebar:
  label: Overview
  order: 0
---

`
            const withoutH1 = content.replace(/^# .+\n\n/, '')
            return frontmatter + withoutH1
          },
        },
        {
          dest: 'gurx',
          path: '../../packages/gurx/docs',
        },
        {
          dest: 'message-list',
          file: '../../packages/message-list/README.md',
          transform: (content) => {
            const frontmatter = `---
title: Virtuoso Message List
sidebar:
  label: Overview
  order: 0
---

`
            const withoutH1 = content.replace(/^# .+\n\n/, '')
            return frontmatter + withoutH1
          },
        },
        {
          dest: 'message-list',
          destFileName: '98.changelog.md',
          file: './node_modules/@virtuoso.dev/message-list/CHANGELOG.md',
        },
        {
          dest: 'message-list',
          path: '../../packages/message-list/docs',
        },
      ],
    }),
    react(),
    await initAstroTypedoc({
      baseUrl: '/react-virtuoso/api-reference/',
      entryPoints: [
        {
          path: resolve(__dirname, '../../packages/react-virtuoso/src/index.tsx'),
        },
      ],
      outputFolder: 'src/content/docs/react-virtuoso/99.api-reference',
      tsconfig: resolve(__dirname, '../../packages/react-virtuoso/tsconfig.json'),
    }),
    await initAstroTypedoc({
      baseUrl: '/masonry/api-reference/',
      entryPoints: [
        {
          path: resolve(__dirname, '../../packages/masonry/src/index.ts'),
        },
      ],
      outputFolder: 'src/content/docs/masonry/99.api-reference',
      tsconfig: resolve(__dirname, '../../packages/masonry/tsconfig.json'),
    }),
    await initAstroTypedoc({
      baseUrl: '/gurx/api-reference/',
      entryPoints: [
        {
          path: resolve(__dirname, '../../packages/gurx/src/index.ts'),
        },
      ],
      outputFolder: 'src/content/docs/gurx/99.api-reference',
      tsconfig: resolve(__dirname, '../../packages/gurx/tsconfig.json'),
    }),
    await initAstroTypedoc({
      baseUrl: '/message-list/api-reference/',
      entryPoints: [
        {
          path: resolve(__dirname, './node_modules/@virtuoso.dev/message-list/dist/index.d.ts'),
        },
      ],
      excludeExternals: false,
      outputFolder: 'src/content/docs/message-list/99.api-reference',
      tsconfig: resolve(__dirname, './tsconfig.message-list.json'),
    }),
    starlight({
      components: {
        Header: './src/components/Header.astro',
        PageFrame: './src/components/PageFrame.astro',
        Pagination: './src/components/Pagination.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
      customCss: [
        // '@fontsource/ibm-plex-mono/400.css',
        // '@fontsource/ibm-plex-mono/600.css',
        './src/styles/global.css',
      ],
      head: [
        {
          attrs: {
            async: true,
            src: 'https://www.googletagmanager.com/gtag/js?id=G-FXF8T3XR4N',
          },
          tag: 'script',
        },
        {
          content: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-FXF8T3XR4N');
      `,
          tag: 'script',
        },
        {
          attrs: {
            href: '/favicon.ico',
            rel: 'icon',
            sizes: '32x32',
          },
          tag: 'link',
        },
        {
          attrs: {
            href: '/apple-touch-icon.png',
            rel: 'apple-touch-icon',
            sizes: '180x180',
          },
          tag: 'link',
        },
      ],
      plugins: [
        starlightUtils({
          multiSidebar: {
            switcherStyle: 'hidden',
          },
        }),
      ],
      routeMiddleware: './src/routeData.ts',
      sidebar: [
        {
          autogenerate: { directory: 'react-virtuoso' },
          collapsed: true,
          label: 'react-virtuoso',
        },
        {
          autogenerate: { directory: 'message-list' },
          collapsed: true,
          label: 'message-list',
        },
        {
          autogenerate: { directory: 'masonry' },
          collapsed: true,
          label: 'masonry',
        },
        {
          autogenerate: { directory: 'gurx' },
          collapsed: true,
          label: 'gurx',
        },
      ],
      social: [
        {
          href: 'https://github.com/withastro/starlight',
          icon: 'github',
          label: 'GitHub',
        },
      ],
      title: 'Virtuoso',
    }),
  ],
  markdown: {
    remarkPlugins: [remarkCustomCodeBlocks, [autoImports, autoImportConfig]],
  },
  redirects: {
    '/auto-resizing': '/react-virtuoso/virtuoso/auto-resizing',
    '/custom-scroll-container': '/react-virtuoso/virtuoso/custom-scroll-container',
    '/customize-structure': '/react-virtuoso/virtuoso/customize-rendering',
    '/endless-scrolling': '/react-virtuoso/virtuoso/endless-scrolling',
    '/footer': '/react-virtuoso/virtuoso/footer',
    '/grid-responsive-columns': '/react-virtuoso/virtuoso-grid/grid-responsive-columns',
    '/grouped-by-first-letter': '/react-virtuoso/grouped-virtuoso/grouped-by-first-letter',
    '/grouped-numbers': '/react-virtuoso/grouped-virtuoso/grouped-numbers',
    '/grouped-with-load-on-demand': '/react-virtuoso/grouped-virtuoso/grouped-with-load-on-demand',
    '/hello': '/react-virtuoso/virtuoso/basic-usage',
    '/hello-masonry': '/masonry',
    '/hello-table': '/react-virtuoso/table-virtuoso/basic-table',
    '/horizontal-mode': '/react-virtuoso/virtuoso/horizontal-mode',
    '/initial-index': '/react-virtuoso/virtuoso/initial-index',
    '/keyboard-navigation': '/react-virtuoso/virtuoso/keyboard-navigation',
    '/material-ui-endless-scrolling': '/react-virtuoso/third-party-integration/material-ui-endless-scrolling',
    '/migrate-v0-to-v1': '/react-virtuoso/changelog',
    '/mocking-in-tests': '/react-virtuoso/third-party-integration/mocking-in-tests',
    '/overscan': '/react-virtuoso',
    '/press-to-load-more': '/react-virtuoso/virtuoso/press-to-load-more',
    '/range-change-callback': '/react-virtuoso/virtuoso/range-change-callback',
    '/scroll-handling': '/react-virtuoso/virtuoso/scroll-handling',
    '/scroll-seek-placeholders': '/react-virtuoso/virtuoso/scroll-seek-placeholders',
    '/scroll-to-group': '/react-virtuoso/grouped-virtuoso/scroll-to-group',
    '/scroll-to-index': '/react-virtuoso/virtuoso/scroll-to-index',
    '/table-fixed-columns': '/react-virtuoso/table-virtuoso/table-fixed-columns',
    '/table-fixed-headers': '/react-virtuoso/table-virtuoso/table-fixed-headers',
    '/table-grouped': '/react-virtuoso/table-virtuoso/table-grouped',
    '/tanstack-table-integration': '/react-virtuoso/third-party-integration/tanstack-table-integration',
    '/top-items': '/react-virtuoso/virtuoso/top-items',
    '/troubleshooting': '/react-virtuoso/troubleshooting',
    '/virtuoso-api': '/react-virtuoso/api-reference/virtuoso',
    '/virtuoso-masonry-api': '/masonry/api-reference/virtuoso-masonry',
    '/virtuoso-message-list': '/message-list',
    '/virtuoso-message-list-api': '/message-list/api-reference',
    '/virtuoso-message-list/examples': '/message-list/examples/messaging',
    '/virtuoso-message-list/tutorial': '/message-list/tutorial/intro',
    '/window-scrolling': '/react-virtuoso/virtuoso/window-scrolling',
  },
  site: 'https://virtuoso.dev',
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@components': resolve(__dirname, './src/components'),
      },
    },
    ssr: {
      noExternal: ['monaco-editor'],
    },
  },
})
