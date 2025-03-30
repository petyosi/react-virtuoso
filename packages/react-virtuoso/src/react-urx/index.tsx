/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/**
 * `@virtuoso.dev/react-urx` exports the [[systemToComponent]] function.
 * It wraps urx systems in to UI **logic provider components**,
 * mapping the system input and output streams to the component input / output points.
 *
 * ### Simple System wrapped as React Component
 *
 * ```tsx
 * const sys = system(() => {
 *   const foo = statefulStream(42)
 *   return { foo }
 * })
 *
 * const { Component: MyComponent, useEmitterValue } = systemToComponent(sys, {
 *   required: { fooProp: 'foo' },
 * })
 *
 * const Child = () => {
 *   const foo = useEmitterValue('foo')
 *   return <div>{foo}</div>
 * }
 *
 * const App = () => {
 *   return <Comp fooProp={42}><Child /><Comp>
 * }
 * ```
 *
 * @packageDocumentation
 */
import React from 'react'

import type { AnySystemSpec, Emitter, Publisher, SR, StatefulStream, Stream } from '../urx'

import * as u from '../urx'

/** @internal */
type Dict<T> = Record<string, T>

/** @internal */
function omit<O extends Dict<any>, K extends readonly string[]>(keys: K, obj: O): Omit<O, K[number]> {
  const result = {} as Dict<any>
  const index = {} as Dict<1>
  let idx = 0
  const len = keys.length

  while (idx < len) {
    index[keys[idx]] = 1
    idx += 1
  }

  for (const prop in obj) {
    if (!Object.hasOwn(index, prop)) {
      result[prop] = obj[prop]
    }
  }

  return result as Omit<O, K[number]>
}

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect

/** @internal */
export type MethodsFromPropMap<E extends AnySystemSpec, M extends SystemPropsMap<E>> = {
  [K in Extract<keyof M['methods'], string>]: M['methods'][K] extends string
    ? SR<E>[M['methods'][K]] extends Observable<infer R>
      ? (value: R) => void
      : never
    : never
}

/** @internal */
export type Observable<T> = Emitter<T> | Publisher<T>

/** @internal */
export type PropsFromPropMap<E extends AnySystemSpec, M extends SystemPropsMap<E>> = {
  [K in Extract<keyof M['events'], string>]?: M['events'][K] extends string
    ? SR<E>[M['events'][K]] extends Observable<infer R>
      ? (value: R) => void
      : never
    : never
} & {
  [K in Extract<keyof M['optional'], string>]?: M['optional'][K] extends string
    ? SR<E>[M['optional'][K]] extends Observable<infer R>
      ? R
      : never
    : never
} & {
  [K in Extract<keyof M['required'], string>]: M['required'][K] extends string
    ? SR<E>[M['required'][K]] extends Observable<infer R>
      ? R
      : never
    : never
}

/**
 * Used to correctly specify type refs for system components
 *
 * ```tsx
 * const s = system(() => { return { a: statefulStream(0) } })
 * const { Component } = systemToComponent(s)
 *
 * const App = () => {
 *  const ref = useRef<RefHandle<typeof Component>>()
 *  return <Component ref={ref} />
 * }
 * ```
 *
 * @typeParam T the type of the component
 */
export type RefHandle<T> = T extends React.ForwardRefExoticComponent<React.RefAttributes<infer Handle>> ? Handle : never

/**
 * Describes the mapping between the system streams and the component properties.
 * Each property uses the keys as the names of the properties and the values as the corresponding stream names.
 * @typeParam SS the type of the system.
 */
export interface SystemPropsMap<SS extends AnySystemSpec, K = keyof SR<SS>, D = Record<string, K>> {
  /**
   * Specifies the component "event" properties, if any.
   * Event properties accept callback functions which get executed when the stream emits a new value.
   */
  events?: D
  /**
   * Specifies the component methods, if any. Streams are converted to methods with a single argument.
   * When invoked, the method publishes the value of the argument to the specified stream.
   */
  methods?: D
  /**
   * Specifies the optional component properties.
   */
  optional?: D
  /**
   * Specifies the required component properties.
   */
  required?: D
}

/**
 * Converts a system spec to React component by mapping the system streams to component properties, events and methods. Returns hooks for querying and modifying
 * the system streams from the component's child components.
 * @param systemSpec The return value from a [[system]] call.
 * @param map The streams to props / events / methods mapping Check [[SystemPropsMap]] for more details.
 * @param Root The optional React component to render. By default, the resulting component renders nothing, acting as a logical wrapper for its children.
 * @returns an object containing the following:
 *  - `Component`: the React component.
 *  - `useEmitterValue`: a hook that lets child components use values emitted from the specified output stream.
 *  - `useEmitter`: a hook that calls the provided callback whenever the specified stream emits a value.
 *  - `usePublisher`: a hook which lets child components publish values to the specified stream.
 *  <hr />
 */
export function systemToComponent<SS extends AnySystemSpec, M extends SystemPropsMap<SS>, S extends SR<SS>, R>(
  systemSpec: SS,
  map: M,
  Root?: R
) {
  type ContextValue = ReturnType<SS['constructor']> & { suppressFlushSync: boolean }
  const requiredPropNames = Object.keys(map.required || {})
  const optionalPropNames = Object.keys(map.optional || {})
  const methodNames = Object.keys(map.methods || {})
  const eventNames = Object.keys(map.events || {})
  const Context = React.createContext({} as ContextValue)

  type RootCompProps = R extends React.ComponentType<infer RP> ? RP : { children?: React.ReactNode }

  type CompProps = PropsFromPropMap<SS, M> & RootCompProps

  type CompMethods = MethodsFromPropMap<SS, M>

  function applyPropsToSystem(system: ContextValue, props: any) {
    if (system.propsReady) {
      u.publish(system.propsReady, false)
    }

    for (const requiredPropName of requiredPropNames) {
      const stream = system[map.required![requiredPropName]]
      u.publish(stream, props[requiredPropName])
    }

    for (const optionalPropName of optionalPropNames) {
      if (optionalPropName in props) {
        const stream = system[map.optional![optionalPropName]]
        u.publish(stream, props[optionalPropName])
      }
    }

    if (system.propsReady) {
      u.publish(system.propsReady, true)
    }
  }

  function buildMethods(system: ContextValue) {
    return methodNames.reduce((acc, methodName) => {
      ;(acc as any)[methodName] = (value: any) => {
        const stream = system[map.methods![methodName]]
        u.publish(stream, value)
      }
      return acc
    }, {} as CompMethods)
  }

  function buildEventHandlers(system: ContextValue) {
    return eventNames.reduce<Record<string, Emitter<any>>>((handlers, eventName) => {
      handlers[eventName] = u.eventHandler(system[map.events![eventName]])
      return handlers
    }, {})
  }

  /**
   * A React component generated from an urx system
   */

  const Component = React.forwardRef<CompMethods, CompProps>((propsWithChildren, ref) => {
    const { children, ...props } = propsWithChildren as any

    const [system] = React.useState(() => {
      return u.tap(u.init(systemSpec), (system) => {
        applyPropsToSystem(system, props)
      })
    })

    const [handlers] = React.useState(u.curry1to0(buildEventHandlers, system))

    useIsomorphicLayoutEffect(() => {
      for (const eventName of eventNames) {
        if (eventName in props) {
          u.subscribe(handlers[eventName], props[eventName])
        }
      }
      return () => {
        Object.values(handlers).map(u.reset)
      }
    }, [props, handlers, system])

    useIsomorphicLayoutEffect(() => {
      applyPropsToSystem(system, props)
    })

    React.useImperativeHandle(ref, u.always(buildMethods(system)))

    const RootComponent = Root as React.ComponentType<any>
    return (
      <Context.Provider value={system}>
        {Root ? (
          <RootComponent {...omit([...requiredPropNames, ...optionalPropNames, ...eventNames], props)}>{children}</RootComponent>
        ) : (
          children
        )}
      </Context.Provider>
    )
  })

  const usePublisher = <K extends keyof S>(key: K) => {
    const context = React.useContext(Context)
    return React.useCallback(
      (value: S[K] extends Stream<infer R> ? R : never) => {
        u.publish(context[key], value)
      },
      [context, key]
    )
  }

  /**
   * Returns the value emitted from the stream.
   */
  const useEmitterValue18 = <K extends keyof S, V = S[K] extends StatefulStream<infer R> ? R : never>(key: K) => {
    const system = React.useContext(Context)
    const source: StatefulStream<V> = system[key]

    const cb = React.useCallback(
      (c: () => void) => {
        return u.subscribe(source, c)
      },
      [source]
    )

    return React.useSyncExternalStore(
      cb,
      () => u.getValue(source),
      () => u.getValue(source)
    )
  }

  const useEmitterValueLegacy = <K extends keyof S, V = S[K] extends StatefulStream<infer R> ? R : never>(key: K) => {
    const system = React.useContext(Context)
    const source: StatefulStream<V> = system[key]

    const [value, setValue] = React.useState(u.curry1to0(u.getValue, source))

    useIsomorphicLayoutEffect(
      () =>
        u.subscribe(source, (next: V) => {
          if (next !== value) {
            setValue(u.always(next))
          }
        }),
      [source, value]
    )

    return value
  }

  const useEmitterValue = React.version.startsWith('18') ? useEmitterValue18 : useEmitterValueLegacy

  const useEmitter = <K extends keyof S, V = S[K] extends Stream<infer R> ? R : never>(key: K, callback: (value: V) => void) => {
    const context = React.useContext(Context)
    const source: Stream<V> = context[key]
    useIsomorphicLayoutEffect(() => u.subscribe(source, callback), [callback, source])
  }

  return {
    Component,
    useEmitter,
    useEmitterValue,
    usePublisher,
  }
}
