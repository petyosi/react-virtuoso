# Diagnostics: Invariants and Smells

Two complementary frameworks. Invariants describe what every page must teach. Smells describe what to look for when something feels off.

Consult this file when reviewing existing prose, auditing a page against a standard, or deciding which rule to apply to a vague "this feels off" comment.

## Documentation Invariants

When revising a page, look for the invariant that matters most and make it explicit. Do not let a page merely say an API exists — it should explain the invariant the API protects.

- **Ownership.** Where state, configuration, data, or styling should live.
- **Identity.** Which keys, names, IDs, fields, or handles must remain stable.
- **Shape.** The exact shape of data, config, events, return values, or rendered structure.
- **Lifecycle.** What is created once, reused, reset, persisted, fetched, cancelled, or cleaned up.
- **Boundary.** Which package, wrapper, component, hook, adapter, or integration owns each responsibility.
- **Failure mode.** What breaks when the pattern is used in the wrong context.
- **Escape hatch.** Which API, guide, or example to use when the simple pattern no longer fits.

A page that names its API but does not teach one of these invariants is incomplete. The invariant is the load-bearing knowledge; the API is just the surface for invoking it.

## Readability Failure Smells

Revise when a page has any of these. Grouped by where the smell shows up.

### Opening and framing

- Starts with a library abstraction before explaining the user problem.
- Begins a section as if the reader already accepted an unstated premise.
- Opens a section by recommending the alternative the section is meant to compare against. The section is supposed to teach _this_ approach — defer the alternative to a sidebar at the end.
- Limitation-focused section opens with the recipe instead of the bug the recipe prevents. Lead with the trap, then the fix.

### Concepts and terminology

- Uses a term that only makes sense after reading another page.
- Drifts into odd phrases, private shorthand, or terms the reader would not naturally use.
- The same identifier appears in the same doc with different shapes (e.g., two helpers named `fieldsFromRows` returning different types). Rename one to disambiguate.

### Section purpose

- Describes mechanics but not the reason the mechanic exists.
- Says what is possible but not when to choose it.
- Explains internal architecture when the user needs a decision rule.
- The section's audience overlaps poorly with the parent page's audience — it likely belongs in a different page.
- Has paragraphs that restate the previous paragraph's claim ("This means…", "This keeps things X…", "In other words…"). Meta-commentary that adds no new information; drop it.

### Structure and navigation

- Headings accurate but not helpful to a scanning reader. A heading should announce what the reader will learn, not just name the API.
- Jumps from install or setup straight into advanced options without a "what now" bridge.
- Cross-link text is vague ("see X"). The link text should answer "why follow this." Prefer `[Generated columns](…) for type-aware columns` over `see [Generated columns](…)`.

### Example quality

- Presents "correct" code that would be unsafe in real usage.
- Demonstrates a feature for dynamic or variable data using uniform example rows — silently hiding the variability question the feature exists to answer.

### Feature pages

- Page teaches the data contract or config object thoroughly but never shows what the end user can do with the feature. The reader closes the page knowing the shape but unable to picture the result or the interaction.
- An interactive feature (the user clicks, drags, toggles, regroups, reorders) is demonstrated only as a static example. No control to click, no model action paired with UI. If the feature is interactive, the example must show the interaction.
- Page leads with the data shape rather than what the end user sees. Almost always a sign that the writer let the cleanest-to-explain thing become the lead. The fix is to invert: end-user behavior first, contract last.
- Interactive variations (Group By Category, Sort by Name) appear only as a bullet in a list of options, never as a worked example with the UI surface that fires them.

### Framing tone

- Uses defensive framing for things the library deliberately leaves to the user. ("The package does not ship X" → "X lives in your code so the rules stay obvious next to the table.")
- Apologetic phrasing for intentional design choices ("currently does not re-fetch") instead of confident phrasing ("intentionally one-shot").
- **Narrative motivation in openers.** Opens with what users want, feel, or expect instead of what the page documents. _"Users expect headers to do work"_, _"A column header is rarely just a label"_, _"Wide tables push key context off-screen the moment a reader scrolls"_ — these are scene-setting. The reader is here for the mechanism; preface drama is friction. Replace with a direct statement of the structure: _"A column header has four slot positions for additional UI: …"_.
- **Anthropomorphism of inanimate code.** Gives UI parts intentions, conflicts, or effort. _"fighting the label for space"_, _"the slots compete"_, _"the header expects"_, _"the column wants to be wider"_. Replace with literal mechanics — _"the slot is positioned outside the label's flex flow"_ beats _"the slot doesn't fight the label for space"_. If the literal mechanic is unclear, the metaphor was hiding that the writer didn't know.
- **Vibes enumeration.** Lists capabilities as atmospheric color rather than as commitments to coverage. _"sort the column, open a filter menu, expose a resize handle, surface a 'Pin to left' affordance"_ — reads like marketing. Either commit to which the page covers (and link out for the rest), or replace the list with the structural fact behind it (_"Any UI that mounts into one of these four slots"_). A list of nice-sounding capabilities the page won't actually teach is filler.
- **"Rarely just X" / "More than just X" framings.** Opening with a denial of the obvious in order to motivate the topic. _"A column header is rarely just a label"_, _"This isn't just a placeholder"_, _"Sticky columns are more than a CSS trick"_. The reader didn't claim the thing was just X; the denial creates a fake premise the page then dismantles. Drop the denial and state what the thing is.

## Triage rule

If a page exhibits multiple smells, fix the opening first. A confused opening cascades: every section after it is read through the wrong lens, so smells later in the page often dissolve once the lead is right.
