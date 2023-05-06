// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'React Virtuoso',
  tagline: 'Powerful, simple, elegant virtualized React components',
  favicon: 'img/favicon.ico',
  url: 'https://virtuoso.dev',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  organizationName: 'petyosi', 
  projectName: 'react-virtuoso',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  staticDirectories: ['docusaurus/static'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          // Please change this to your repo.
          editUrl: 'https://github.com/petyosi/react-virtuoso/edit/master/',
          async sidebarItemsGenerator({defaultSidebarItemsGenerator, ...args}) {
            const sidebarItems = await defaultSidebarItemsGenerator(args);
            // @ts-ignore
            return sidebarItems.filter((item) => item.label !== 'API')
          },
        },
        blog: {
          routeBasePath: '/blog',
          showReadingTime: true,
          editUrl: 'https://github.com/petyosi/react-virtuoso/edit/master/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        gtag: {
          trackingID: 'G-FXF8T3XR4N',
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themes: ['./sandpack'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        disableSwitch: true,
      },

      sandpack: { theme: 'aqua-blue' },
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        logo: {
          alt: 'React Virtuoso',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'defaultSidebar',
            position: 'left',
            label: 'Docs',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/petyosi/react-virtuoso',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [],
        copyright: `Copyright © ${new Date().getFullYear()} Petyo Ivanov. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),

    plugins: [
    [
      'docusaurus-plugin-typedoc',
      // Plugin / TypeDoc options
      {
        entryPoints: ['./dist/index.d.ts'],
        tsconfig: './tsconfig.typedoc.json',
        excludeExternals: true,
      },
    ],
  ],
};

module.exports = config;
