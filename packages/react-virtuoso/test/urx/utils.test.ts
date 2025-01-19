import { call, joinProc } from '../../src/urx'
import { describe, it, expect, vi } from 'vitest'

describe('utils', () => {
  describe('call', () => {
    it('calls the argument', () => {
      const proc = vi.fn()
      call(proc)
      expect(proc).toHaveBeenCalledTimes(1)
    })
  })

  describe('joinProc', () => {
    it('calls all procs passed', () => {
      const proc1 = vi.fn()
      const proc2 = vi.fn()
      const proc = joinProc(proc1, proc2)
      proc()
      expect(proc1).toHaveBeenCalledTimes(1)
      expect(proc2).toHaveBeenCalledTimes(1)
    })
  })
})
