/// <reference types="@vitest/browser/matchers" />

import React from 'react'

import { Cell, Stream } from '@virtuoso.dev/reactive-engine-core'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { EngineProvider, useEngine, useEngineLayoutSubscription, useEngineSubscription } from '../../'

import type { Engine, Out, Subscription } from '@virtuoso.dev/reactive-engine-core'

function trackSubscriptionLifecycle(engine: Engine) {
  const originalSub = engine.sub.bind(engine)
  let calls = 0
  let cleanups = 0

  engine.sub = <T,>(node: Out<T>, subscription: Subscription<T>) => {
    calls++
    const unsubscribe = originalSub(node, subscription)
    let active = true
    return () => {
      if (active) {
        active = false
        cleanups++
      }
      unsubscribe()
    }
  }

  return {
    active: () => calls - cleanups,
    calls: () => calls,
    cleanups: () => cleanups,
  }
}

describe('stable engine subscriptions', () => {
  it.each([
    ['passive', useEngineSubscription],
    ['layout', useEngineLayoutSubscription],
  ] as const)('delivers future events and the emitting engine through the %s hook without replay', async (_name, useSubscription) => {
    const event$ = Stream<string>(false)
    const records: { engine: Engine; value: string }[] = []
    let engine: Engine | undefined

    const Subscriber = () => {
      useSubscription(event$, (value, emittingEngine) => records.push({ engine: emittingEngine, value }))
      return null
    }

    await render(
      <EngineProvider initFn={(currentEngine) => (engine = currentEngine)}>
        <Subscriber />
      </EngineProvider>
    )

    expect(records).toEqual([])
    engine!.pub(event$, 'next')
    expect(records).toEqual([{ engine, value: 'next' }])
  })

  it.each([
    ['passive', useEngineSubscription],
    ['layout', useEngineLayoutSubscription],
  ] as const)('does not replay a populated Cell through the %s hook', async (_name, useSubscription) => {
    const state$ = Cell('current')
    const records: string[] = []
    let engine: Engine | undefined

    const Subscriber = () => {
      useSubscription(state$, (value) => records.push(value))
      return null
    }

    await render(
      <EngineProvider initFn={(currentEngine) => (engine = currentEngine)}>
        <Subscriber />
      </EngineProvider>
    )

    expect(records).toEqual([])
    engine!.pub(state$, 'next')
    expect(records).toEqual(['next'])
  })

  it.each([
    ['passive', useEngineSubscription],
    ['layout', useEngineLayoutSubscription],
  ] as const)('uses the latest committed callback without resubscribing the %s hook', async (_name, useSubscription) => {
    const event$ = Stream<string>(false)
    const records: string[] = []
    let engine: Engine | undefined
    let subCallCount = () => 0

    const Subscriber = ({ label }: { label: string }) => {
      useSubscription(event$, (value) => records.push(`${label}:${value}`))
      return null
    }
    const App = ({ label }: { label: string }) => (
      <EngineProvider
        initFn={(currentEngine) => {
          engine = currentEngine
          const subSpy = vi.spyOn(currentEngine, 'sub')
          subCallCount = () => subSpy.mock.calls.length
        }}
      >
        <Subscriber label={label} />
      </EngineProvider>
    )

    const screen = await render(<App label="old" />)
    expect(subCallCount()).toBe(1)

    await screen.rerender(<App label="new" />)
    expect(subCallCount()).toBe(1)

    engine!.pub(event$, 'value')
    expect(records).toEqual(['new:value'])
  })

  it.each([
    ['passive', useEngineSubscription],
    ['layout', useEngineLayoutSubscription],
  ] as const)('commits a new %s callback before a later same-component layout publication', async (_name, useSubscription) => {
    const event$ = Stream<string>(false)
    const records: string[] = []

    const Subscriber = ({ label, publish }: { label: string; publish: boolean }) => {
      const engine = useEngine()
      useSubscription(event$, (value) => records.push(`${label}:${value}`))
      React.useLayoutEffect(() => {
        if (publish) {
          engine.pub(event$, 'same-commit')
        }
      }, [engine, publish])
      return null
    }
    const App = ({ label, publish }: { label: string; publish: boolean }) => (
      <EngineProvider>
        <Subscriber label={label} publish={publish} />
      </EngineProvider>
    )

    const screen = await render(<App label="old" publish={false} />)
    await screen.rerender(<App label="new" publish />)
    expect(records).toEqual(['new:same-commit'])
  })

  it.each([
    ['passive', useEngineSubscription],
    ['layout', useEngineLayoutSubscription],
  ] as const)('moves the %s hook when its node changes and cleans up on unmount', async (_name, useSubscription) => {
    const first$ = Stream<string>(false)
    const second$ = Stream<string>(false)
    const records: string[] = []
    let engine: Engine | undefined
    let lifecycle: ReturnType<typeof trackSubscriptionLifecycle> | undefined

    const Subscriber = ({ node }: { node: typeof first$ }) => {
      useSubscription(node, (value) => records.push(value))
      return null
    }
    const App = ({ node, show = true }: { node: typeof first$; show?: boolean }) => (
      <EngineProvider
        initFn={(currentEngine) => {
          engine = currentEngine
          lifecycle = trackSubscriptionLifecycle(currentEngine)
        }}
      >
        {show ? <Subscriber node={node} /> : null}
      </EngineProvider>
    )

    const screen = await render(<App node={first$} />)
    expect(lifecycle?.active()).toBe(1)
    engine!.pub(first$, 'first')

    await screen.rerender(<App node={second$} />)
    expect(lifecycle?.calls()).toBe(2)
    expect(lifecycle?.cleanups()).toBe(1)
    expect(lifecycle?.active()).toBe(1)
    engine!.pub(first$, 'stale')
    engine!.pub(second$, 'second')

    await screen.rerender(<App node={second$} show={false} />)
    expect(lifecycle?.calls()).toBe(2)
    expect(lifecycle?.cleanups()).toBe(2)
    expect(lifecycle?.active()).toBe(0)
    engine!.pub(second$, 'after-unmount')
    expect(records).toEqual(['first', 'second'])
  })

  it.each([
    ['passive', useEngineSubscription, []],
    ['layout', useEngineLayoutSubscription, ['second:new-layout']],
  ] as const)(
    'does not deliver an obsolete node during the %s hook replacement commit',
    async (_name, useSubscription, expectedAfterLayout) => {
      const first$ = Stream<string>(false)
      const second$ = Stream<string>(false)
      const records: string[] = []
      let engine: Engine | undefined

      const Subscriber = ({ node, publishInLayout }: { node: typeof first$; publishInLayout: boolean }) => {
        const currentEngine = useEngine()
        useSubscription(node, (value) => records.push(`${node === first$ ? 'first' : 'second'}:${value}`))
        React.useLayoutEffect(() => {
          if (publishInLayout) {
            currentEngine.pub(first$, 'old-layout')
            currentEngine.pub(second$, 'new-layout')
          }
        }, [currentEngine, publishInLayout])
        return null
      }
      const App = ({ node, publishInLayout }: { node: typeof first$; publishInLayout: boolean }) => (
        <EngineProvider initFn={(currentEngine) => (engine = currentEngine)}>
          <Subscriber node={node} publishInLayout={publishInLayout} />
        </EngineProvider>
      )

      const screen = await render(<App node={first$} publishInLayout={false} />)
      await screen.rerender(<App node={second$} publishInLayout />)
      expect(records).toEqual(expectedAfterLayout)

      engine!.pub(second$, 'later')
      expect(records).toEqual([...expectedAfterLayout, 'second:later'])
    }
  )

  it.each([
    ['passive', useEngineSubscription],
    ['layout', useEngineLayoutSubscription],
  ] as const)('follows replacement nearest providers for the %s hook', async (_name, useSubscription) => {
    const event$ = Stream<string>(false)
    const records: { engine: Engine; value: string }[] = []
    const engines: Engine[] = []
    const lifecycles: ReturnType<typeof trackSubscriptionLifecycle>[] = []

    const Subscriber = () => {
      useSubscription(event$, (value, engine) => records.push({ engine, value }))
      return null
    }
    const App = ({ engineKey }: { engineKey: string }) => (
      <EngineProvider
        key={engineKey}
        initFn={(engine) => {
          engines.push(engine)
          lifecycles.push(trackSubscriptionLifecycle(engine))
        }}
      >
        <Subscriber />
      </EngineProvider>
    )

    const screen = await render(<App engineKey="first" />)
    const firstEngine = engines[0]!
    firstEngine.pub(event$, 'first')

    await screen.rerender(<App engineKey="second" />)
    const secondEngine = engines.at(-1)!
    expect(lifecycles[0]?.calls()).toBe(1)
    expect(lifecycles[0]?.cleanups()).toBe(1)
    expect(lifecycles[0]?.active()).toBe(0)
    expect(lifecycles.at(-1)?.active()).toBe(1)
    secondEngine.pub(event$, 'second')

    expect(secondEngine).not.toBe(firstEngine)
    expect(records).toEqual([
      { engine: firstEngine, value: 'first' },
      { engine: secondEngine, value: 'second' },
    ])

    await screen.rerender(<div />)
    expect(lifecycles.at(-1)?.calls()).toBe(1)
    expect(lifecycles.at(-1)?.cleanups()).toBe(1)
    expect(lifecycles.at(-1)?.active()).toBe(0)
  })

  it('uses the nearest nested provider', async () => {
    const event$ = Stream<string>(false)
    const records: { engine: Engine; value: string }[] = []
    let outerEngine: Engine | undefined
    let innerEngine: Engine | undefined

    const Subscriber = () => {
      useEngineSubscription(event$, (value, engine) => records.push({ engine, value }))
      return null
    }

    await render(
      <EngineProvider initFn={(engine) => (outerEngine = engine)}>
        <EngineProvider initFn={(engine) => (innerEngine = engine)}>
          <Subscriber />
        </EngineProvider>
      </EngineProvider>
    )

    outerEngine!.pub(event$, 'outer')
    innerEngine!.pub(event$, 'inner')
    expect(records).toEqual([{ engine: innerEngine, value: 'inner' }])
  })

  it('attaches the layout hook before a later same-component layout publication', async () => {
    const event$ = Stream<string>(false)
    const records: string[] = []

    const SubscriberAndPublisher = () => {
      const engine = useEngine()
      useEngineLayoutSubscription(event$, (value) => records.push(value))
      React.useLayoutEffect(() => {
        engine.pub(event$, 'layout')
      }, [engine])
      return null
    }

    await render(
      <EngineProvider>
        <SubscriberAndPublisher />
      </EngineProvider>
    )
    expect(records).toEqual(['layout'])
  })

  it('attaches the passive hook after mount layout publications', async () => {
    const event$ = Stream<string>(false)
    const records: string[] = []
    let engine: Engine | undefined

    const SubscriberAndPublisher = () => {
      const currentEngine = useEngine()
      useEngineSubscription(event$, (value) => records.push(value))
      React.useLayoutEffect(() => {
        currentEngine.pub(event$, 'layout')
      }, [currentEngine])
      return null
    }

    await render(
      <EngineProvider initFn={(currentEngine) => (engine = currentEngine)}>
        <SubscriberAndPublisher />
      </EngineProvider>
    )
    expect(records).toEqual([])

    engine!.pub(event$, 'later')
    expect(records).toEqual(['later'])
  })

  it.each([
    ['passive', useEngineSubscription],
    ['layout', useEngineLayoutSubscription],
  ] as const)('leaves one live %s subscription after Strict Mode recovery', async (_name, useSubscription) => {
    const event$ = Stream<string>(false)
    const records: string[] = []
    let engine: Engine | undefined
    let lifecycle: ReturnType<typeof trackSubscriptionLifecycle> | undefined
    const lifecycles = new Map<Engine, ReturnType<typeof trackSubscriptionLifecycle>>()

    const Subscriber = () => {
      engine = useEngine()
      lifecycle = lifecycles.get(engine)
      useSubscription(event$, (value) => records.push(value))
      return null
    }

    const App = ({ show }: { show: boolean }) => (
      <React.StrictMode>
        <EngineProvider
          initFn={(currentEngine) => {
            lifecycles.set(currentEngine, trackSubscriptionLifecycle(currentEngine))
          }}
        >
          {show ? <Subscriber /> : null}
        </EngineProvider>
      </React.StrictMode>
    )

    const screen = await render(<App show />)

    engine!.pub(event$, 'once')
    expect(records).toEqual(['once'])
    expect(lifecycle?.active()).toBe(1)

    await screen.rerender(<App show={false} />)
    expect(engine!.isDisposed).toBe(false)
    expect(lifecycle?.active()).toBe(0)
    engine!.pub(event$, 'after-unmount')
    expect(records).toEqual(['once'])
  })
})
