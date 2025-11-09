# Push-based state management

Welcome to the README of Reactive Engine, a TypeScript-native reactive state management library for complex web applications and components that do not have the symmetry of the store object and the component tree.

## Why should you consider Reactive Engine?

- **Push-based recalculation model**. Unlike the regular, "pull", imperative state recalculation model. Reactive Engine uses a push-based model, where data flows through pipes described with functional operators. Among other benefits, this lets you publish values into multiple nodes **and** subscribe for changes in multiple nodes simultaneously, reducing the amount of UI re-renders.

- **Open and Extendable**. The cell/stream definition approach lets you extend the logic of the state management by connecting more nodes and interactions to the existing ones in multiple modules. This lets you design your state management as smaller distributed pieces and even build a plugin system on top of it.

- **Optimized**. The Reactive Engine nodes are distinct by default. A distinct node pushes through its subscribers only when a value different than the previous one is published. This allows you to avoid expensive computations and re-renders.

- **Type-safe**. cells and streams are typed and carry the right value types through the node operators and the React hooks that refer them.

- **Testable**. You can easily initiate an engine and interact with your nodes outside of React. This makes it easy to unit-test your state management logic.

- **React friendly**. Reactive Engine ships an Engine provider component and set of hooks that let you access the values and publish new values in the given nodes.

## Conceptual Overview

The library is based on the concept of node **definitions**, which are instantiated as **nodes** in a graph-based structure called an **Engine**. The nodes are connected through **dependencies** and **transformations** that describe how the values that flow through the nodes map and transform.

### Cells, Streams, and Triggers

Reactive Engine has three types of node definitions: **cells**, **streams**, and **triggers**. The cells are stateful, which means that the values that flow through them are stored in the engine between computations. The streams are stateless cells; you can publish a value through a stream that will trigger the specified computations and you can subscribe to stream updates, but you can't query the current value of a stream.

Finally, triggers are value-less streams - they are meant to trigger a state update without a parameter.

### The Engine

The `Cell`, `Stream`, and `Trigger` calls are just definitions **and** references to nodes in an engine. The actual instantiation and interaction (publishing, subscribing, etc., current state) happens inside an Engine instance. An engine is initially empty; it creates its node instances when you subscribe or publish to a node through the engine's methods - usually, this happens through the provided React hooks. If a node refers to other nodes, the engine will automatically recursively initialize those nodes as well.

A node has a single instance in an engine that has referred to it. If you subscribe to a node multiple times, the engine will use the same instance. In practice, you don't have to care about the difference between a node instance and a definition.

## Installation

Reactive Engine is distributed as an NPM package. Install it with NPM or any of its fancier replacements. Every function and class from the samples is a named export from it. The package ships with TypeScript types, so no need to install an additional types package.

```sh
npm install @virtuoso.dev/reactive-engine
```

## Defining cells and streams

The first step in building your state management logic is to define the cells and streams that will flow and transform the values of your state. Unlike other state management libraries, Reactive Engine doesn't have the concept of a store. Instead, the cells and streams definitions are declared on the module level. A cell is defined by calling the `Cell` function, which accepts an initial value, an initialization function that can be used to connect the cell to other nodes using the engine instance that starts it, and an optional distinct flag (`true` by default). The `Stream` function is the same but without the initial value argument.

Note: You can name the node references with a dollar sign suffix, to indicate that they are reactive. Most likely, you will reference their values in the body of the operators/React components without the dollar sign suffix.

```ts
const myCell$ = Cell(
  // initial value
  0,
  // the r is the engine instance that starts the cell
  (r) => {
    r.sub(myCell$, (value) => {
      console.log('myCell$ changed to', value)
    })
  }
  // distinct flag, true by default
  true
)

// Since streams have no initial value, you need to specify the type of data that will flow through them
const myStream$ = Stream<number>(
  // the r is the engine instance that starts the cell
  (r) => {
    r.sub(myStream$, (value) => {
      console.log('myStream$ changed to', value)
    })
    // publishing a value through a stream will publish it into $myCell as well
    r.link(myStream$, myCell$)
  },
  // distinct flag
  true
)
```

Note: if a node passes non-primitive values, but you want to optimize the computation, you can pass a custom comparator function as the `distinct` argument.

## Working with nodes

On their own, the cell/stream definitions won't do anything. The actual work happens when an engine instance is created and you start interacting with node refs returned from `Cell`/`Stream`. The next section shows some of the basic node interactions.

### Publishing and subscribing, and getting the current values

Following the example above, you can create an engine instance and publish a value through the declared stream using `pub` and `sub`:

```ts
const engine = new Engine()

engine.sub(myCell$, (value) => {
  console.log('a subscription from the outside', value)
})

engine.pub(myStream$, 1)
```

Note: In addition to `pub`/`sub`, the engine supports both publishing and subscribing to multiple nodes at once with its `pubIn` and `subMultiple` methods. You can also use exclusive, "singleton" subscriptions through the `singletonSub` method - these are useful for event handling mechanisms.

```ts
// multiple publishing with a single recalculation
engine.pubIn({
  [foo$]: 'foo 1 value',
  [bar$]: 'bar 1 value',
})

// subscribe to the values of multiple nodes with a single subscription
r.subMultiple([foo$, bar$], ([foo, bar]) => console.log(foo, bar))
```

The cell nodes are stateful, you can also get their current value for a given engine instance using the `getValue`/`getValues` methods at any moment:

```ts
r.getValue(myCell$) // 1
r.getValues([myCell$ /* $myCell2, $myCell3, etc */])
```

While perfectly fine, and sometimes necessary, getting the values moves the data outside of the reactive engine paradigm. You should use those as the final endpoint of your state management.

## Linking, combining, and transforming nodes

The examples so far have referred to the most basic way of connecting nodes - the `link` method. It's a one-way connection that pushes the values from the source node to the target node. The bread and butter of Reactive Engine are the operators that allow you to create more complex relationships between the nodes. The operators are used with the engine's `pipe` method. The below example will add `1` to the value that flows through `myStream$` and publish it to `myCell$`:

```ts
// use this in the initialization function of myStream$
r.link(
  r.pipe(
    myStream$,
    map((x) => x + 1)
  ),
  myCell$
)
```

`map` and `filter` are the most basic operators. Reactive Engine includes additional ones like `mapTo`, `throttleTime`, and `withLatestFrom`. An operator can be a conditional, like `filter`, or even asynchronous, like `throttleTime` or `handlePromise`. You can create custom operators by implementing the `Operator` interface.

## Using in React

Reactive Engine includes an `EngineProvider` React component and a set of hooks that allow you to access the values and publish new values in the given nodes. Referring to a node in the hooks automatically initiates it in the nearest engine.

```tsx
const foo$ = Cell('foo', true)

function Foo() {
  const foo = useCellValue(foo$)
  return <div>{foo}</div>
}

export function App() {
  return (
    <EngineProvider>
      <Foo />
    </EngineProvider>
  )
}
```

Additional hooks include `usePublisher`, `useCellValues`, and the low-level `useEngine` that returns the engine instance from the provider.

## Next steps

The README is meant to give you a breath-first overview of the library. More details about the operators, hooks, and engine capabilities can be found in the API Reference.
