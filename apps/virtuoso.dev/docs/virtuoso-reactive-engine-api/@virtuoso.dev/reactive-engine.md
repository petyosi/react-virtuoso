# @virtuoso.dev/reactive-engine

Some intro about the API reference.

## Nodes

### Stream()

> **Stream**\<`T`\>(`distinct`): [`NodeRef`](#noderef)\<`T`\>

Defines a new **stateless node** and returns a reference to it.

#### Type Parameters

| Type Parameter | Description                                         |
| -------------- | --------------------------------------------------- |
| `T`            | The type of values that the node emits and accepts. |

#### Parameters

| Parameter  | Type                           | Default value | Description                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `distinct` | [`Distinct`](#distinct)\<`T`\> | `true`        | Controls duplicate value emission. Default is `true` (distinct). Setting it to `true` will cause the node to emit only when the new value is different from the current value. Pass `false` to make the cell emit every time when published, even when the new value equals the current one. Pass custom function `(prev: T \| undefined, next: T) => boolean` to define your own equality check for non-primitive types. |

#### Returns

[`NodeRef`](#noderef)\<`T`\>

A node reference that can be published to with values of type `T`.

#### Example

```ts
import { Engine, Stream } from '@virtuoso.dev/reactive-engine'

// Basic usage with default distinct behavior
const stream$ = Stream<number>()
const engine = new Engine()

engine.sub(stream$, (value) => console.log('received:', value))
engine.pub(stream$, 42) // logs 'received: 42'
engine.pub(stream$, 42) // no output (duplicate filtered)
engine.pub(stream$, 43) // logs 'received: 43'

// With custom distinct comparator
const objStream$ = Stream<{ id: number }>((a, b) => a?.id === b?.id)
engine.sub(objStream$, console.log)
engine.pub(objStream$, { id: 1 }) // emits
engine.pub(objStream$, { id: 1 }) // filtered (same id)
```

#### Remarks

Streams are stateless - they don't hold values between publications.
Use [Cell](#cell) if you need stateful behavior with initial values.

---

### Cell()

> **Cell**\<`T`\>(`value`, `distinct`): [`NodeRef`](#noderef)\<`T`\>

Defines a new **stateful node** and returns a reference to it.

#### Type Parameters

| Type Parameter | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| `T`            | The type of values that the node stores, emits, and accepts. |

#### Parameters

| Parameter  | Type                           | Default value | Description                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`    | `T`                            | `undefined`   | The initial value of the node. Stateful nodes always have a current value.                                                                                                                                                                                                                                                                                                                                                |
| `distinct` | [`Distinct`](#distinct)\<`T`\> | `true`        | Controls duplicate value emission. Default is `true` (distinct). Setting it to `true` will cause the node to emit only when the new value is different from the current value. Pass `false` to make the cell emit every time when published, even when the new value equals the current one. Pass custom function `(prev: T \| undefined, next: T) => boolean` to define your own equality check for non-primitive types. |

#### Returns

[`NodeRef`](#noderef)\<`T`\>

A node reference that maintains state and can be published to with values of type `T`.

#### Example

```ts
import { Engine, Cell } from '@virtuoso.dev/reactive-engine'

// Basic usage
const counter$ = Cell(0)
const engine = new Engine()

console.log(engine.getValue(counter$)) // 0 (initial value)

engine.sub(counter$, (value) => console.log('counter:', value))
engine.pub(counter$, 1) // logs 'counter: 1'
console.log(engine.getValue(counter$)) // 1 (updated value)

// Distinct behavior (default)
engine.pub(counter$, 1) // no output (same value)
engine.pub(counter$, 2) // logs 'counter: 2'

// Non-distinct cell
const alwaysEmit$ = Cell(0, false)
engine.sub(alwaysEmit$, console.log)
engine.pub(alwaysEmit$, 0) // emits even though it's the same value
```

#### Remarks

Unlike RxJS `BehaviorSubject`, a cell does not immediately invoke its subscriptions
when subscribed to. It only emits values when published to, either directly or through
its relationships.

---

### Trigger()

> **Trigger**(): [`NodeRef`](#noderef)\<`void`\>

Defines a new **stateless, valueless node** and returns a reference to it.

#### Returns

[`NodeRef`](#noderef)\<`void`\>

A node reference that can be published to without passing value to trigger its subscriptions.

#### Example

```ts
import { Engine, Trigger } from '@virtuoso.dev/reactive-engine'

const trigger$ = Trigger()
const engine = new Engine()

engine.sub(trigger$, () => console.log('triggered!'))
engine.pub(trigger$) // logs 'triggered!'
```

#### Remarks

A trigger is useful for triggering side effects or coordinating actions without passing data.

---

### DerivedCell()

> **DerivedCell**\<`T`\>(`value`, `source$`, `distinct`): [`NodeRef`](#noderef)\<`T`\>

Defines a new **stateful node**, links it to an existing node transform and returns a reference to it.

#### Type Parameters

| Type Parameter | Description                                     |
| -------------- | ----------------------------------------------- |
| `T`            | The type of values that the node emits/accepts. |

#### Parameters

| Parameter  | Type                           | Default value | Description                                                                                                                                                                      |
| ---------- | ------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`    | `T`                            | `undefined`   | the initial value of the node.                                                                                                                                                   |
| `source$`  | [`NodeRef`](#noderef)\<`T`\>   | `undefined`   | a node reference to link to.                                                                                                                                                     |
| `distinct` | [`Distinct`](#distinct)\<`T`\> | `true`        | if true, the node will only emit values that are different from the previous value. Optionally, a custom distinct function can be provided if the node values are non-primitive. |

#### Returns

[`NodeRef`](#noderef)\<`T`\>

#### Example

```ts
import { e, Engine, Cell, DerivedCell } from '@virtuoso.dev/reactive-engine'

const bar$ = Cell('bar')
const foo$ = DerivedCell(
  'foo',
  e.pipe(bar$, (bar) => `foo${bar}`),
  true
)
e.sub(foo$, (val) => console.log(val))

const eng = new Engine()
eng.pub(bar$, '-bar') // the foo$ subscription will log 'foo-bar'
```

---

### Pipe()

> **Pipe**\<`T`\>(...`operators`): \[[`Inp`](#inp)\<`T`\>, [`Out`](#out-1)\]

Creates a tuple of nodes &ndash; an input, and an output.
The output node transforms and emits the value of the input through the provided operator chain.

#### Type Parameters

| Type Parameter | Description                                         |
| -------------- | --------------------------------------------------- |
| `T`            | The type of values that the input node will accept. |

#### Parameters

| Parameter      | Type                                  | Description                                                          |
| -------------- | ------------------------------------- | -------------------------------------------------------------------- |
| ...`operators` | [`O`](#o-1)\<`unknown`, `unknown`\>[] | one or more operators that are chained to transform the input value. |

#### Returns

\[[`Inp`](#inp)\<`T`\>, [`Out`](#out-1)\]

A tuple of nodes, the first one is the input, and the second one is the output.

#### Example

```ts
import { e, Pipe } from '@virtuoso.dev/reactive-engine'

const [input$, output$] = Pipe(e.map((value) => value * 2))
e.sub(output$, (value) => console.log(value))

const eng = new Engine()
eng.pub(input$, 2) // the subscription will log "4"
```

---

### NodeRef\<T\>

> **NodeRef**\<`T`\> = `symbol` & `object`

A typed reference to a node ([Cell](#cell), [Stream](#stream), or [Trigger](#trigger)).

#### Type Declaration

##### valType

> **valType**: `T`

#### Type Parameters

| Type Parameter | Default type | Description                             |
| -------------- | ------------ | --------------------------------------- |
| `T`            | `unknown`    | The type of values that the node emits. |

## React Hooks and Components

### useCellValues()

> **useCellValues**(...`cells`): `unknown`[]

Returns the up-to-date values of the passed cells.
The component is re-rendered each time any of the cells emits a new value.

#### Parameters

| Parameter  | Type              |
| ---------- | ----------------- |
| ...`cells` | [`Out`](#out-1)[] |

#### Returns

`unknown`[]

Correclty typed array with the current values of the passed cells.

#### Remarks

This hook works only with cells, don't pass streams or triggers.

#### Example

```tsx
import { Cell, useCellValues }
const foo$ = Cell('foo')
const bar$ = Cell('bar')
// ...
// The component should be wrapped in an EngineProvider.
function MyComponent() {
  const [foo, bar] = useCellValues(foo$, bar$)
  return <div>{foo} - {bar}</div>
}
```

---

### usePublisher()

> **usePublisher**\<`T`\>(`node$`): (`value`) => `void`

Returns a function that publishes its passed argument into the specified node.

#### Type Parameters

| Type Parameter | Description                               |
| -------------- | ----------------------------------------- |
| `T`            | The type of values that the node accepts. |

#### Parameters

| Parameter | Type                 | Description             |
| --------- | -------------------- | ----------------------- |
| `node$`   | [`Inp`](#inp)\<`T`\> | the node to publish in. |

#### Returns

The publisher function for the passed `node$`.

> (`value`): `void`

##### Parameters

| Parameter | Type |
| --------- | ---- |
| `value`   | `T`  |

##### Returns

`void`

#### Example

```tsx
import { Stream, e, usePublisher } from '@virtuoso.dev/reactive-engine'

const stream$ = Stream<number>()
e.sub(stream, (value) => console.log(`${value} was published in the stream`))

//...
function MyComponent() {
  const pub = usePublisher(stream)
  return <button onClick={() => pub(2)}>Push a value into the stream</button>
}
```

---

### useCell()

> **useCell**\<`T`\>(`cell`): \[`T`, (`value`) => `void`\]

Returns a tuple of the current value of a cell and a publisher function (similar to `useState`).
The component re-renderes when the cell value changes.

#### Type Parameters

| Type Parameter | Description                                     |
| -------------- | ----------------------------------------------- |
| `T`            | The type of values that the cell emits/accepts. |

#### Parameters

| Parameter | Type                         | Description      |
| --------- | ---------------------------- | ---------------- |
| `cell`    | [`NodeRef`](#noderef)\<`T`\> | The cell to use. |

#### Returns

\[`T`, (`value`) => `void`\]

A tuple of the current value of the cell and a publisher function.

#### Remarks

The reactive engine state management allows you to keep your state logic outside of your React components.
Be careful not to use this hook too often alongside `useEffect` for example, as this means that you're losing the benefits of the reactive engine design.

---

### useEngine()

> **useEngine**(): [`Engine`](#engine)

Returns a reference to the current engine instance created in the [EngineProvider](#engineprovider).

#### Returns

[`Engine`](#engine)

#### Remarks

Accessing the engine instance directly in React is rarely needed.
Use [useCellValue](#usecellvalue) and [usePublisher](#usepublisher) to interact with the nodes.

---

### useCellValue()

> **useCellValue**\<`T`\>(`cell`): `T`

Gets the current value of the cell. The component is re-rendered when the cell value changes.

#### Type Parameters

| Type Parameter | Description                                 |
| -------------- | ------------------------------------------- |
| `T`            | the type of the value that the cell caries. |

#### Parameters

| Parameter | Type                   | Description      |
| --------- | ---------------------- | ---------------- |
| `cell`    | [`Out`](#out-1)\<`T`\> | The cell to use. |

#### Returns

`T`

The current value of the cell.

#### Remarks

If you need the values of multiple nodes from the engine and those nodes might change in the same computiation, you can [useCellValues](#usecellvalues) to reduce re-renders.

#### Example

```tsx
const cell$ = Cell(0)
//...
function MyComponent() {
  const cell = useCellValue(cell$)
  return <div>{cell}</div>
}
```

---

### EngineContext()

> **EngineContext**(`props`): `ReactNode`

The context that provides an engine instance used by the built-in hooks. Instantiated by [EngineProvider](#engineprovider).

#### Parameters

| Parameter | Type            |
| --------- | --------------- |
| `props`   | `ProviderProps` |

#### Returns

`ReactNode`

---

### EngineProvider()

> **EngineProvider**(`props`): `ReactNode` \| `Promise`\<`ReactNode`\>

A provider that instantiates and provides an [Engine](#engine) instance that's used by the built-in hooks.

#### Parameters

| Parameter           | Type                                                                                                                                                                                            | Description                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `props`             | \{ `children`: `ReactNode`; `console?`: [`TracerConsole`](#tracerconsole); `initWith?`: `Record`\<`symbol`, `unknown`\>; `label?`: `string`; `updateWith?`: `Record`\<`symbol`, `unknown`\>; \} | -                                                                                                                                                   |
| `props.children`    | `ReactNode`                                                                                                                                                                                     | The children to render.                                                                                                                             |
| `props.console?`    | [`TracerConsole`](#tracerconsole)                                                                                                                                                               | A console instance (usually, the browser console, but you can pass your own logger) that enables diagnostic messages about the engine state cycles. |
| `props.initWith?`   | `Record`\<`symbol`, `unknown`\>                                                                                                                                                                 | The initial values to set in the engine.                                                                                                            |
| `props.label?`      | `string`                                                                                                                                                                                        | The label to use in the tracer messages.                                                                                                            |
| `props.updateWith?` | `Record`\<`symbol`, `unknown`\>                                                                                                                                                                 | The values to update in the engine on each render.                                                                                                  |

#### Returns

`ReactNode` \| `Promise`\<`ReactNode`\>

#### Example

```tsx
import { Cell, useCellValue, e, EngineProvider } from '@virtuoso.dev/reactive-engine'
const cell$ = Cell(0)

function MyComponent() {
  const cell = useCellValue(cell$)
  return <div>{cell}</div>
}

export default function App() {
  return (
    <EngineProvider>
      <MyComponent />
    </EngineProvider>
  )
}
```

---

### EngineProviderProps

#### Properties

##### children

> **children**: `ReactNode`

The children to render.

##### console?

> `optional` **console**: [`TracerConsole`](#tracerconsole)

A console instance (usually, the browser console, but you can pass your own logger) that enables diagnostic messages about the engine state cycles.

##### initWith?

> `optional` **initWith**: `Record`\<`symbol`, `unknown`\>

The initial values to set in the engine.

##### label?

> `optional` **label**: `string`

The label to use in the tracer messages.

##### updateWith?

> `optional` **updateWith**: `Record`\<`symbol`, `unknown`\>

The values to update in the engine on each render.

## Operators

### map()

> **map**\<`I`, `O`\>(`mapFunction`): (`source`, `eng`) => [`NodeRef`](#noderef)\<`O`\>

Maps a the passed value with a projection function.

#### Type Parameters

| Type Parameter | Description                                           |
| -------------- | ----------------------------------------------------- |
| `I`            | The type of values that the incoming node will emit.  |
| `O`            | The type of values that the resulting node will emit. |

#### Parameters

| Parameter     | Type             |
| ------------- | ---------------- |
| `mapFunction` | (`value`) => `O` |

#### Returns

> (`source`, `eng`): [`NodeRef`](#noderef)\<`O`\>

##### Parameters

| Parameter | Type                   |
| --------- | ---------------------- |
| `source`  | [`Out`](#out-1)\<`I`\> |
| `eng`     | [`Engine`](#engine)    |

##### Returns

[`NodeRef`](#noderef)\<`O`\>

---

### mapTo()

> **mapTo**\<`I`, `O`\>(`value`): [`Operator`](#operator)\<`I`, `O`\>

Operator that maps the output of a node to a fixed value.

#### Type Parameters

| Type Parameter | Description                                          |
| -------------- | ---------------------------------------------------- |
| `I`            | The type of values that the incoming node will emit. |
| `O`            | The type of the fixed value to map to.               |

#### Parameters

| Parameter | Type |
| --------- | ---- |
| `value`   | `O`  |

#### Returns

[`Operator`](#operator)\<`I`, `O`\>

---

### filter()

> **filter**\<`I`, `O`\>(`predicate`): [`Operator`](#operator)\<`I`, `O`\>

Operator that filters the output of a node.
If the predicate returns false, the emission is canceled.

#### Type Parameters

| Type Parameter | Default type | Description                                          |
| -------------- | ------------ | ---------------------------------------------------- |
| `I`            | -            | The type of values that the incoming node will emit. |
| `O`            | `I`          | The type of values that the filtered node will emit. |

#### Parameters

| Parameter   | Type                   |
| ----------- | ---------------------- |
| `predicate` | (`value`) => `boolean` |

#### Returns

[`Operator`](#operator)\<`I`, `O`\>

---

### once()

> **once**\<`I`\>(): [`Operator`](#operator)\<`I`, `I`\>

Operator that captures the first emitted value of a node.
Useful if you want to execute a side effect only once.

#### Type Parameters

| Type Parameter | Description                                 |
| -------------- | ------------------------------------------- |
| `I`            | The type of values that the node will emit. |

#### Returns

[`Operator`](#operator)\<`I`, `I`\>

---

### scan()

> **scan**\<`I`, `O`\>(`accumulator`, `seed`): [`Operator`](#operator)\<`I`, `O`\>

Operator that runs with the latest and the current value of a node.
Works like the [RxJS scan operator](https://rxjs.dev/api/operators/scan).

#### Type Parameters

| Type Parameter | Description                                          |
| -------------- | ---------------------------------------------------- |
| `I`            | The type of values that the incoming node will emit. |
| `O`            | The type of the accumulated value.                   |

#### Parameters

| Parameter     | Type                        |
| ------------- | --------------------------- |
| `accumulator` | (`current`, `value`) => `O` |
| `seed`        | `O`                         |

#### Returns

[`Operator`](#operator)\<`I`, `O`\>

---

### throttleTime()

> **throttleTime**\<`I`\>(`delay`): [`Operator`](#operator)\<`I`, `I`\>

Throttles the output of a node with the specified delay.

#### Type Parameters

| Type Parameter | Description                                 |
| -------------- | ------------------------------------------- |
| `I`            | The type of values that the node will emit. |

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `delay`   | `number` |

#### Returns

[`Operator`](#operator)\<`I`, `I`\>

---

### debounceTime()

> **debounceTime**\<`I`\>(`delay`): [`Operator`](#operator)\<`I`, `I`\>

Debounces the output of a node with the specified delay.

#### Type Parameters

| Type Parameter | Description                                 |
| -------------- | ------------------------------------------- |
| `I`            | The type of values that the node will emit. |

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `delay`   | `number` |

#### Returns

[`Operator`](#operator)\<`I`, `I`\>

---

### delayWithMicrotask()

> **delayWithMicrotask**\<`I`\>(): [`Operator`](#operator)\<`I`, `I`\>

Delays the output of a node with `queueMicrotask`.

#### Type Parameters

| Type Parameter | Description                                 |
| -------------- | ------------------------------------------- |
| `I`            | The type of values that the node will emit. |

#### Returns

[`Operator`](#operator)\<`I`, `I`\>

---

### onNext()

> **onNext**\<`I`, `O`\>(`bufNode`): [`Operator`](#operator)\<`I`, \[`I`, `O`\]\>

description Buffers the stream of a node until the passed note emits.

#### Type Parameters

| Type Parameter | Description                                        |
| -------------- | -------------------------------------------------- |
| `I`            | The type of values that the source node will emit. |
| `O`            | The type of values that the buffer node will emit. |

#### Parameters

| Parameter | Type                         |
| --------- | ---------------------------- |
| `bufNode` | [`NodeRef`](#noderef)\<`O`\> |

#### Returns

[`Operator`](#operator)\<`I`, \[`I`, `O`\]\>

---

### handlePromise()

> **handlePromise**\<`I`, `OutSuccess`, `OnLoad`, `OutError`\>(`onLoad`, `onSuccess`, `onError`): [`Operator`](#operator)\<`I` \| `Promise`\<`I`\>, `OutSuccess` \| `OnLoad` \| `OutError`\>

Handles a promise value through the specified callbacks.

#### Type Parameters

| Type Parameter | Description                                          |
| -------------- | ---------------------------------------------------- |
| `I`            | The type of values that the incoming node will emit. |
| `OutSuccess`   | The type of value returned on success.               |
| `OnLoad`       | The type of value returned during loading.           |
| `OutError`     | The type of value returned on error.                 |

#### Parameters

| Parameter   | Type                      |
| ----------- | ------------------------- |
| `onLoad`    | () => `OnLoad`            |
| `onSuccess` | (`value`) => `OutSuccess` |
| `onError`   | (`error`) => `OutError`   |

#### Returns

[`Operator`](#operator)\<`I` \| `Promise`\<`I`\>, `OutSuccess` \| `OnLoad` \| `OutError`\>

---

### Operator()\<I, O\>

> **Operator**\<`I`, `O`\> = (`source`, `engine`) => [`NodeRef`](#noderef)\<`O`\>

An operator that transforms a node into another node, used in the [Engine.pipe](#pipe-8) method.

#### Type Parameters

| Type Parameter | Description                                           |
| -------------- | ----------------------------------------------------- |
| `I`            | The type of values that the incoming node will emit.  |
| `O`            | The type of values that the resulting node will emit. |

#### Parameters

| Parameter | Type                   |
| --------- | ---------------------- |
| `source`  | [`Out`](#out-1)\<`I`\> |
| `engine`  | [`Engine`](#engine)    |

#### Returns

[`NodeRef`](#noderef)\<`O`\>

## Combinators

### pipe()

Creates a new node that emits the values of the source node transformed through the specified operators.
This function is overloaded to support up to 9 operators with proper type inference for chaining.

#### Param

The source node to transform.

#### Param

Variable number of operators to apply in sequence.

#### Type Param

The type of values that the source node emits.

#### Type Param

O2, ... - The output types of each operator in the chain.

#### Example

```ts
import { Engine, Stream, pipe } from '@virtuoso.dev/reactive-engine'
import { map } from '@virtuoso.dev/reactive-engine/operators'

const source$ = Stream<number>()
const doubled$ = pipe(
  source$,
  map((x) => x * 2)
)
const doubledPlusOne$ = pipe(
  source$,
  map((x) => x * 2),
  map((x) => x + 1)
)

const engine = new Engine()
engine.sub(doubled$, console.log)
engine.pub(source$, 5) // logs 10
```

#### Call Signature

> **pipe**\<`T`\>(`s$`): [`NodeRef`](#noderef)\<`T`\>

##### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

##### Parameters

| Parameter | Type                   |
| --------- | ---------------------- |
| `s$`      | [`Out`](#out-1)\<`T`\> |

##### Returns

[`NodeRef`](#noderef)\<`T`\>

#### Call Signature

> **pipe**\<`T`\>(`source$`, ...`operators`): [`NodeRef`](#noderef)

##### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

##### Parameters

| Parameter      | Type                                  |
| -------------- | ------------------------------------- |
| `source$`      | [`Out`](#out-1)\<`T`\>                |
| ...`operators` | [`O`](#o-1)\<`unknown`, `unknown`\>[] |

##### Returns

[`NodeRef`](#noderef)

---

### changeWith()

> **changeWith**\<`T`, `K`\>(`cell`, `source`, `map`): `void`

Updates a cell's value based on emissions from a source node using a mapping function.
This is particularly useful for updating cells containing non-primitive values (arrays, objects)
in an immutable way.

#### Type Parameters

| Type Parameter | Description                                       |
| -------------- | ------------------------------------------------- |
| `T`            | The type of the cell value.                       |
| `K`            | The type of the value emitted by the source node. |

#### Parameters

| Parameter | Type                                | Description                                                                                                    |
| --------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `cell`    | [`Inp`](#inp)\<`T`\>                | The cell to update.                                                                                            |
| `source`  | [`Out`](#out-1)\<`K`\>              | The source node whose emissions trigger the update.                                                            |
| `map`     | (`cellValue`, `streamValue`) => `T` | Function that receives the current cell value and the source emission, and returns the new value for the cell. |

#### Returns

`void`

#### Example

```ts
import { Engine, Cell, Stream, changeWith } from '@virtuoso.dev/reactive-engine'

const items$ = Cell<string[]>([])
const addItem$ = Stream<string>()
const engine = new Engine()

changeWith(items$, addItem$, (currentItems, newItem) => {
  return [...currentItems, newItem] // immutable update
})

engine.pub(addItem$, 'foo')
console.log(engine.getValue(items$)) // ['foo']

engine.pub(addItem$, 'bar')
console.log(engine.getValue(items$)) // ['foo', 'bar']
```

---

### link()

> **link**\<`T`\>(`source`, `sink`): `void`

Connects the output of a source node to the input of a sink node.
When the source emits a value, that value is automatically published to the sink.

#### Type Parameters

| Type Parameter | Description                                        |
| -------------- | -------------------------------------------------- |
| `T`            | The type of values being linked between the nodes. |

#### Parameters

| Parameter | Type                   | Description                                            |
| --------- | ---------------------- | ------------------------------------------------------ |
| `source`  | [`Out`](#out-1)\<`T`\> | The output node whose values will be forwarded.        |
| `sink`    | [`Inp`](#inp)\<`T`\>   | The input node that will receive the forwarded values. |

#### Returns

`void`

#### Example

```ts
import { Engine, Stream, Cell, link } from '@virtuoso.dev/reactive-engine'

const source$ = Stream<number>()
const target$ = Cell(0)
const engine = new Engine()

link(source$, target$)

engine.pub(source$, 42)
console.log(engine.getValue(target$)) // 42
```

---

### sub()

> **sub**\<`T`\>(`node`, `subscription`): `void`

Subscribes to the values emitted by a node. The subscription callback will be called
each time the node emits a value.

#### Type Parameters

| Type Parameter | Description                             |
| -------------- | --------------------------------------- |
| `T`            | The type of values that the node emits. |

#### Parameters

| Parameter      | Type                                   | Description                                                            |
| -------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `node`         | [`Out`](#out-1)\<`T`\>                 | The output node to subscribe to (cell or stream).                      |
| `subscription` | [`Subscription`](#subscription)\<`T`\> | Callback function that receives the emitted value and engine instance. |

#### Returns

`void`

#### Example

```ts
import { Engine, Stream, sub } from '@virtuoso.dev/reactive-engine'

const stream$ = Stream<number>()
const engine = new Engine()

sub(stream$, (value) => {
  console.log('Received:', value)
})

engine.pub(stream$, 42) // logs 'Received: 42'
engine.pub(stream$, 43) // logs 'Received: 43'
```

#### Remarks

This creates a persistent subscription that will remain active until the engine
is disposed. Use this for ongoing subscriptions to node emissions.

---

### singletonSub()

> **singletonSub**\<`T`\>(`node`, `subscription`): `void`

Creates an exclusive subscription to a node. Only one singleton subscription can exist
per node - calling this multiple times on the same node will replace the previous
singleton subscription. Regular subscriptions created with `sub` are not affected.

#### Type Parameters

| Type Parameter | Description                             |
| -------------- | --------------------------------------- |
| `T`            | The type of values that the node emits. |

#### Parameters

| Parameter      | Type                                   | Description                                                            |
| -------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `node`         | [`Out`](#out-1)\<`T`\>                 | The output node to subscribe to exclusively.                           |
| `subscription` | [`Subscription`](#subscription)\<`T`\> | Callback function that receives the emitted value and engine instance. |

#### Returns

`void`

#### Example

```ts
import { Engine, Stream, sub, singletonSub } from '@virtuoso.dev/reactive-engine'

const stream$ = Stream<number>()
const engine = new Engine()

// Regular subscription - will persist
sub(stream$, (value) => console.log('Regular:', value))

// First singleton subscription
singletonSub(stream$, (value) => console.log('Singleton 1:', value))

// This replaces the first singleton subscription
singletonSub(stream$, (value) => console.log('Singleton 2:', value))

engine.pub(stream$, 42)
// Output:
// Regular: 42
// Singleton 2: 42
```

#### Remarks

Useful for scenarios where you need exactly one subscription of a particular
type, such as UI updates or singleton services.

## Engine

### Engine

The engine orchestrates any cells and streams that it touches. The engine also stores the state and the dependencies of the nodes that are referred through it.

#### Constructors

##### Constructor

> **new Engine**(`initialValues`): [`Engine`](#engine)

Creates a new engine.

###### Parameters

| Parameter       | Type                            | Description                                                                                                                                                                |
| --------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialValues` | `Record`\<`symbol`, `unknown`\> | the initial cell values that will populate the engine. Those values will not trigger a recomputation cycle, and will overwrite the initial values specified for each cell. |

###### Returns

[`Engine`](#engine)

#### Methods

##### cellInstance()

> **cellInstance**\<`T`\>(`value`, `distinct`, `node`): [`NodeRef`](#noderef)\<`T`\>

Creates or resolves an existing cell instance in the engine. Useful as a joint point when building your own operators.

###### Type Parameters

| Type Parameter | Description                                        |
| -------------- | -------------------------------------------------- |
| `T`            | The type of values that the cell will emit/accept. |

###### Parameters

| Parameter  | Type                           | Default value | Description                                                                                                                                                                                                |
| ---------- | ------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`    | `T`                            | `undefined`   | the initial value of the cell                                                                                                                                                                              |
| `distinct` | [`Distinct`](#distinct)\<`T`\> | `true`        | true by default. Pass false to mark the stream as a non-distinct one, meaning that publishing the same value multiple times will re-trigger a recomputation cycle.                                         |
| `node`     | `symbol`                       | `...`         | optional, a reference to a cell. If the cell has not been touched in the engine before, the engine will instantiate a reference to it. If it's registered already, the function will return the reference. |

###### Returns

[`NodeRef`](#noderef)\<`T`\>

a reference to the cell.

##### changeWith()

> **changeWith**\<`T`, `K`\>(`cell`, `source`, `map`): `void`

###### Type Parameters

| Type Parameter | Description                                        |
| -------------- | -------------------------------------------------- |
| `T`            | The type of values that the cell will emit/accept. |
| `K`            | The type of values that the source node will emit. |

###### Parameters

| Parameter | Type                                |
| --------- | ----------------------------------- |
| `cell`    | [`Inp`](#inp)\<`T`\>                |
| `source`  | [`Out`](#out-1)\<`K`\>              |
| `map`     | (`cellValue`, `streamValue`) => `T` |

###### Returns

`void`

##### combine()

> **combine**(...`sources`): [`Out`](#out-1)

###### Parameters

| Parameter    | Type              |
| ------------ | ----------------- |
| ...`sources` | [`Out`](#out-1)[] |

###### Returns

[`Out`](#out-1)

##### combineCells()

> **combineCells**(`sources`): [`Out`](#out-1)\<`unknown`[]\>

Combines the values from multiple nodes into a cell that's an array of the latest values of the nodes.

###### Parameters

| Parameter | Type              |
| --------- | ----------------- |
| `sources` | [`Out`](#out-1)[] |

###### Returns

[`Out`](#out-1)\<`unknown`[]\>

##### connect()

> **connect**\<`T`\>(`__namedParameters`): `void`

A low-level utility that connects multiple nodes to a sink node with a map function.
Used as a foundation for the higher-level operators.
The nodes can be active (sources) or passive (pulls).

###### Type Parameters

| Type Parameter            | Default type |
| ------------------------- | ------------ |
| `T` _extends_ `unknown`[] | `unknown`[]  |

###### Parameters

| Parameter                   | Type                                                                                                                    | Description                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `__namedParameters`         | \{ `map`: `ProjectionFunc`\<`T`\>; `pulls?`: [`Out`](#out-1)[]; `sink`: [`Inp`](#inp); `sources`: [`Out`](#out-1)[]; \} | -                                                                                                               |
| `__namedParameters.map`     | `ProjectionFunc`\<`T`\>                                                                                                 | The projection function that will be called when any of the source nodes emits.                                 |
| `__namedParameters.pulls?`  | [`Out`](#out-1)[]                                                                                                       | The nodes which values will be pulled. The values will be passed as arguments to the map function.              |
| `__namedParameters.sink`    | [`Inp`](#inp)                                                                                                           | The sink node that will receive the result of the map function.                                                 |
| `__namedParameters.sources` | [`Out`](#out-1)[]                                                                                                       | The source nodes that emit values to the sink node. The values will be passed as arguments to the map function. |

###### Returns

`void`

##### dispose()

> **dispose**(): `void`

###### Returns

`void`

##### getValue()

> **getValue**\<`T`\>(`node`): `T`

###### Type Parameters

| Type Parameter | Description                             |
| -------------- | --------------------------------------- |
| `T`            | The type of values that the node emits. |

###### Parameters

| Parameter | Type                   |
| --------- | ---------------------- |
| `node`    | [`Out`](#out-1)\<`T`\> |

###### Returns

`T`

##### link()

> **link**\<`T`\>(`source`, `sink`): `void`

Links the output of a node to the input of another node.

###### Type Parameters

| Type Parameter | Description                                  |
| -------------- | -------------------------------------------- |
| `T`            | The type of values that the nodes will emit. |

###### Parameters

| Parameter | Type                   |
| --------- | ---------------------- |
| `source`  | [`Out`](#out-1)\<`T`\> |
| `sink`    | [`Inp`](#inp)\<`T`\>   |

###### Returns

`void`

##### pipe()

> **pipe**\<`T`\>(`source`, ...`operators`): [`NodeRef`](#noderef)

###### Type Parameters

| Type Parameter | Description                                        |
| -------------- | -------------------------------------------------- |
| `T`            | The type of values that the source node will emit. |

###### Parameters

| Parameter      | Type                                  |
| -------------- | ------------------------------------- |
| `source`       | [`Out`](#out-1)\<`T`\>                |
| ...`operators` | [`O`](#o-1)\<`unknown`, `unknown`\>[] |

###### Returns

[`NodeRef`](#noderef)

##### pub()

###### Call Signature

> **pub**\<`T`\>(`node`): `void`

Runs the subscriptions of this node.

###### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

###### Parameters

| Parameter | Type                 |
| --------- | -------------------- |
| `node`    | [`Inp`](#inp)\<`T`\> |

###### Returns

`void`

###### Example

```ts
const foo$ = Action()

e.sub(foo$, console.log)

const r = new Engine()
r.pub(foo$)
```

###### Call Signature

> **pub**\<`T`\>(`node`, `value`): `void`

Publishes the specified value into a node.

###### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

###### Parameters

| Parameter | Type                 |
| --------- | -------------------- |
| `node`    | [`Inp`](#inp)\<`T`\> |
| `value`   | `T`                  |

###### Returns

`void`

###### Example

```ts
const foo$ = Cell('foo')
const r = new Engine()
r.pub(foo$, 'bar')
```

##### pubIn()

> **pubIn**(`values`): `void`

Publishes into multiple nodes simultaneously, triggering a single re-computation cycle.

###### Parameters

| Parameter | Type                            | Description                                   |
| --------- | ------------------------------- | --------------------------------------------- |
| `values`  | `Record`\<`symbol`, `unknown`\> | a record of node references and their values. |

###### Returns

`void`

###### Example

```ts
const foo$ = Cell('foo')
const bar$ = Cell('bar')

const r = new Engine()
r.pubIn({ [foo$]: 'foo1', [bar$]: 'bar1' })
```

##### register()

> **register**(`node$`): [`NodeRef`](#noderef)\<`any`\>

Explicitly includes the specified cell/stream reference in the engine.
Most of the time you don't need to do that, since any interaction with the node through an engine will register it.
The only exception of that rule should be when the interaction is conditional, and the node definition includes an init function that needs to be eagerly evaluated.

###### Parameters

| Parameter | Type                  |
| --------- | --------------------- |
| `node$`   | [`NodeRef`](#noderef) |

###### Returns

[`NodeRef`](#noderef)\<`any`\>

##### resetSingletonSubs()

> **resetSingletonSubs**(): `void`

Clears all exclusive subscriptions.

###### Returns

`void`

##### setLabel()

> **setLabel**(`label`): `void`

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `label`   | `string` |

###### Returns

`void`

##### setTracerConsole()

> **setTracerConsole**(`console`): `void`

Sets the console instance used by the engine tracing.

###### Parameters

| Parameter | Type                                             |
| --------- | ------------------------------------------------ |
| `console` | `undefined` \| [`TracerConsole`](#tracerconsole) |

###### Returns

`void`

##### singletonSub()

> **singletonSub**\<`T`\>(`node`, `subscription`): [`UnsubscribeHandle`](#unsubscribehandle)

###### Type Parameters

| Type Parameter | Description                                 |
| -------------- | ------------------------------------------- |
| `T`            | The type of values that the node will emit. |

###### Parameters

| Parameter      | Type                                                  |
| -------------- | ----------------------------------------------------- |
| `node`         | [`Out`](#out-1)\<`T`\>                                |
| `subscription` | `undefined` \| [`Subscription`](#subscription)\<`T`\> |

###### Returns

[`UnsubscribeHandle`](#unsubscribehandle)

##### streamInstance()

> **streamInstance**\<`T`\>(`distinct`, `node`): [`NodeRef`](#noderef)\<`T`\>

Creates or resolves an existing stream instance in the engine. Useful as a joint point when building your own operators.

###### Type Parameters

| Type Parameter | Description                                          |
| -------------- | ---------------------------------------------------- |
| `T`            | The type of values that the stream will emit/accept. |

###### Parameters

| Parameter  | Type                           | Default value | Description                                                                                                                                                                                                    |
| ---------- | ------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `distinct` | [`Distinct`](#distinct)\<`T`\> | `true`        | true by default. Pass false to mark the stream as a non-distinct one, meaning that publishing the same value multiple times will re-trigger a recomputation cycle.                                             |
| `node`     | `symbol`                       | `...`         | optional, a reference to a stream. If the stream has not been touched in the engine before, the engine will instantiate a reference to it. If it's registered already, the function will return the reference. |

###### Returns

[`NodeRef`](#noderef)\<`T`\>

a reference to the stream.

##### sub()

> **sub**\<`T`\>(`node`, `subscription`): [`UnsubscribeHandle`](#unsubscribehandle)

###### Type Parameters

| Type Parameter | Description                                 |
| -------------- | ------------------------------------------- |
| `T`            | The type of values that the node will emit. |

###### Parameters

| Parameter      | Type                                   |
| -------------- | -------------------------------------- |
| `node`         | [`Out`](#out-1)\<`T`\>                 |
| `subscription` | [`Subscription`](#subscription)\<`T`\> |

###### Returns

[`UnsubscribeHandle`](#unsubscribehandle)

##### subMultiple()

> **subMultiple**(`nodes`, `subscription`): [`UnsubscribeHandle`](#unsubscribehandle)

###### Parameters

| Parameter      | Type                                     |
| -------------- | ---------------------------------------- |
| `nodes`        | [`Out`](#out-1)[]                        |
| `subscription` | [`Subscription`](#subscription)\<`any`\> |

###### Returns

[`UnsubscribeHandle`](#unsubscribehandle)

##### \[dispose\]()

> **\[dispose\]**(): `void`

###### Returns

`void`

#### Properties

##### tracer

> `readonly` **tracer**: `Tracer`

## Node Utilities

### addNodeInit()

> **addNodeInit**(`node`, `init`): `void`

#### Parameters

| Parameter | Type                                 |
| --------- | ------------------------------------ |
| `node`    | [`NodeRef`](#noderef)                |
| `init`    | [`NodeInit`](#nodeinit)\<`unknown`\> |

#### Returns

`void`

---

### getValue()

> **getValue**\<`T`\>(`node`): `T`

Gets the current value of a node. The node must be stateful. The function works only in subscription callbacks.

#### Type Parameters

| Type Parameter | Description                             |
| -------------- | --------------------------------------- |
| `T`            | The type of values that the node emits. |

#### Parameters

| Parameter | Type                         | Description         |
| --------- | ---------------------------- | ------------------- |
| `node`    | [`NodeRef`](#noderef)\<`T`\> | the node reference. |

#### Returns

`T`

#### Remarks

if possible, use withLatestFrom or combine, as getValue will not create a dependency to the passed node,
so if you call it within a computational cycle, you may not get the correct value.

## Other

### useIsomorphicLayoutEffect()

> `const` **useIsomorphicLayoutEffect**: (`effect`, `deps?`) => `void`

The signature is identical to `useEffect`, but it fires synchronously after all DOM mutations.
Use this to read layout from the DOM and synchronously re-render. Updates scheduled inside
`useLayoutEffect` will be flushed synchronously, before the browser has a chance to paint.

Prefer the standard `useEffect` when possible to avoid blocking visual updates.

If you’re migrating code from a class component, `useLayoutEffect` fires in the same phase as
`componentDidMount` and `componentDidUpdate`.

#### Parameters

| Parameter | Type             |
| --------- | ---------------- |
| `effect`  | `EffectCallback` |
| `deps?`   | `DependencyList` |

#### Returns

`void`

#### Version

16.8.0

#### See

[https://react.dev/reference/react/useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)

## Logging

### getNodeLabel()

> **getNodeLabel**(`node`): `string`

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `node`    | `symbol` |

#### Returns

`string`

---

### setNodeLabel()

> **setNodeLabel**(`node`, `label`): `void`

#### Parameters

| Parameter | Type                  |
| --------- | --------------------- |
| `node`    | [`NodeRef`](#noderef) |
| `label`   | `string`              |

#### Returns

`void`

---

### TracerConsole

> **TracerConsole** = `Pick`\<`Console`, `"groupCollapsed"` \| `"groupEnd"` \| `"log"`\>

The console that the engine uses for outputting logs.

---

### CC

> `const` **CC**: `object`

A console color utility for cross-environment logging.

#### Type Declaration

##### bgWarn()

> **bgWarn**: (`s`) => `string`[]

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `s`       | `unknown` |

###### Returns

`string`[]

##### blue()

> **blue**: (`s`) => `string`[]

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `s`       | `unknown` |

###### Returns

`string`[]

##### bold()

> **bold**: (`s`) => `string`[]

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `s`       | `unknown` |

###### Returns

`string`[]

##### cyan()

> **cyan**: (`s`) => `string`[]

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `s`       | `unknown` |

###### Returns

`string`[]

##### gray()

> **gray**: (`s`) => `string`[]

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `s`       | `unknown` |

###### Returns

`string`[]

##### green()

> **green**: (`s`) => `string`[]

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `s`       | `unknown` |

###### Returns

`string`[]

##### magenta()

> **magenta**: (`s`) => `string`[]

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `s`       | `unknown` |

###### Returns

`string`[]

##### plain()

> **plain**: (`s`) => `unknown`[]

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `s`       | `unknown` |

###### Returns

`unknown`[]

##### red()

> **red**: (`s`) => `string`[]

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `s`       | `unknown` |

###### Returns

`string`[]

##### yellow()

> **yellow**: (`s`) => `string`[]

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `s`       | `unknown` |

###### Returns

`string`[]

## Misc

### O\<In, Out\>

> **O**\<`In`, `Out`\> = [`Operator`](#operator)\<`In`, `Out`\>

Shorter alias for [Operator](#operator), to avoid extra long type signatures.

#### Type Parameters

| Type Parameter |
| -------------- |
| `In`           |
| `Out`          |

---

### Inp\<T\>

> **Inp**\<`T`\> = [`NodeRef`](#noderef)\<`T`\>

An alias for the NodeRef, signifying that the ref will be used only for publishing.

#### Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `T`            | `unknown`    |

---

### Out\<T\>

> **Out**\<`T`\> = [`NodeRef`](#noderef)\<`T`\>

An alias for the NodeRef, signifying that the ref will be used only for subscriptions.

#### Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `T`            | `unknown`    |

---

### Subscription()\<T\>

> **Subscription**\<`T`\> = (`value`, `engine`) => `unknown`

A function that is called when a node emits a value.

#### Type Parameters

| Type Parameter | Description                             |
| -------------- | --------------------------------------- |
| `T`            | The type of values that the node emits. |

#### Parameters

| Parameter | Type                |
| --------- | ------------------- |
| `value`   | `T`                 |
| `engine`  | [`Engine`](#engine) |

#### Returns

`unknown`

---

### UnsubscribeHandle()

> **UnsubscribeHandle** = () => `void`

The resulting type of a subscription to a node. Can be used to cancel the subscription.

#### Returns

`void`

---

### Comparator()\<T\>

> **Comparator**\<`T`\> = (`previous`, `current`) => `boolean` \| `null` \| `undefined`

A function which determines if two values are equal.
Implement custom comparators for distinct nodes that contain non-primitive values.

#### Type Parameters

| Type Parameter | Description                                      |
| -------------- | ------------------------------------------------ |
| `T`            | The type of values that the comparator compares. |

#### Parameters

| Parameter  | Type               | Description                                                                                                  |
| ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `previous` | `T` \| `undefined` | The value that previously passed through the node. can be undefined if the node has not emitted a value yet. |
| `current`  | `T`                | The value currently passing.                                                                                 |

#### Returns

`boolean` \| `null` \| `undefined`

true if values should be considered equal.

---

### Distinct\<T\>

> **Distinct**\<`T`\> = `boolean` \| [`Comparator`](#comparator)\<`T`\>

A type for the distinct parameter to the [Cell](#cell) and [Stream](#stream) constructors.

#### Type Parameters

| Type Parameter | Description                             |
| -------------- | --------------------------------------- |
| `T`            | The type of values that the node emits. |

---

### NodeInit()\<T\>

> **NodeInit**\<`T`\> = (`eng`, `node$`) => `void`

A node initializer function.

#### Type Parameters

| Type Parameter | Description                                     |
| -------------- | ----------------------------------------------- |
| `T`            | The type of values that the node emits/accepts. |

#### Parameters

| Parameter | Type                         | Description                                       |
| --------- | ---------------------------- | ------------------------------------------------- |
| `eng`     | [`Engine`](#engine)          | The engine instance that is registering the node. |
| `node$`   | [`NodeRef`](#noderef)\<`T`\> | The node reference that is being initialized.     |

#### Returns

`void`

---

### e

> `const` **e**: `object`

#### Type Declaration

#### Operators

###### map()

> **map**\<`I`, `O`\>(`mapFunction`): (`source`, `eng`) => [`NodeRef`](#noderef)\<`O`\>

Maps a the passed value with a projection function.

###### Type Parameters

| Type Parameter | Description                                           |
| -------------- | ----------------------------------------------------- |
| `I`            | The type of values that the incoming node will emit.  |
| `O`            | The type of values that the resulting node will emit. |

###### Parameters

| Parameter     | Type             |
| ------------- | ---------------- |
| `mapFunction` | (`value`) => `O` |

###### Returns

> (`source`, `eng`): [`NodeRef`](#noderef)\<`O`\>

###### Parameters

| Parameter | Type                   |
| --------- | ---------------------- |
| `source`  | [`Out`](#out-1)\<`I`\> |
| `eng`     | [`Engine`](#engine)    |

###### Returns

[`NodeRef`](#noderef)\<`O`\>

###### mapTo()

> **mapTo**\<`I`, `O`\>(`value`): [`Operator`](#operator)\<`I`, `O`\>

Operator that maps the output of a node to a fixed value.

###### Type Parameters

| Type Parameter | Description                                          |
| -------------- | ---------------------------------------------------- |
| `I`            | The type of values that the incoming node will emit. |
| `O`            | The type of the fixed value to map to.               |

###### Parameters

| Parameter | Type |
| --------- | ---- |
| `value`   | `O`  |

###### Returns

[`Operator`](#operator)\<`I`, `O`\>

###### filter()

> **filter**\<`I`, `O`\>(`predicate`): [`Operator`](#operator)\<`I`, `O`\>

Operator that filters the output of a node.
If the predicate returns false, the emission is canceled.

###### Type Parameters

| Type Parameter | Default type | Description                                          |
| -------------- | ------------ | ---------------------------------------------------- |
| `I`            | -            | The type of values that the incoming node will emit. |
| `O`            | `I`          | The type of values that the filtered node will emit. |

###### Parameters

| Parameter   | Type                   |
| ----------- | ---------------------- |
| `predicate` | (`value`) => `boolean` |

###### Returns

[`Operator`](#operator)\<`I`, `O`\>

###### once()

> **once**\<`I`\>(): [`Operator`](#operator)\<`I`, `I`\>

Operator that captures the first emitted value of a node.
Useful if you want to execute a side effect only once.

###### Type Parameters

| Type Parameter | Description                                 |
| -------------- | ------------------------------------------- |
| `I`            | The type of values that the node will emit. |

###### Returns

[`Operator`](#operator)\<`I`, `I`\>

###### scan()

> **scan**\<`I`, `O`\>(`accumulator`, `seed`): [`Operator`](#operator)\<`I`, `O`\>

Operator that runs with the latest and the current value of a node.
Works like the [RxJS scan operator](https://rxjs.dev/api/operators/scan).

###### Type Parameters

| Type Parameter | Description                                          |
| -------------- | ---------------------------------------------------- |
| `I`            | The type of values that the incoming node will emit. |
| `O`            | The type of the accumulated value.                   |

###### Parameters

| Parameter     | Type                        |
| ------------- | --------------------------- |
| `accumulator` | (`current`, `value`) => `O` |
| `seed`        | `O`                         |

###### Returns

[`Operator`](#operator)\<`I`, `O`\>

###### throttleTime()

> **throttleTime**\<`I`\>(`delay`): [`Operator`](#operator)\<`I`, `I`\>

Throttles the output of a node with the specified delay.

###### Type Parameters

| Type Parameter | Description                                 |
| -------------- | ------------------------------------------- |
| `I`            | The type of values that the node will emit. |

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `delay`   | `number` |

###### Returns

[`Operator`](#operator)\<`I`, `I`\>

###### debounceTime()

> **debounceTime**\<`I`\>(`delay`): [`Operator`](#operator)\<`I`, `I`\>

Debounces the output of a node with the specified delay.

###### Type Parameters

| Type Parameter | Description                                 |
| -------------- | ------------------------------------------- |
| `I`            | The type of values that the node will emit. |

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `delay`   | `number` |

###### Returns

[`Operator`](#operator)\<`I`, `I`\>

###### delayWithMicrotask()

> **delayWithMicrotask**\<`I`\>(): [`Operator`](#operator)\<`I`, `I`\>

Delays the output of a node with `queueMicrotask`.

###### Type Parameters

| Type Parameter | Description                                 |
| -------------- | ------------------------------------------- |
| `I`            | The type of values that the node will emit. |

###### Returns

[`Operator`](#operator)\<`I`, `I`\>

###### onNext()

> **onNext**\<`I`, `O`\>(`bufNode`): [`Operator`](#operator)\<`I`, \[`I`, `O`\]\>

description Buffers the stream of a node until the passed note emits.

###### Type Parameters

| Type Parameter | Description                                        |
| -------------- | -------------------------------------------------- |
| `I`            | The type of values that the source node will emit. |
| `O`            | The type of values that the buffer node will emit. |

###### Parameters

| Parameter | Type                         |
| --------- | ---------------------------- |
| `bufNode` | [`NodeRef`](#noderef)\<`O`\> |

###### Returns

[`Operator`](#operator)\<`I`, \[`I`, `O`\]\>

###### handlePromise()

> **handlePromise**\<`I`, `OutSuccess`, `OnLoad`, `OutError`\>(`onLoad`, `onSuccess`, `onError`): [`Operator`](#operator)\<`I` \| `Promise`\<`I`\>, `OutSuccess` \| `OnLoad` \| `OutError`\>

Handles a promise value through the specified callbacks.

###### Type Parameters

| Type Parameter | Description                                          |
| -------------- | ---------------------------------------------------- |
| `I`            | The type of values that the incoming node will emit. |
| `OutSuccess`   | The type of value returned on success.               |
| `OnLoad`       | The type of value returned during loading.           |
| `OutError`     | The type of value returned on error.                 |

###### Parameters

| Parameter   | Type                      |
| ----------- | ------------------------- |
| `onLoad`    | () => `OnLoad`            |
| `onSuccess` | (`value`) => `OutSuccess` |
| `onError`   | (`error`) => `OutError`   |

###### Returns

[`Operator`](#operator)\<`I` \| `Promise`\<`I`\>, `OutSuccess` \| `OnLoad` \| `OutError`\>

#### Node Utilities

###### addNodeInit()

> **addNodeInit**(`node`, `init`): `void`

###### Parameters

| Parameter | Type                                 |
| --------- | ------------------------------------ |
| `node`    | [`NodeRef`](#noderef)                |
| `init`    | [`NodeInit`](#nodeinit)\<`unknown`\> |

###### Returns

`void`

###### getValue()

> **getValue**\<`T`\>(`node`): `T`

Gets the current value of a node. The node must be stateful. The function works only in subscription callbacks.

###### Type Parameters

| Type Parameter | Description                             |
| -------------- | --------------------------------------- |
| `T`            | The type of values that the node emits. |

###### Parameters

| Parameter | Type                         | Description         |
| --------- | ---------------------------- | ------------------- |
| `node`    | [`NodeRef`](#noderef)\<`T`\> | the node reference. |

###### Returns

`T`

###### Remarks

if possible, use withLatestFrom or combine, as getValue will not create a dependency to the passed node,
so if you call it within a computational cycle, you may not get the correct value.

#### Other

###### pipe

Re-exports [pipe](#pipe)

###### changeWith

Re-exports [changeWith](#changewith)

###### link

Re-exports [link](#link)

###### sub

Re-exports [sub](#sub)

###### singletonSub

Re-exports [singletonSub](#singletonsub)

#### Logging

###### getNodeLabel()

> **getNodeLabel**(`node`): `string`

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `node`    | `symbol` |

###### Returns

`string`

###### setNodeLabel()

> **setNodeLabel**(`node`, `label`): `void`

###### Parameters

| Parameter | Type                  |
| --------- | --------------------- |
| `node`    | [`NodeRef`](#noderef) |
| `label`   | `string`              |

###### Returns

`void`
