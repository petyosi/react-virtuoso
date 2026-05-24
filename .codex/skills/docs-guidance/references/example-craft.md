# Example Craft

Rules for the code examples themselves — how to construct them so they teach honestly without hiding the lifecycle, state ownership, or variability that real usage will hit.

Consult this file when writing or auditing the code blocks inside a doc page (live demos, recipe snippets, illustrative JSX).

## Production-Safe Defaults

Examples should model the safe version, not a shortened one that hides the real constraints.

- Use stable instances for stateful objects (no inline `new X()` in render).
- Use stable identities (`key`, `id`) when items can move, persist, or be restored.
- Include required cleanup, cancellation, or abort handling when async work is shown.
- Keep generated data schemas deterministic.
- Keep persistence examples clear about what is and is not saved.
- Keep styling examples attached to the right layer: local content styling, wrapper styling, component overrides, or global CSS.
- Avoid examples that are only short because they hide the lifecycle or state-ownership rule.

## Demo Data Craftsmanship

The shape of the data matters as much as the code that processes it.

- **Variable-shape data for dynamic-feature examples.** When demonstrating something that handles schema variability, the example rows must actually vary — some rows with extra fields, some without. Uniform example rows silently hide the question the feature exists to answer.
- **Realistic field counts.** Three uniform columns make every feature look easy; six fields with mixed types stress the layout the same way real usage will.
- **Schemas the reader recognises.** Use product/order/user shapes the reader has seen before. Resist the urge to invent fictional domains that need their own explanation.

## Identifier Discipline Within a Doc

- **Resolve identifier conflicts.** When you introduce a function, type, or prop name, scan the rest of the page for collisions. Two helpers named `fieldsFromRows` with different signatures in the same doc is a real confusion source. Rename one to disambiguate (`fieldsToShow`, `runtimeFields`, etc.).
- **Inline helpers vs. canonical helpers.** When an example uses a slim inline helper because the canonical full helper would be overkill, name it differently so the reader can tell which one they're looking at.

## Framing Tone

The words around the code carry the design's intent. Defensive or apologetic phrasing makes intentional choices look like missing features.

- **Defensive to positive.** When the library deliberately doesn't ship a helper, reframe the absence as a benefit: _"Field scanning lives in your app code so the rules stay obvious next to the table"_ beats _"The package does not inspect your row shape for you"_.
- **No apologies for design choices.** If the one-shot nature of a feature is intentional, say "intentionally one-shot" — not "currently does not re-fetch" (which sounds like a missing feature).
- **Acknowledge limitations honestly.** When a constraint really is a limitation, name it as one and point at the workaround: _"Offset placeholders cannot be distinguished from real rows. Use schema-compatible placeholders or backend-provided column metadata."_ Honest framing beats both apology and silence.

## Component-Example Style

Patterns that recur in component-library docs.

- **`className` over wrapping `<div>`.** When a component accepts a `className`, prefer it to wrapping the render result in a styled `<div>`. Wrapping changes the DOM structure and breaks layout assumptions in many table, grid, and list contexts; using `className` keeps the wrapping consistent with non-example usage.
- **Use the wrapper component the project ships.** If the project ships a shadcn-style wrapper (`DataTableCell`, `DataTableColumn`), use it in examples instead of the unwrapped primitive. The wrapped form is what users will copy; show that path.
- **Skip the JSX import boilerplate in snippets.** Inline code blocks in the middle of prose are clearer when they show only the JSX under discussion. Save the full `import` list for live blocks that need to run.
