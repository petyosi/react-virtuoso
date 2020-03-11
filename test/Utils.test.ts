import { simpleMemoize } from '../src/Utils'

describe('Simple Memoize', () => {
  it('caches the result', () => {
    const func = jest.fn(() => {
      return 'foo'
    })

    const memoFunc = simpleMemoize(func)
    const result = memoFunc()
    const result2 = memoFunc()

    expect(result).toBe('foo')
    expect(result2).toBe('foo')

    expect(func).toHaveBeenCalledTimes(1)
  })
})
