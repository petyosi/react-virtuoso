import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const posts = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string(),
    author: z.string(),
    image: z
      .object({
        url: z.string(),
        alt: z.string(),
      })
      .optional(),
    tags: z.array(z.string()).optional(),
  }),
})

const api = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/api' }),
  schema: z.object({
    title: z.string(),
    // Optional layout field for TypeDoc generated pages
    layout: z.string().optional(),
  }),
})

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../virtuoso.dev/docs/guides' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    sidebar_label: z.string().optional(),
    sidebar_position: z.number().optional(),
    slug: z.string().optional(),
  }),
})

export const collections = {
  posts,
  api,
  guides,
}
