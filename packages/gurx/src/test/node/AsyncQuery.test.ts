import { describe, expect, it, vi } from 'vitest'
import { AsyncQuery, Realm } from '../..'

describe('AsyncQuery', () => {
  it('should work', async () => {
    const query$ = AsyncQuery(async (params: number) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve(`hello ${params}`)
        }, 50)
      })
    }, 2)

    const r = new Realm()
    const sub = vi.fn()
    r.sub(query$, sub)
    expect(r.getValue(query$)).toMatchObject({ type: 'loading', isLoading: true, data: null, error: null })
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(sub).toHaveBeenCalledTimes(1)
    expect(sub).toHaveBeenCalledWith({ type: 'success', isLoading: false, data: 'hello 2', error: null })
    r.pub(query$, 4)
    expect(sub).toHaveBeenCalledTimes(2)
    expect(sub).toHaveBeenCalledWith({ type: 'loading', isLoading: true, data: null, error: null })
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(sub).toHaveBeenCalledWith({ type: 'success', isLoading: false, data: 'hello 4', error: null })
  })
})
