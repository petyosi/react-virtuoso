import * as u from './urx'

export const contextSystem = u.system(() => {
  const context = u.statefulStream<unknown>(null)

  return {
    context,
  }
})
