# Reactive Engine router implementation plan

The idea is to implement a router that communicates its state change through reactive engine nodes.

## Route DSL syntax

```tsx
const routeDef = '/{org:string}/{repo:string}/issues/{issueId:number}?filter={filter:string}&sort={sort:string}'
```

You can omit the segment type, it will default to string.

A segment can be marked as optional with a `?` suffix. e.g. `{org?}`

Supported types:

- string
- number
- boolean
- array (only in query strings)

TODO: how to handle optional segments, splatter paths, etc.

## Route definition

A `Route` call returns a cell that emits the typed structure when active, null when inactive. The route accepts a route string in its definition, and a React component to render.

Note: the component is stored in an internal global map that uses the node as a key (it's just a symbol, after all)

```tsx

```

## Router definition

A router definition returns a Cell that emits the current path, and, maybe, a publisher (`setRoute$`), and maybe `component$` that will emit what's assembled for the active route. It accepts an array of route cells to use.

Probably best to return an object with those cells.

## Router React component

The Router react component accepts the Router object, and connects it to the browser history. This can be done in the Router itself, but if done in the react component, it will be easier to test. It renders the result of the router.

## Layout

A layout looks like a route - it also accepts a path. When the router does the matching and the component assembly, it also finds applicable layouts, sorts them by specificity, and nests them.

## Layout Slot Components

A layout slot is just a cell. There are two React components - Slot and Fill. The layout can define a Slot that refers to a layout slot. A route can then use a Fill that points to the same slot.
