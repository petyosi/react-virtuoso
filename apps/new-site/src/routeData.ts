import { defineRouteMiddleware } from '@astrojs/starlight/route-data'

const leadingNumberAndDotRegEx = /^(\d+)\./

function toTitleCase(str: string) {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function getNumericPrefix(label: string): number {
  const match = leadingNumberAndDotRegEx.exec(label)
  return match ? parseInt(match[1], 10) : 0
}

interface SidebarEntry {
  entries?: SidebarEntry[]
  label: string
  type: string
}

function sortAndCleanEntries(entries: SidebarEntry[]) {
  // Sort all entries by numeric prefix in label
  entries.sort((a, b) => getNumericPrefix(a.label) - getNumericPrefix(b.label))

  for (const entry of entries) {
    // Remove leading number + dot from label
    const label = entry.label.replace(leadingNumberAndDotRegEx, '')
    // Convert to Title Case (handling kebab-case)
    entry.label = toTitleCase(label)

    // Recurse into children for groups
    if (entry.type === 'group' && entry.entries) {
      sortAndCleanEntries(entry.entries)
    }
  }
}

export const onRequest = defineRouteMiddleware((context) => {
  const { sidebar } = context.locals.starlightRoute
  sortAndCleanEntries(sidebar)
})
