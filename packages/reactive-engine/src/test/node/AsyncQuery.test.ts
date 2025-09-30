import { describe, expect, it, vi } from 'vitest'

import { Engine } from '../../Engine'
import { AsyncQuery } from '../../extras'

describe('AsyncQuery', () => {
  it('should work', async () => {
    const [input$, output$] = AsyncQuery(async (params: number) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve(`hello ${params}`)
        }, 50)
      })
    }, 2)

    const engine = new Engine()
    const sub = vi.fn()
    engine.sub(output$, sub)
    expect(engine.getValue(output$)).toMatchObject({ data: null, error: null, isLoading: true, type: 'loading' })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(sub).toHaveBeenCalledTimes(1)
    expect(sub).toHaveBeenCalledWith({ data: 'hello 2', error: null, isLoading: false, type: 'success' }, engine)

    engine.pub(input$, 4)

    expect(sub).toHaveBeenCalledTimes(2)
    expect(sub).toHaveBeenCalledWith({ data: null, error: null, isLoading: true, type: 'loading' }, engine)

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(sub).toHaveBeenCalledWith({ data: 'hello 4', error: null, isLoading: false, type: 'success' }, engine)
  })
})
