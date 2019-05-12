import { configure, addParameters, addDecorator } from '@storybook/react'
import virtuoso from './theme'
import { addReadme } from 'storybook-readme'

// automatically import all files ending in *.stories.tsx
const req = require.context('../stories', true, /\.stories\.tsx$/)

function loadStories() {
  req.keys().forEach(req)
}

addDecorator(addReadme)

addParameters({
  options: {
    theme: virtuoso,
    enableShortcuts: false,
    panelPosition: 'right',
  },
})

configure(loadStories, module)
