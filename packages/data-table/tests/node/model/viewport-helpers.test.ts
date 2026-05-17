import { describe, expect, it } from 'vitest'

import { defaultAppendViewportHandler, defaultOffsetViewportHandler } from '../../../src/model/remote-model'

import type { AppendViewportContext, OffsetViewportContext } from '../../../src/model/remote-model'

function offsetCtx(overrides: Partial<OffsetViewportContext>): OffsetViewportContext {
  return {
    startIndex: 0,
    endIndex: 19,
    totalCount: 500,
    loadedRanges: [],
    params: {},
    pageSize: 20,
    ...overrides,
  }
}

function appendCtx(overrides: Partial<AppendViewportContext>): AppendViewportContext {
  return {
    startIndex: 0,
    endIndex: 19,
    loadedCount: 50,
    hasMore: true,
    fetching: false,
    params: {},
    pageSize: 20,
    ...overrides,
  }
}

describe(defaultOffsetViewportHandler, () => {
  it('returns single gap when nothing is loaded', () => {
    const result = defaultOffsetViewportHandler(offsetCtx({ loadedRanges: [] }))
    expect(result).toEqual({ fetch: [{ offset: 0, limit: 20 }] })
  })

  it('returns multiple gaps for sparse loaded ranges', () => {
    const result = defaultOffsetViewportHandler(
      offsetCtx({
        startIndex: 0,
        endIndex: 199,
        loadedRanges: [
          { offset: 0, limit: 50 },
          { offset: 100, limit: 50 },
        ],
        pageSize: 50,
      })
    )
    expect(result).toEqual({
      fetch: [
        { offset: 50, limit: 50 },
        { offset: 150, limit: 50 },
      ],
    })
  })

  it('returns void when range is fully loaded', () => {
    const result = defaultOffsetViewportHandler(
      offsetCtx({
        startIndex: 0,
        endIndex: 19,
        loadedRanges: [{ offset: 0, limit: 50 }],
        pageSize: 20,
      })
    )
    expect(result).toBeUndefined()
  })

  it('aligns to page boundaries', () => {
    const result = defaultOffsetViewportHandler(
      offsetCtx({
        startIndex: 13,
        endIndex: 37,
        loadedRanges: [],
        pageSize: 20,
      })
    )
    // pageStart = floor(13/20)*20 = 0, pageEnd = ceil(38/20)*20 = 40
    expect(result).toEqual({ fetch: [{ offset: 0, limit: 40 }] })
  })

  it('returns trailing gap only', () => {
    const result = defaultOffsetViewportHandler(
      offsetCtx({
        startIndex: 0,
        endIndex: 80,
        loadedRanges: [{ offset: 0, limit: 50 }],
        pageSize: 50,
      })
    )
    // pageEnd = ceil(81/50)*50 = 100
    expect(result).toEqual({ fetch: [{ offset: 50, limit: 50 }] })
  })

  it('returns leading gap only', () => {
    const result = defaultOffsetViewportHandler(
      offsetCtx({
        startIndex: 40,
        endIndex: 80,
        loadedRanges: [{ offset: 50, limit: 50 }],
        pageSize: 50,
      })
    )
    // pageStart = floor(40/50)*50 = 0
    expect(result).toEqual({ fetch: [{ offset: 0, limit: 50 }] })
  })

  it('returns gaps even beyond totalCount', () => {
    const result = defaultOffsetViewportHandler(
      offsetCtx({
        startIndex: 90,
        endIndex: 110,
        totalCount: 100,
        loadedRanges: [],
        pageSize: 50,
      })
    )
    // pageStart = floor(90/50)*50 = 50, pageEnd = ceil(111/50)*50 = 150
    expect(result).toEqual({ fetch: [{ offset: 50, limit: 100 }] })
  })
})

describe(defaultAppendViewportHandler, () => {
  it('returns loadMore when near end', () => {
    // endIndex=45 >= loadedCount(50) - floor(20/2) = 40
    const result = defaultAppendViewportHandler(appendCtx({ endIndex: 45 }))
    expect(result).toEqual({ loadMore: true })
  })

  it('returns void when not near end', () => {
    const result = defaultAppendViewportHandler(appendCtx({ endIndex: 10 }))
    expect(result).toBeUndefined()
  })

  it('returns void when fetching', () => {
    const result = defaultAppendViewportHandler(appendCtx({ endIndex: 45, fetching: true }))
    expect(result).toBeUndefined()
  })

  it('returns void when hasMore is false', () => {
    const result = defaultAppendViewportHandler(appendCtx({ endIndex: 45, hasMore: false }))
    expect(result).toBeUndefined()
  })

  it('returns loadMore at exact threshold boundary', () => {
    // endIndex=40 >= 50 - floor(20/2) = 40
    const result = defaultAppendViewportHandler(appendCtx({ endIndex: 40 }))
    expect(result).toEqual({ loadMore: true })
  })

  it('returns void one below threshold', () => {
    // endIndex=39 < 50 - 10 = 40
    const result = defaultAppendViewportHandler(appendCtx({ endIndex: 39 }))
    expect(result).toBeUndefined()
  })
})
