import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'
import { defineCollection } from 'astro:content'

// Strip numeric prefixes from path segments (e.g., "1.virtuoso" -> "virtuoso")
function stripNumericPrefix(segment: string): string {
  return segment.replace(/^\d+\./, '')
}

// Using default Starlight loader - external docs are synced via docsSync integration
export const collections = {
  docs: defineCollection({
    loader: docsLoader({
      generateId: ({ entry }) => {
        // Remove file extension first
        const withoutExt = entry.replace(/\.(mdx?|md)$/, '')
        // Strip numeric prefixes from each path segment
        return withoutExt.split('/').map(stripNumericPrefix).join('/')
      },
    }),
    schema: docsSchema(),
  }),
}
