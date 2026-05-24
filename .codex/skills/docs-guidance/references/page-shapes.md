# Page Shapes and Section Shapes

Templates for whole pages (by type) and for recurring section shapes within pages.

Consult this file when writing a new page from scratch, restructuring an existing page, or naming/ordering the sections of a page that already has its content roughed in.

## Page Shapes by Type

### Concept pages

For pages that introduce a single concept or primitive (a model, a hook, a low-level component). The audience is developers learning the primitive itself.

If the page describes a feature with a user-facing surface — grouping, filtering, drag-and-drop, sticky pinning, column reorder, visibility toggles — use the **Feature pages** template instead. Concept template is for pure-developer-facing primitives.

- Open with the reader problem.
- Explain the concept in ordinary words.
- Show the data/state/API contract.
- Show the smallest safe example.
- Add runtime/lifecycle caveats.
- Link to one deeper example or adjacent decision.

### Feature pages

For pages that describe a user-facing capability — grouped rows, filtering, sorting, column reorder, column visibility, sticky pinning, drag-and-drop, expand/collapse. The developer reading the page is configuring something their end user will see or interact with.

The temptation in feature docs is to lead with the data shape or config object because it's the cleanest thing the writer understands. Resist it — the data shape is what makes the feature work, not what makes the feature interesting to the reader.

- **What the end user sees.** Open with a sentence (or a small "this is the result" demo) describing the visible outcome.
- **What the end user does.** If the feature is interactive, demonstrate the interaction with a live example that includes the UI control the user clicks, toggles, or drags. Static-only demos of interactive features are a smell — see [diagnostics.md](diagnostics.md#feature-pages).
- **How to wire the interaction.** The API surface that exposes the behavior (model action, hook, prop) paired with the UI piece that triggers it. Treat the UI and the model wiring as one recipe; splitting them hides the half the reader came for.
- **The data contract or config shape.** Only after the interaction has been shown. The contract is in service of the recipe above it.
- **Variations.** Local vs remote, simple vs interactive, single-level vs multi-level — each as a sub-section that re-uses the user-behavior-first ordering.
- **Limits and escape hatches.** Close with what doesn't fit and where to go next.

### Example pages

For pages that demonstrate a recipe end-to-end.

- First paragraph: "This example uses X to solve Y."
- `## APIs used` — short list grouped by job, not exhaustive reference.
- Runnable example code.
- Closing section named `## Notes`, `## When this doesn't fit`, `## When to outgrow this shape`, or `## What this leaves out`.

### Troubleshooting and performance pages

- Lead with symptoms and decision rules.
- Prefer tables mapping symptom → fix.
- Avoid implying users should tune defaults without a concrete symptom.

### Installation pages

- State what gets installed or generated.
- Distinguish local editable code from package dependencies.
- Show the smallest successful setup.
- Link to the next required setup tasks.

### Migration pages

- State what is not a drop-in replacement.
- Map old concepts to new concepts.
- Give a recommended sequence, not a pile of independent facts.
- End with the core mental-model shift.

## Section Shapes (within pages)

These shapes recur across multiple page types — use them wherever they fit.

### Limitation-focused section (gotcha-led)

When a section exists because of a trap — "Placeholders" in a runtime-discovery page, "Empty responses" in a remote-data page, "Schema drift" in a persistence page:

1. Open with the trap. Describe the bug the section's recipe prevents.
2. Show the recipe.
3. Add sidebar advice for cases the recipe still doesn't cover.

Example opening: _"The field scanner has no way to tell offset-mode placeholders apart from real rows — it treats them as ordinary data."_ — then the schema-compatible placeholder recipe.

### Comparison / "When this does not fit" section

When enumerating alternatives at the end of a page, use **named bullets** with bold term labels:

```markdown
- **Backend-defined schemas.** Use when the backend already knows the shape.
- **Statically-known schemas.** Use when the schema is in code but the JSX would be repetitive.
- **Runtime column-management UI.** Lift the field list into your own state when the user can add or reorder fields after mount.
```

Close with a one-sentence summary of when the current page's approach _does_ fit.

### Topic-first, alternative-second

Never open a section by recommending the alternative it is meant to compare against. Pattern:

1. Show the section's actual topic.
2. After the example, add a sidebar paragraph for the alternative — "When the backend can return column metadata alongside the rows, prefer that."

### Parameter / config explanation block

When showing what arrives at a render prop, hook, or callback, use bullets per parameter:

```markdown
The render function is called with `{ data, model }`:

- `data` is X — it does not change when Y.
- `model` is Z — available for the rare case where W.
```

Easier to scan than parallel prose sentences.

### "How the contract looks" before the example

When behavior depends on a contract (data shape, config shape, event payload), render the shape inline before the runnable example:

````markdown
The render function receives:

```ts
{
  data: readonly Row[]
  model: DataModelHandle<Row>
}
```

Then the example…
````

The shape grounds the example. Without it, the reader has to reverse-engineer the contract from the example body.
