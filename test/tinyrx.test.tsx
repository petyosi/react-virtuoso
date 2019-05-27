import { subject, map, scan, withLatestFrom, debounceTime, mapTo, skip, filter, combineLatest } from '../src/tinyrx'

describe('tinyrx', () => {
  describe('subject', () => {
    it('emits what is pushed if subscribed before the push', done => {
      const { next, subscribe } = subject<number>()

      subscribe(val => {
        expect(val).toEqual(1)
        done()
      })
      next(1)
    })

    it('emits what is pushed if subscribed after the push', done => {
      const { next, subscribe } = subject<number>()

      next(1)

      subscribe(val => {
        expect(val).toEqual(1)
        done()
      })
    })

    describe('pipe', () => {
      it('supports transformations', done => {
        const { next, pipe } = subject<number>()

        next(1)

        pipe(map(val => val + 1)).subscribe(val => {
          expect(val).toEqual(2)
          done()
        })
      })

      it('supports multiple transformations', done => {
        const { next, pipe } = subject<number>()

        next(1)

        pipe(
          map(val => val + 1),
          map(val => val * 2),
          map(val => '---' + val + '---')
        ).subscribe(val => {
          expect(val).toEqual('---4---')
          done()
        })
      })
    })
  })

  describe('combineLatest', () => {
    it('publishes latest values for two observables', () => {
      const s1 = subject<number>()
      const s2 = subject<number>()

      combineLatest(s1, s2).subscribe(values => {
        expect(values[0]).toEqual(1)
        expect(values[1]).toEqual(2)
      })

      s1.next(1)
      s2.next(2)
    })
  })

  describe('operators', () => {
    it('scan passes previous value', () => {
      const s1 = subject<number>()

      let result = 0
      s1.pipe(scan((prevVal, val) => val + prevVal, 0)).subscribe(val => {
        result = val
      })

      s1.next(1)
      s1.next(2)
      s1.next(3)
      s1.next(4)
      expect(result).toEqual(10)
    })

    it('withLatestFrom picks the values from the given sources', done => {
      const s1 = subject<number>()
      const s4 = subject<number>()
      const s2 = subject<string>()
      const s3 = subject<string>()

      combineLatest(s1, s4)
        .pipe(withLatestFrom(s2, s3))
        .subscribe(vals => {
          expect(vals).toEqual([[1, 2], 'a', 'b'])
          done()
        })

      s2.next('a')
      s3.next('b')
      s1.next(1)
      s4.next(2)
    })

    it('debounceTime delays the execution', done => {
      const s1 = subject<number>()

      s1.next(1)
      setTimeout(() => s1.next(2), 20)
      setTimeout(() => s1.next(3), 20)

      s1.pipe(debounceTime(100)).subscribe(val => {
        expect(val).toEqual(3)
        done()
      })
    })

    it('mapTo converts to the passed value', () => {
      const s1 = subject<number>()

      s1.pipe(mapTo(3)).subscribe(val => expect(val).toEqual(3))
      s1.next(1)
    })

    it('skip skips given amount of values', () => {
      const s1 = subject<number>()

      s1.pipe(skip(2)).subscribe(val => expect(val).toEqual(3))
      s1.next(1)
      s1.next(2)
      s1.next(3)
    })

    it('filter uses predicate to filter', () => {
      const s1 = subject<number>()

      s1.pipe(filter(val => val % 2 == 0)).subscribe(val => expect(val).toEqual(2))
      s1.next(1)
      s1.next(2)
    })
  })
})
