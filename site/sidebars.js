module.exports = {
  someSidebar: {
    Introduction: ['getting-started', 'troubleshooting', 'migrate-v0-to-v1'],
    Basics: [
      'hello',
      'top-items',
      'footer',
      'auto-resizing',
      'scroll-handling',
      'scroll-to-index',
      'initial-index',
      'range-change-callback',
    ],
    'Grouped Mode': ['grouped-numbers', 'grouped-by-first-letter', 'grouped-with-load-on-demand', 'scroll-to-group'],
    Table: ['hello-table', 'table-fixed-headers', 'mui-table-virtual-scroll', 'table-fixed-columns', 'react-table-integration'],
    Grid: ['grid-responsive-columns'],
    Scenarios: [
      'press-to-load-more',
      'endless-scrolling',
      'prepend-items',
      'stick-to-bottom',
      'scroll-seek-placeholders',
      'material-ui-endless-scrolling',
      'react-sortable-hoc',
      'react-beautiful-dnd',
      'window-scrolling',
      'keyboard-navigation',
      'react-beautiful-dnd-window-scroller',
      'mocking-in-tests',
    ],
    'Customize Markup': ['custom-scroll-container', 'customize-structure'],
    'API Reference': ['virtuoso-api-reference', 'virtuoso-grid-api-reference', 'table-virtuoso-api-reference'],
    Interfaces: require('./typedoc-sidebar.js')[3].items.filter(
      (item) => !/handle|virtuosoprops|virtuosogridprops|groupedvirtuosoprops|virtuosotableprops/.test(item)
    ),
  },
}
