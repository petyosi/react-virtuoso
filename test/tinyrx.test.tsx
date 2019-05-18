import {
  mySubject,
  map,
  combineOperators,
  audit,
  distinctUntilChanged,
  scan,
  withLatestFrom,
  debounceTime,
  mapTo,
  skip,
  filter,
  combineLatest,
} from '../src/tinyrx'

describe('tinyrx', () => {
  describe('subject', () => {
    it('emits what is pushed if subscribed before the push', done => {
      const { next, subscribe } = mySubject<number>()

      subscribe(val => {
        expect(val).toEqual(1)
        done()
      })
      next(1)
    })

    it('emits what is pushed if subscribed after the push', done => {
      const { next, subscribe } = mySubject<number>()

      next(1)

      subscribe(val => {
        expect(val).toEqual(1)
        done()
      })
    })

    describe('pipe', () => {
      it('supports transformations', done => {
        const { next, pipe } = mySubject<number>()

        next(1)

        pipe(map(val => val + 1)).subscribe(val => {
          expect(val).toEqual(2)
          done()
        })
      })

      it('supports multiple transformations', done => {
        const { next, pipe } = mySubject<number>()

        next(1)

        const op = combineOperators(map((val: number) => val + 1), map(val => val * 2), map(val => '---' + val + '---'))

        pipe(op).subscribe(val => {
          expect(val).toEqual('---4---')
          done()
        })
      })
    })
  })

  describe('combineLatest', () => {
    it('publishes latest values for two observables', () => {
      const s1 = mySubject<number>()
      const s2 = mySubject<number>()

      combineLatest(s1.subscribe, s2.subscribe).subscribe((values: any[]) => {
        expect(values[0]).toEqual(1)
        expect(values[1]).toEqual(2)
      })

      s1.next(1)
      s2.next(2)
    })
  })

  describe('operators', () => {
    it('audit delays the call to the next tick', done => {
      const s1 = mySubject<number>()

      s1.pipe(audit()).subscribe(val => {
        expect(val).toEqual(2)
        done()
      })

      s1.next(0)
      s1.next(1)
      s1.next(2)
    })

    it('distinctUntilChanged omits the same values', () => {
      const s1 = mySubject<number>()

      let calls = 0
      s1.pipe(distinctUntilChanged()).subscribe(() => {
        calls++
      })

      s1.next(0)
      s1.next(0)
      s1.next(1)
      s1.next(1)
      s1.next(2)
      expect(calls).toEqual(3)
    })

    it('scan passes previous value', () => {
      const s1 = mySubject<number>()

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
      const s1 = mySubject<number>()
      const s4 = mySubject<number>()
      const s2 = mySubject<string>()
      const s3 = mySubject<string>()

      combineLatest(s1.subscribe, s4.subscribe)
        .pipe(withLatestFrom(s2.subscribe, s3.subscribe))
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
      const s1 = mySubject<number>()

      s1.next(1)
      setTimeout(() => s1.next(2), 20)
      setTimeout(() => s1.next(3), 20)

      s1.pipe(debounceTime(100)).subscribe(val => {
        expect(val).toEqual(3)
        done()
      })
    })

    it('mapTo converts to the passed value', () => {
      const s1 = mySubject<number>()

      s1.pipe(mapTo(3)).subscribe(val => expect(val).toEqual(3))
      s1.next(1)
    })

    it('skip skips given amount of values', () => {
      const s1 = mySubject<number>()

      s1.pipe(skip(2)).subscribe(val => expect(val).toEqual(3))
      s1.next(1)
      s1.next(2)
      s1.next(3)
    })

    it('filter uses predicate to filter', () => {
      const s1 = mySubject<number>()

      s1.pipe(filter(val => val % 2 == 0)).subscribe(val => expect(val).toEqual(2))
      s1.next(1)
      s1.next(2)
    })

    /*
    it.only('filter uses predicate to filter (advanced)', done => {
      const s1 = mySubject<number>()
      const q = mySubject(2)

      s1.pipe(
        combineOperators(
          filter(val => val % 2 == 0),
          map(val => {
            return val
          }),
          withLatestFrom(q.subscribe)
          map(([a, b]) => {
            // console.log({ a, b })
            return a + b
          })
        )
      ).subscribe(val => {
        console.log({ val })
        done()
      })

      s1.next(1)
      s1.next(2)
      // s1.next(2)
      // s1.next(3)
    })
    */
  })
})
