# Opt-in feature modules

This directory holds **opt-in features** of `@virtuoso.dev/data-table` — code that consumers pay for only when they import it. The main entry (`src/index.ts`) ships everything always required to render a table; anything that's behavior on top (column reorder, future column resize / sort / visibility, etc.) lives here under its own subpath import.

## Convention

```text
src/features/<feature-name>/index.ts   ← implementation + sub-entry barrel (one file)
```

The directory name **is** the package subpath. `src/features/column-reorder/` ships as `@virtuoso.dev/data-table/column-reorder`. No `entry-points/` indirection — the directory's `index.ts` is what the package's `exports` map points at.

The mirror on the registry side:

```text
apps/virtuoso.dev/registry/new-york/data-table/<feature-name>/   ← shadcn registry components for this feature
```

Same name on both sides. A contributor pairing a model with a UI never needs to look up two different conventions.

## What goes in a feature module

A feature is the **model half** of an opt-in capability:

- New `Stream`s (remote-control actions the UI publishes to)
- New `Cell`s (reactive state the UI subscribes to)
- The `e.changeWith` / `e.link` / `e.pipe` reducers that wire those streams and cells together, including reducers that mutate cells exported from the main entry (e.g. `columns$`)
- Any pure helper that operates on those types

The feature does **not** ship React components. UI components live in the shadcn registry (`apps/virtuoso.dev/registry/...`) so consumers get them as copy-and-own source they can restyle freely.

## Adding a new feature — recipe

1. **Create** `packages/data-table/src/features/<name>/index.ts`. Declare your streams, cells, and reducers in the file body. Mark the file with `// oxlint-disable require-hook` because reactive wiring runs at module load.

2. **Add a vite entry** in `packages/data-table/vite.config.ts`:

   ```ts
   lib: {
     entry: {
       index: resolve(import.meta.dirname, 'src/index.ts'),
       'column-reorder': resolve(import.meta.dirname, 'src/features/column-reorder/index.ts'),
       '<name>': resolve(import.meta.dirname, 'src/features/<name>/index.ts'),
     },
     formats: ['es'],
   },
   ```

3. **Add a `package.json` export**:

   ```json
   "./<name>": {
     "import": {
       "types": "./dist/<name>.d.ts",
       "default": "./dist/<name>.js"
     }
   }
   ```

4. **Add a Ladle alias** in the `inLadle` branch of `vite.config.ts`, **before** the `@virtuoso.dev/data-table` alias so the more specific match wins:

   ```ts
   { find: '@virtuoso.dev/data-table/<name>', replacement: resolve(import.meta.dirname, 'src/features/<name>/index.ts') },
   ```

5. **Pair the UI** under `apps/virtuoso.dev/registry/new-york/data-table/<name>/` and register each component in `apps/virtuoso.dev/registry.json` with `dependencies: ["@virtuoso.dev/data-table"]` and `registryDependencies: ["data-table"]`.

6. **Demonstrate** the wiring in `packages/data-table/src/_stories/<name>.stories.tsx`, importing the registry components via the `@/` Ladle alias so the story exercises the same code path real consumers will use.

See `column-reorder/index.ts` for a worked example.

## Why model in package, UI in registry

The model is the part that must stay stable across consumers — anyone wiring a custom drag UI, a button that programmatically reorders, or a server-driven test must publish to the same streams and read the same cells. Shipping it as code consumers can't fork avoids version drift.

The UI is the part that needs to feel native to each consumer's design system. Shipping it through the registry means consumers `npx shadcn add` it once and own the source — they restyle freely without forking the package.

## Cross-entry type sharing (future-proofing note)

`vite-plugin-dts` with `rollupTypes: true` inlines transitively-imported types into each entry's `.d.ts` bundle. For structural interfaces this is invisible (TypeScript's structural typing handles the duplication). If a future feature exposes a **branded** or **symbol-tagged** type that's also exported from the main entry, the duplication becomes a "Type X is not assignable to type X" error.

Two ways out, applied only when the conflict shows up:

1. Set `rollupTypes: false` on the dts plugin → emits per-source `.d.ts` files with explicit cross-entry imports.
2. Configure the underlying `rollup-plugin-dts` `external` option to keep main-entry types as `import` references inside sub-entry bundles.

Don't preemptively change anything; verify clean output for each new feature first.
