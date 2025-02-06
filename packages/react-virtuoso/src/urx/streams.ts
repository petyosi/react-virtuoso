/* eslint-disable @typescript-eslint/no-unsafe-argument */

/**
 * Streams are the basic building blocks of a reactive system. Think of them as the system permanent "data tubes".
 *
 * A stream acts as both an [[Emitter]] and [[Publisher]]. Each stream can have multiple {@link Subscription | Subscriptions}.
 *
 * urx streams are either **stateless** or **stateful**.
 * Stateless streams emit data to existing subscriptions when published, without keeping track of it.
 * Stateful streams remember the last published value and immediately publish it to new subscriptions.
 *
 * ```ts
 * import { stream, statefulStream, publish, subscribe } from "@virtuoso.dev/urx";
 *
 * // foo is a stateless stream
 * const foo = stream<number>();
 *
 * publish(foo, 42);
 * // this subsription will not be called...
 * subscribe(foo, (value) => console.log(value));
 * // it will only catch published values after it
 * publish(foo, 43);
 *
 * // stateful streams always start with an initial value
 * const bar = statefulStream(42);
 *
 * // subscribing to a stateful stream
 * // immediately calls the subscription with the current value
 * subscribe(bar, (value) => console.log(value));
 *
 * // subsequent publishing works just like stateless streams
 * publish(bar, 43);
 * ```
 * @packageDocumentation
 */

import { connect, Emitter, StatefulStream, Stream, subscribe, Subscription, Unsubscribe } from './actions'
import { PUBLISH, RESET, SUBSCRIBE, VALUE } from './constants'
import { noop, tap } from './utils'

/**
 * Event handlers are special emitters which can have **at most one active subscription**.
 * Subscribing to an event handler unsubscribes the previous subscription, if present.
 * ```ts
 * const foo = stream<number>();
 * const fooEvent = eventHandler(foo);
 *
 * // will be called once with 42
 * subscribe(fooEvent, (value) => console.log(`Sub 1 ${value}`));
 * publish(foo, 42);
 *
 * // unsubscribes sub 1
 * subscribe(fooEvent, (value) => console.log(`Sub 2 ${value}`));
 * publish(foo, 43);
 * ```
 * @param emitter the source emitter.
 * @returns the single-subscription emitter.
 */
export function eventHandler<T>(emitter: Emitter<T>) {
  let unsub: undefined | Unsubscribe
  let currentSubscription: any
  const cleanup = () => unsub?.()

  return function (action: RESET | SUBSCRIBE, subscription?: Subscription<T>) {
    switch (action) {
      case SUBSCRIBE:
        if (subscription) {
          if (currentSubscription === subscription) {
            return
          }
          cleanup()
          currentSubscription = subscription
          unsub = subscribe(emitter, subscription)
          return unsub
        } else {
          cleanup()
          return noop
        }
      case RESET:
        cleanup()
        currentSubscription = null
        return
    }
  } as Emitter<T>
}

/**
 * Constructs a new stateful stream.
 * ```ts
 * const foo = statefulStream(42);
 * ```
 * @param initial the initial value in the stream.
 * @typeParam T the type of values to publish in the stream. If omitted, the function infers it from the initial value.
 * @returns a [[StatefulStream]]
 */
export function statefulStream<T>(initial: T): StatefulStream<T> {
  let value: T = initial
  const innerSubject = stream<T>()

  // @ts-ignore
  return ((action: PUBLISH | RESET | SUBSCRIBE | VALUE, arg: any) => {
    switch (action) {
      case PUBLISH:
        value = arg as T
        break
      case SUBSCRIBE: {
        const subscription = arg as Subscription<T>
        subscription(value)
        break
      }
      case VALUE:
        return value
    }
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    return innerSubject(action as any, arg)
  }) as StatefulStream<T>
}

/**
 * Creates and connects a "junction" stateful stream to the specified emitter. Often used with [[pipe]], to avoid the multiple evaluation of operator sets.
 *
 * ```ts
 * const foo = stream<number>();
 *
 * const fooX2 = pipe(
 *   foo,
 *   map((value) => {
 *     console.log(`multiplying ${value}`);
 *     return value * 2;
 *   })
 * );
 *
 * subscribe(fooX2, (value) => console.log(value));
 * subscribe(fooX2, (value) => console.log(value));
 *
 * publish(foo, 42); // executes the map operator twice for each subscription.
 *
 * const sharedFooX2 = statefulStreamFromEmitter(pipe(
 *   foo,
 *   map((value) => {
 *     console.log(`shared multiplying ${value}`);
 *     return value * 2;
 *   })
 * ), 42);
 *
 * subscribe(sharedFooX2, (value) => console.log(value));
 * subscribe(sharedFooX2, (value) => console.log(value));
 *
 * publish(foo, 42);
 *```
 * @param initial the initial value in the stream.
 * @returns the resulting stateful stream.
 */
export function statefulStreamFromEmitter<T>(emitter: Emitter<T>, initial: T): StatefulStream<T> {
  return tap(statefulStream(initial), (stream) => connect(emitter, stream))
}

/**
 * Constructs a new stateless stream.
 * ```ts
 * const foo = stream<number>();
 * ```
 * @typeParam T the type of values to publish in the stream.
 * @returns a [[Stream]]
 */
export function stream<T>(): Stream<T> {
  const subscriptions = [] as Subscription<T>[]

  return ((action: PUBLISH | RESET | SUBSCRIBE, arg: any) => {
    switch (action) {
      case PUBLISH:
        subscriptions.slice().forEach((subscription) => {
          subscription(arg as T)
        })
        return
      case RESET:
        subscriptions.splice(0, subscriptions.length)
        return
      case SUBSCRIBE:
        subscriptions.push(arg as Subscription<T>)
        return () => {
          const indexOf = subscriptions.indexOf(arg as Subscription<T>)
          if (indexOf > -1) {
            subscriptions.splice(indexOf, 1)
          }
        }
    }
  }) as Stream<T>
}

/**
 * Creates and connects a "junction" stream to the specified emitter. Often used with [[pipe]], to avoid the multiple evaluation of operator sets.
 *
 * ```ts
 * const foo = stream<number>();
 *
 * const fooX2 = pipe(
 *   foo,
 *   map((value) => {
 *     console.log(`multiplying ${value}`);
 *     return value * 2;
 *   })
 * );
 *
 * subscribe(fooX2, (value) => console.log(value));
 * subscribe(fooX2, (value) => console.log(value));
 *
 * publish(foo, 42); // executes the map operator twice for each subscription.
 *
 * const sharedFooX2 = streamFromEmitter(pipe(
 *   foo,
 *   map((value) => {
 *     console.log(`shared multiplying ${value}`);
 *     return value * 2;
 *   })
 * ));
 *
 * subscribe(sharedFooX2, (value) => console.log(value));
 * subscribe(sharedFooX2, (value) => console.log(value));
 *
 * publish(foo, 42);
 *```
 * @returns the resulting stream.
 */
export function streamFromEmitter<T>(emitter: Emitter<T>): Stream<T> {
  return tap(stream<T>(), (stream) => connect(emitter, stream))
}
