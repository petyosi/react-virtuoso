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
    ],
    'Customize Markup': ['custom-scroll-container', 'customize-structure'],
    Grid: ['grid-responsive-columns'],
    'API Reference': ['virtuoso-api-reference', 'virtuoso-grid-api-reference'],
    Interfaces: require('./typedoc-sidebar.js')[3].items.filter(
      item => !/handle|virtuosoprops|virtuosogridprops|groupedvirtuosoprops/.test(item)
    ),
  },
}
