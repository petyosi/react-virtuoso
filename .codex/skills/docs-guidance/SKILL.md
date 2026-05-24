---
name: docs-guidance
description: Revises project documentation for human readability, conceptual flow, and example safety. Covers concept pages, example pages, troubleshooting, installation, and migration docs. Use when writing or reviewing docs, when the user says a page "feels off", "feels weird", "feels sudden", or "needs attention", when asked to make a doc clearer or to rewrite a section, when fixing cold or abrupt openings, when a section opens with the API mechanism instead of the user's problem, or when comparing prose against a readability standard.
---

# Docs Guidance

Use this skill for project documentation work. Treat docs quality as a product concern: the reader should understand where they are, why the topic exists, what shape the relevant data or API has, and when the shown pattern stops fitting.

This skill is intentionally general. Apply it to package docs, guides, examples, troubleshooting pages, migration notes, and installation pages across the repo.

## Workflow

1. Start from the reader's task, decision, or confusion, not from the API list.
2. Identify the core contract the page must teach: state ownership, data shape, lifecycle, render boundary, persistence keying, configuration shape, backend shape, or control surface.
3. Rewrite around the path: user problem → concept → contract → runnable example → limits and next step.
4. Keep examples safe for real usage, not just short.
5. End with a concrete escape hatch: where to go when this example no longer fits.

## Core Readability Rules

These are the non-negotiables. Most doc-quality problems trace to violating one of them:

- **Start from the reader's situation.** Open each page with the user problem, decision, or concrete setup. Never begin with an unexplained abstraction or API name unless the page is explicit API reference.
- **Describe, don't dramatize.** State what the thing is and what it does in literal terms. Don't open with what users feel or expect ("users expect…", "users develop opinions about…"); don't give code or UI intentions, conflicts, or effort ("the slot fights for space", "the header expects to do work"); don't enumerate capabilities as atmospheric color when the page only covers some of them. Narrative motivation, anthropomorphism, and vibes lists all signal the writer didn't commit to a direct statement of the mechanism. See [diagnostics.md → Framing tone](references/diagnostics.md#framing-tone) for the specific smells.
- **Define concepts before using them.** Don't introduce project terms (`engine`, `slot`, `pipeline`, `marker`, `adapter`, `state cell`, `registry`, `provider`) without grounding them in the user's mental model first.
- **Explain why before how.** Show the pressure that creates the API — rows need stable identity, requests can be superseded, persisted state needs a stable key — before showing the call signature.
- **For feature pages, lead with user-facing behavior.** If a feature has an end-user surface (something the user sees, clicks, drags, toggles), demonstrate that surface — visibly, interactively when it's interactive — before the developer-facing config or data contract. The developer is reading the page to enable an end-user behavior; the end-user behavior is the topic, not the config that supports it.
- **Show the contract just before the recipe it grounds.** When you're about to drop a code block whose behavior depends on a contract, render the data/state/config shape one paragraph before the code so the example doesn't have to be reverse-engineered. This is a within-section pattern, not a whole-page ordering rule — at page level, the user-facing behavior (for feature pages) or the reader's problem (for concept pages) comes first.
- **End with a concrete next step.** Every section should exit with a pointer to the next decision, deeper example, or escape hatch.

## When to consult deeper material

Load these references when the work calls for them. Keeping them out of this file is deliberate — load only what the current task needs.

- **[references/diagnostics.md](references/diagnostics.md)** — the invariants framework (what every page must teach) and the failure smells (what to look for when reviewing). Consult when reviewing, diagnosing, or auditing existing prose.
- **[references/page-shapes.md](references/page-shapes.md)** — templates for concept, example, troubleshooting, installation, migration, and limitation-focused pages, plus templates for section-level shapes (gotcha-led, comparison, topic-first-alternative-second). Consult when writing a new page or restructuring an existing one.
- **[references/example-craft.md](references/example-craft.md)** — rules for the code examples themselves: stable instances, variable-shape demo data, identifier conflict resolution, defensive-to-positive framing, and styling-layer choices. Consult when writing or auditing example code blocks.

## Final Check

Before finishing, confirm:

- Can a reader understand the first paragraph without reading another page?
- Are all public terms introduced before use?
- Does every code example model safe state ownership and lifecycle?
- Does every advanced mechanism explain the user pressure that creates it?
- Does the page tell the reader what to do next when this pattern is not enough?
