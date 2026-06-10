# Virtuoso Skills

This private workspace package is the canonical source for the `virtuoso-skills` agent distribution. It packages the same four skills (react-virtuoso, message-list, data-table, and reactive-engine) for Claude Code, Codex, and Agent Skills consumers such as Codex, OpenCode, and Cursor.

The package is not imported by the runtime libraries. It owns the hand-authored `SKILL.md` source files under `packages/virtuoso-skills/skills/` and generates the documentation references and public mirrors used by installers.

## Generated Output

Run the build from the repo root:

```bash
pnpm build:skills
```

The command regenerates:

- `packages/virtuoso-skills/skills/*/references/` from each package README and docs tree
- `skills/` for `npx skills` source discovery
- `plugins/virtuoso-skills/skills/` for Codex plugin packaging

Edit `packages/virtuoso-skills/skills/<name>/SKILL.md` when authoring skill behavior. Do not edit generated `references/` directories or mirrors directly.

## Distribution

Claude Code installs the plugin from the repo marketplace:

```bash
/plugin marketplace add petyosi/react-virtuoso
/plugin install virtuoso-skills@virtuoso
```

Codex installs the plugin from the public repo marketplace after merge:

```bash
codex plugin marketplace add petyosi/react-virtuoso --ref main --sparse .agents/plugins --sparse plugins/virtuoso-skills
codex plugin add virtuoso-skills@virtuoso
```

Agent Skills users install from the dedicated public mirror, [`virtuoso-dev/skills`](https://github.com/virtuoso-dev/skills). `npx skills` shallow-clones the whole source repository before copying the selected skill, so pointing it at the small mirror pulls just the four skill directories instead of the entire monorepo:

```bash
npx skills add virtuoso-dev/skills --skill '*' -a codex -a opencode -a cursor --copy -y
```

## Releases

The package version is the source for both plugin manifests. Add a changeset when the skill distribution changes; when Changesets bumps this package, the `version` lifecycle script updates the Claude and Codex plugin manifests to match.
