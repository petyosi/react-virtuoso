import { describe, it } from 'vitest'

import { CC, Tracer } from '../../Tracer'

describe('tracer', () => {
  it('logs a message', () => {
    const tracer = new Tracer(console)
    tracer.log('Hello, world! ', CC.blue('This is a test'), ' ', CC.bold('Bold text'), ' ', CC.red('Error!'))
  })

  it('indents with a span', () => {
    const tracer = new Tracer(console)
    {
      using _t = tracer.span('Starting a span', CC.green('This is inside the span'))
      {
        using _t = tracer.span('Starting a second-level span')
        tracer.log('Inside the span', CC.magenta('moo'))
      }
    }
    tracer.log('Back to the first level', CC.yellow('Still inside the first span'))
  })
})
