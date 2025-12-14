import { defineRouteMiddleware } from '@astrojs/starlight/route-data'

const leadingNumberAndDotRegEx = /^(\d+)\./

function toTitleCase(str: string) {
  if (!str.includes('-')) {
    // Check if already has internal capitals (PascalCase) - preserve as-is
    if (/[a-z][A-Z]/.test(str)) {
      return str
    }
    // Single word without dashes - just capitalize first letter
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
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
  const { head, id, sidebar } = context.locals.starlightRoute
  sortAndCleanEntries(sidebar)

  // Add OG image meta tags
  // Content collection IDs normalize folder/index.mdx to just folder
  const ogId = id.replace(/\/index$/, '') || 'index'
  const ogImageUrl = new URL(`/og/${ogId}.png`, context.site)
  head.push({ attrs: { content: ogImageUrl.href, property: 'og:image' }, tag: 'meta' })
  head.push({ attrs: { content: ogImageUrl.href, name: 'twitter:image' }, tag: 'meta' })
})
