import { addons } from '@storybook/addons'
import { STORY_CHANGED, STORY_ERRORED, STORY_MISSING } from '@storybook/core-events'

import ReactGA from 'react-ga'

addons.register('storybook/google-analytics', api => {
  ReactGA.initialize('UA-140068800-1')

  api.on(STORY_CHANGED, () => {
    const { path } = api.getUrlState()
    ReactGA.pageview(path)
  })
  api.on(STORY_ERRORED, ({ description }) => {
    ReactGA.exception({
      description,
      fatal: true,
    })
  })
})
