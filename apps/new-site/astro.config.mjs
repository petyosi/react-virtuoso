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
        },
        {
          dest: 'react-virtuoso',
          path: '../../packages/react-virtuoso/docs',
        },
        {
          dest: 'masonry',
          file: '../../packages/masonry/README.md',
        },
        {
          dest: 'masonry',
          path: '../../packages/masonry/docs',
        },
        {
          dest: 'gurx',
          file: '../../packages/gurx/README.md',
        },
        {
          dest: 'gurx',
          path: '../../packages/gurx/docs',
        },
        {
          dest: 'message-list',
          file: '../../packages/message-list/README.md',
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
        SiteTitle: './src/components/SiteTitle.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
      customCss: ['@fontsource/ibm-plex-mono/400.css', '@fontsource/ibm-plex-mono/600.css', './src/styles/global.css'],
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
