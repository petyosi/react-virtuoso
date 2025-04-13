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
    expect(r.getValue(query$)).toMatchObject({ data: null, error: null, isLoading: true, type: 'loading' })
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(sub).toHaveBeenCalledTimes(1)
    expect(sub).toHaveBeenCalledWith({ data: 'hello 2', error: null, isLoading: false, type: 'success' })
    r.pub(query$, 4)
    expect(sub).toHaveBeenCalledTimes(2)
    expect(sub).toHaveBeenCalledWith({ data: null, error: null, isLoading: true, type: 'loading' })
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(sub).toHaveBeenCalledWith({ data: 'hello 4', error: null, isLoading: false, type: 'success' })
  })
})
