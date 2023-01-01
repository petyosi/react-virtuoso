/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * ## Thinking in Systems
 * systems are a stateful **data-processing machines** which accept input through **input streams**,
 * init and maintain state in **depots** and, in certain conditions, emit values to subscriptions through **output streams**.
 * Systems can specify other systems as dependencies, and can act as singletons in the resulting dependency tree.
 *
 * ### Depots
 *
 * The first, and probably the most critical part to understand are **the depots**
 * mostly because they are somewhat implicit.
 * Unlike other state management paradigms, the depots are not kept in a single data structure.
 * Insted, depots are defined and maintained as stateful streams, stateful transfomers
 * like [[combineLatest]] or stateful operators like[ []withLatestFrom] or [[scan]].
 *
 * **Depots persist values over time**.
 * If it was not for them, the system had to re-receive its entire input state simultaneously in order to calculate the values for its output stream.
 *
 * Of course, strictly speaking, it is possible to implement a pure, stateless system as a form of a complex map/reduce. urx would not mind that ;).
 *
 * ### Input Streams
 *
 * The system receives updates from the rest of the world through values published in its input streams.
 * The streams used can be either stateless (acting as means to send **signals**) or stateful, where the initial stream state acts as the default value for that system parameter.
 *
 * The effects of the input streams are up to the system data-processing logic. It can change its depots' state, and/or emit values through its output streams.
 *
 * ### Data Processing
 *
 * The actual system behavior is exclusively implemented by **applying transformers and operators** to the input streams, producing the respective output streams.
 * In the final state the system streams are organized in a directed graph, where incoming data is routed through certain edges and nodes.
 * Simple systems like the one in [urx by example](https://urx.virtuoso.dev/docs/urx-by-example) can use a straightforward single-step transformation (in this case, `combineLatest` and `map`),
 * while complex ones can introduce multiple intermediate streams to model their logic.
 *
 * ### Output Streams
 *
 * The system publishes updates to its clients (other systems or an UI bound to it) by publishing data in its output streams.
 * State-reflecting output streams, like `sum` in the [urx by example](https://urx.virtuoso.dev/docs/urx-by-example) should use stateful streams as output streams.
 * Signal-like output should use regular, stateless streams. In general, stateless input streams tend to have a symmetrical stateless streams, and the opposite.
 *
 * @packageDocumentation
 */
import { Emitter } from './actions'

/**
 * Systems are a dictionaries of streams. a [[SystemConstructor]] should return a System.
 */
export interface System {
  [key: string]: Emitter<any>
}

/**
 * a SystemSpec is the result from a [[system]] call. To obtain the [[System]], pass the spec to [[init]].
 */
export interface SystemSpec<SS extends SystemSpecs, C extends SystemConstructor<SS>> {
  id: string
  constructor: C
  dependencies: SS
  singleton: boolean
}

/** @internal **/
export type AnySystemSpec = SystemSpec<any, any>

/** @internal **/
export type SystemSpecs = AnySystemSpec[]

/** @internal **/
export type SR<E extends AnySystemSpec, R extends System = ReturnType<E['constructor']>> = R

/** @internal **/
export type SpecResults<SS extends SystemSpecs, L = SS['length']> = L extends 0
  ? []
  : L extends 1
  ? [SR<SS[0]>]
  : L extends 2
  ? [SR<SS[0]>, SR<SS[1]>]
  : L extends 3
  ? [SR<SS[0]>, SR<SS[1]>, SR<SS[2]>]
  : L extends 4
  ? [SR<SS[0]>, SR<SS[1]>, SR<SS[2]>, SR<SS[3]>]
  : L extends 5
  ? [SR<SS[0]>, SR<SS[1]>, SR<SS[2]>, SR<SS[3]>, SR<SS[4]>]
  : L extends 6
  ? [SR<SS[0]>, SR<SS[1]>, SR<SS[2]>, SR<SS[3]>, SR<SS[4]>, SR<SS[5]>]
  : L extends 7
  ? [SR<SS[0]>, SR<SS[1]>, SR<SS[2]>, SR<SS[3]>, SR<SS[4]>, SR<SS[5]>, SR<SS[6]>]
  : L extends 8
  ? [SR<SS[0]>, SR<SS[1]>, SR<SS[2]>, SR<SS[3]>, SR<SS[4]>, SR<SS[5]>, SR<SS[6]>, SR<SS[7]>]
  : L extends 9
  ? [SR<SS[0]>, SR<SS[1]>, SR<SS[2]>, SR<SS[3]>, SR<SS[4]>, SR<SS[5]>, SR<SS[6]>, SR<SS[7]>, SR<SS[8]>]
  : L extends 10
  ? [SR<SS[0]>, SR<SS[1]>, SR<SS[2]>, SR<SS[3]>, SR<SS[4]>, SR<SS[5]>, SR<SS[6]>, SR<SS[7]>, SR<SS[8]>, SR<SS[9]>]
  : L extends 11
  ? [SR<SS[0]>, SR<SS[1]>, SR<SS[2]>, SR<SS[3]>, SR<SS[4]>, SR<SS[5]>, SR<SS[6]>, SR<SS[7]>, SR<SS[8]>, SR<SS[9]>, SR<SS[10]>]
  : never

/**
 * The system constructor is a function which initializes and connects streams and returns them as a [[System]].
 * If the [[system]] call specifies system dependencies, the constructor receives the dependencies as an array argument.
 */
export type SystemConstructor<D extends SystemSpecs> = (dependencies: SpecResults<D>) => System

/**
 * `system` defines a specification of a system - its constructor, dependencies and if it should act as a singleton in a system dependency tree.
 * When called, system returns a [[SystemSpec]], which is then initialized along with its dependencies by passing it to [[init]].
 *
 * ```ts
 * @import { subscribe, publish, system, init, tup, connect, map, pipe } from 'urx'
 *
 * // a simple system with two streams
 * const sys1 = system(() => {
 *  const a = stream<number>()
 *  const b = stream<number>()
 *
 *  connect(pipe(a, map(value => value * 2)), b)
 *  return { a, b }
 * })
 *
 * // a second system which depends on the streams from the first one
 * const sys2 = system(([ {a, b} ]) => {
 *  const c = stream<number>()
 *  connect(pipe(b, map(value => value * 2)), c)
 *  // re-export the `a` stream, keep `b` internal
 *  return { a, c }
 * }, tup(sys1))
 *
 * // init will recursively initialize sys2 dependencies, in this case sys1
 * const { a, c } = init(sys2)
 * subscribe(c, c => console.log(`Value multiplied by 4`, c))
 * publish(a, 2)
 * ```
 *
 * #### Singletons in Dependency Tree
 *
 * By default, systems will be initialized only once if encountered multiple times in the dependency tree.
 * In the below dependency system tree, systems `b` and `c` will receive the same stream instances from system `a` when system `d` is initialized.
 * ```txt
 *   a
 *  / \
 * b   c
 *  \ /
 *   d
 * ```
 * If `a` gets `{singleton: false}` as a last argument, `init` creates two separate instances - one for `b` and one for `c`.
 *
 * @param constructor the system constructor function. Initialize and connect the streams in its body.
 *
 * @param dependencies the system dependencies, which the constructor will receive as arguments.
 * Use the [[tup]] utility **For TypeScript type inference to work correctly**.
 * ```ts
 * const sys3 = system(() => { ... }, tup(sys2, sys1))
 * ```
 * @param __namedParameters Options
 * @param singleton determines if the system will act as a singleton in a system dependency tree. `true` by default.
 */
export function system<F extends SystemConstructor<D>, D extends SystemSpecs>(
  constructor: F,
  dependencies: D = [] as unknown as D,
  { singleton }: { singleton: boolean } = { singleton: true }
): SystemSpec<D, F> {
  return {
    id: id(),
    constructor,
    dependencies,
    singleton,
  }
}

/** @internal */
const id = () => Symbol() as unknown as string

/**
 * Initializes a [[SystemSpec]] by recursively initializing its dependencies.
 *
 * ```ts
 * // a simple system with two streams
 * const sys1 = system(() => {
 *  const a = stream<number>()
 *  const b = stream<number>()
 *
 *  connect(pipe(a, map(value => value * 2)), b)
 *  return { a, b }
 * })
 *
 * const { a, b } = init(sys1)
 * subscribe(b, b => console.log(b))
 * publish(a, 2)
 * ```
 *
 * @returns the [[System]] constructed by the spec constructor.
 * @param systemSpec the system spec to initialize.
 */
export function init<SS extends AnySystemSpec>(systemSpec: SS): SR<SS> {
  const singletons = new Map<string, System>()
  const _init = <SS extends AnySystemSpec>({ id, constructor, dependencies, singleton }: SS) => {
    if (singleton && singletons.has(id)) {
      return singletons.get(id)! as SR<SS>
    }
    const system = constructor(dependencies.map((e: AnySystemSpec) => _init(e)))
    if (singleton) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      singletons.set(id, system)
    }
    return system
  }
  return _init(systemSpec)
}
