const path = require('path')

module.exports = {
  title: 'React Virtuoso',
  tagline: 'Powerful, Elegant and Simple Virtual List for React',
  url: 'https://virtuoso.dev',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',
  organizationName: 'petyosi', // Usually your GitHub org/user name.
  projectName: 'react-virtuoso', // Usually your repo name.
  themeConfig: {
    googleAnalytics: { trackingID: 'UA-140068800-1' },
    navbar: {
      title: '',
      logo: {
        alt: 'React Virtuoso',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/',
          label: 'Docs',
        },
        {
          to: 'blog',
          label: 'Blog',
        },
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
  },
  themes: ['./docusaurus-theme-live-codeblock'],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          // Please change this to your repo.
          editUrl: 'https://github.com/petyosi/react-virtuoso/edit/master/site/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl: 'https://github.com/facebook/docusaurus/edit/master/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        // Plugin options
        inputFiles: ['../src/index.tsx'],
        exclude: ['../src/hooks/**', '../src/AATree.ts', '../src/*System.ts', '../src/utils/**', '../src/+(Grid|List).tsx'],

        jsx: 'react',
        tsconfig: '../tsconfig.json',
        ignoreCompilerErrors: true,
        excludeNotExported: true,
        hideProjectName: true,
        hideBreadcrumbs: true,
      },
    ],
  ],
}
