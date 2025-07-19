import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import dotenv from 'dotenv'
import type * as Preset from '@docusaurus/preset-classic'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'

if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.local' })
}

const config: Config = {
  title: 'React Virtuoso',
  tagline: 'Powerful React components for virtualized rendering',
  customFields: {
    paddle: {
      environment: process.env.PADDLE_ENVIRONMENT,
      token: process.env.PADDLE_TOKEN,
      standardPriceId: process.env.PADDLE_STANDARD_PRICE_ID,
      proPriceId: process.env.PADDLE_PRO_PRICE_ID,
    },
  },

  url: 'https://virtuoso.dev',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  organizationName: 'petyosi',
  trailingSlash: true,
  projectName: 'react-virtuoso',
  favicon: 'img/favicon.ico',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // themes: ["@docusaurus/theme-live-codeblock"],

  plugins: [
    () => {
      return {
        name: 'monaco-webpack-plugin',
        configureWebpack() {
          return {
            plugins: [
              new MonacoWebpackPlugin({
                // available options are documented at https://github.com/microsoft/monaco-editor/blob/main/webpack-plugin/README.md#options
                languages: ['json', 'typescript'],
              }),
            ],
          }
        },
      }
    },
    // @ts-expect-error Not sure why docusaurus does not like the return value, but it works
    () => {
      return {
        name: 'silence-observer-error',
        configureWebpack() {
          return {
            devServer: {
              client: {
                overlay: {
                  errors: false,
                  warnings: false,
                  runtimeErrors: (error: Error) => {
                    if (error.message.includes('ResizeObserver loop')) {
                      return false
                    } else {
                      return true
                    }
                  },
                },
              },
            },
          }
        },
      }
    },
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'react-virtuoso',
        // TypeDoc options
        entryPoints: ['../../packages/react-virtuoso/src/index.tsx'],
        tsconfig: '../../packages/react-virtuoso/tsconfig.json',

        // Plugin options
        out: 'docs/virtuoso-api',
        plugin: ['typedoc-plugin-no-inherit'],

        excludeExternals: false,
        excludePrivate: true,
        excludeInternal: true,
        categorizeByGroup: true,
        useHTMLEncodedBrackets: false,
        groupOrder: ['Functions', 'Variables', 'Interfaces', 'Type Aliases', '*'],

        disableSources: true,
        // allReflectionsHaveOwnDocument: true,
        hideBreadcrumbs: true,
        readme: 'none',
        sort: 'kind',
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: '@virtuoso.dev/message-list',
        // TypeDoc options
        entryPoints: ['../../node_modules/@virtuoso.dev/message-list/dist/index.d.ts'],
        tsconfig: 'tsconfig.message-list.json',

        // Plugin options
        out: 'docs/virtuoso-message-list-api',
        plugin: ['typedoc-plugin-no-inherit'],

        excludeExternals: false,
        excludePrivate: true,
        excludeInternal: true,
        categorizeByGroup: true,
        useHTMLEncodedBrackets: false,
        groupOrder: ['Functions', 'Variables', 'Interfaces', 'Type Aliases', '*'],

        disableSources: true,
        // allReflectionsHaveOwnDocument: true,
        hideBreadcrumbs: true,
        readme: 'none',
        sort: 'kind',
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: '@virtuoso.dev/masonry',
        // TypeDoc options
        entryPoints: ['../../node_modules/@virtuoso.dev/masonry/dist/index.d.ts'],
        tsconfig: 'tsconfig.masonry.json',

        // Plugin options
        out: 'docs/virtuoso-masonry-api',
        plugin: ['typedoc-plugin-no-inherit'],

        excludeExternals: false,
        excludePrivate: true,
        excludeInternal: true,
        categorizeByGroup: true,
        useHTMLEncodedBrackets: false,
        groupOrder: ['Functions', 'Variables', 'Interfaces', 'Type Aliases', '*'],

        disableSources: true,
        // allReflectionsHaveOwnDocument: true,
        hideBreadcrumbs: true,
        readme: 'none',
        sort: 'kind',
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          // /docs/oldDoc -> /docs/newDoc
          {
            from: '/virtuoso-api-reference/',
            to: '/virtuoso-api/',
          },
          {
            from: '/table-virtuoso-api-reference/',
            to: '/virtuoso-api/',
          },
          {
            from: '/virtuoso-grid-api-reference/',
            to: '/virtuoso-api/',
          },
          {
            from: '/prepend-items',
            to: '/virtuoso-message-list/',
          },
          {
            from: '/stick-to-bottom/',
            to: '/virtuoso-message-list/',
          },
        ],
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        gtag: {
          trackingID: 'G-FXF8T3XR4N',
          anonymizeIP: true,
        },
        theme: {
          customCss: ['./src/css/custom.css', '../../node_modules/@radix-ui/themes/styles.css'],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/social-card.jpg',
    algolia: {
      // The application ID provided by Algolia
      appId: '4WOO4PYOJ1',

      // Public API key: it is safe to commit it
      apiKey: '58ec33a27668285517259ebd5a1d4e77',

      indexName: 'virtuoso',
      contextualSearch: false,
      searchParameters: {
        facetFilters: [],
      },
    },
    navbar: {
      logo: {
        alt: 'React Virtuoso',
        src: 'img/new-logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guidesSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'virtuosoApiSidebar',
          position: 'left',
          label: 'Virtuoso API',
        },
        {
          type: 'docSidebar',
          sidebarId: 'messageListApiSidebar',
          position: 'left',
          label: 'Virtuoso Message List API',
        },
        {
          type: 'docSidebar',
          sidebarId: 'masonryApiSidebar',
          position: 'left',
          label: 'Virtuoso Masonry API',
        },
        {
          to: '/pricing',
          label: 'Pricing',
          position: 'left',
        },
        {
          href: 'https://github.com/petyosi/react-virtuoso',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'External Links',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/petyosi/react-virtuoso',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/petyosi',
            },
          ],
        },
        {
          title: 'Support',
          items: [
            {
              label: 'support@virtuoso.dev',
              href: 'mailto:support@virtuoso.dev',
            },
          ],
        },
        {
          title: 'Legal',
          items: [
            {
              label: 'Terms of use',
              href: '/terms-of-use',
            },
            {
              label: 'Privacy Policy',
              href: '/privacy-policy',
            },
            {
              label: 'EULA',
              href: '/message-list-eula',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Martiti 2 Ltd. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
