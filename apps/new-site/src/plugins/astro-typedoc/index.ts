/* eslint-disable no-console */
import type { AstroIntegration } from 'astro'

import { watch } from 'node:fs'
import { readdir, readFile, rename, rmdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
import {
  Application,
  Converter,
  type DeclarationReflection,
  PageEvent,
  type ProjectReflection,
  ReflectionKind,
  TSConfigReader,
} from 'typedoc'

interface EntryPoint {
  name?: string
  path: string
}

type FrontmatterObject = Record<string, number | string>

interface GenerateDocsOptions {
  frontmatter?: FrontmatterObject
  outputFolder?: string
  project: ProjectReflection
}

const objectToFrontmatter = (object: FrontmatterObject = {}): string =>
  Object.entries(object)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

interface CommentType {
  blockTags?: { content: { text: string }[]; tag: string }[]
}

// Extract @group tag from a comment
const getGroupFromComment = (comment: CommentType | undefined): string | undefined => {
  if (!comment?.blockTags) return undefined

  const groupTag = comment.blockTags.find((tag) => tag.tag === '@group')
  if (groupTag && groupTag.content.length > 0) {
    return groupTag.content[0].text.trim()
  }
  return undefined
}

// Extract @group tag from a reflection's comment
// For function reflections (created by @function tag), the comment may be on the signature
const getGroupFromReflection = (reflection: DeclarationReflection): string | undefined => {
  // Check direct comment first
  const directGroup = getGroupFromComment(reflection.comment as CommentType)
  if (directGroup) return directGroup

  // For functions, check signatures
  if (reflection.signatures && reflection.signatures.length > 0) {
    for (const sig of reflection.signatures) {
      const sigGroup = getGroupFromComment(sig.comment as CommentType)
      if (sigGroup) return sigGroup
    }
  }

  return undefined
}

const onRendererPageEnd = (frontmatterObject?: FrontmatterObject) => (event: PageEvent) => {
  if (!event.contents) {
    return
  }

  // Extract group from the model's comment (or from signatures for functions)
  const group = getGroupFromReflection(event.model as DeclarationReflection)

  const prependix = `---
title: '${event.model.name}'
${group ? `group: '${group}'` : ''}
${objectToFrontmatter(frontmatterObject)}
---

`

  event.contents = prependix + event.contents
}

const onDeclaration =
  (entryPoints: EntryPoint[] = []) =>
  (_context: unknown, reflection: DeclarationReflection) => {
    if (reflection.kind === ReflectionKind.Module) {
      const matchingEntryPoint = entryPoints.find((entryPoint) => entryPoint.path === reflection.sources?.[0]?.fullFileName)

      reflection.name = matchingEntryPoint?.name ?? reflection.name
    }
  }

const typedocConfig = {
  disableSources: true,
  excludeExternals: true,
  excludeInternal: true,
  excludePrivate: true,
  excludeProtected: true,
  githubPages: false,
}

const markdownPluginConfig = {
  fileExtension: '.mdx',
  hideBreadcrumbs: true,
  hidePageHeader: true,
  hidePageTitle: true,
  parametersFormat: 'table',
}

// Remove redundant prefixes like "class.", "function.", "interface.", etc.
const removePrefixFromFilename = (filename: string): string => {
  const prefixes = ['class.', 'function.', 'interface.', 'type.', 'enum.', 'variable.', 'namespace.']
  for (const prefix of prefixes) {
    if (filename.toLowerCase().startsWith(prefix)) {
      return filename.slice(prefix.length)
    }
  }
  return filename
}

// Recursively rename files in a directory to remove prefixes
const removePrefixesFromFiles = async (dir: string): Promise<void> => {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      await removePrefixesFromFiles(fullPath)
    } else if (entry.isFile() && (entry.name.endsWith('.mdx') || entry.name.endsWith('.md') || entry.name.endsWith('.html'))) {
      const newName = removePrefixFromFilename(entry.name)
      if (newName !== entry.name) {
        const newPath = join(dir, newName)
        await rename(fullPath, newPath)
      }
    }
  }
}

interface GroupedFile {
  content: string
  group: string
  title: string
}

const GROUP_ORDER = ['Virtuoso', 'GroupedVirtuoso', 'VirtuosoGrid', 'TableVirtuoso', 'GroupedTableVirtuoso', 'Common', 'Misc']

// Custom sort order for items within each group
// Items not in this list will be sorted alphabetically after the listed ones
const ITEM_SORT_ORDER: Record<string, string[]> = {
  Common: [],
  GroupedTableVirtuoso: ['GroupedTableVirtuoso', 'GroupedTableVirtuosoProps', 'GroupedTableVirtuosoHandle'],
  GroupedVirtuoso: ['GroupedVirtuoso', 'GroupedVirtuosoProps', 'GroupedVirtuosoHandle'],
  Misc: [],
  TableVirtuoso: ['TableVirtuoso', 'TableVirtuosoProps', 'TableVirtuosoHandle', 'TableComponents'],
  Virtuoso: ['Virtuoso', 'VirtuosoProps', 'VirtuosoHandle', 'Components', 'ItemContent'],
  VirtuosoGrid: ['VirtuosoGrid', 'VirtuosoGridProps', 'VirtuosoGridHandle', 'GridComponents'],
}

// Get sort priority for an item within a group (lower = first)
const getItemSortPriority = (group: string, title: string): number => {
  const order = ITEM_SORT_ORDER[group] as string[] | undefined
  if (!order) {
    return Infinity
  }
  const index = order.indexOf(title)
  return index >= 0 ? index : Infinity
}

const toKebabCase = (str: string): string => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

// Recursively collect all markdown files from a directory
const collectMarkdownFiles = async (dir: string): Promise<{ name: string; path: string }[]> => {
  const files: { name: string; path: string }[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      const subFiles = await collectMarkdownFiles(fullPath)
      files.push(...subFiles)
    } else if (entry.isFile() && (entry.name.endsWith('.mdx') || entry.name.endsWith('.md'))) {
      files.push({ name: entry.name, path: fullPath })
    }
  }

  return files
}

// Remove empty directories recursively
const removeEmptyDirs = async (dir: string): Promise<void> => {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDir = join(dir, entry.name)
      await removeEmptyDirs(subDir)

      // Check if directory is now empty
      const remaining = await readdir(subDir)
      if (remaining.length === 0) {
        await rmdir(subDir)
      }
    }
  }
}

// Increase heading levels in markdown content (## becomes ###, ### becomes ####, etc.)
const increaseHeadingLevels = (content: string): string => {
  return content.replace(/^(#{2,5}) /gm, '#$1 ')
}

// Merge property headings with their type annotations
// Transforms:
//   #### propName?
//
//   `boolean`
// Into:
//   #### propName?: `boolean`
const mergeHeadingsWithTypes = (content: string): string => {
  // Split into lines and process
  const lines = content.split('\n')
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLine = lines[i + 1]
    const lineAfterNext = lines[i + 2]

    // Check if this is a property heading (#### propName?)
    // followed by empty line, then a type line (not blockquote/heading/rule)
    if (
      /^#{3,6} \S+\?$/.test(line) &&
      nextLine === '' &&
      lineAfterNext &&
      !lineAfterNext.startsWith('>') &&
      !lineAfterNext.startsWith('#') &&
      !lineAfterNext.startsWith('***') &&
      !lineAfterNext.startsWith('*The ') && // Skip italic notes like "*The property accepts pixel values*"
      (lineAfterNext.includes('`') || lineAfterNext.includes('['))
    ) {
      // Merge heading with type
      result.push(`${line}: ${lineAfterNext}`)
      result.push('') // Keep a blank line after
      i += 2 // Skip the empty line and type line
    } else {
      result.push(line)
    }
  }

  return result.join('\n')
}

// Convert a title to a markdown anchor (lowercase, spaces to hyphens, remove special chars)
const titleToAnchor = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

// Fix cross-links in merged content to point to the correct group file and anchor
const fixCrossLinks = (content: string, fileToGroupMap: Map<string, string>): string => {
  // Match markdown links like [Name](path/to/file.md) or [Name](file.mdx#anchor)
  return content.replace(/\[([^\]]+)\]\(([^)]+\.mdx?(?:#[^)]*)?)\)/g, (match, linkText: string, linkPath: string) => {
    // Extract the filename (without path and extension) and any anchor
    const pathParts = linkPath.split('/')
    const fileWithAnchor = pathParts[pathParts.length - 1]
    const [filename, existingAnchor] = fileWithAnchor.split('#')
    const baseFilename = filename.replace(/\.mdx?$/, '')

    // Look up the group for this file
    const group = fileToGroupMap.get(baseFilename)

    if (group) {
      // Use just the kebab-case group name without order prefix
      // Starlight strips numeric prefixes from URLs
      const groupFilename = toKebabCase(group)

      // Use existing anchor if present, otherwise create anchor from filename
      const anchor = existingAnchor || titleToAnchor(baseFilename)

      return `[${linkText}](../${groupFilename}/#${anchor})`
    }

    // If not found in our map, keep the original link
    return match
  })
}

// Merge all files by their group frontmatter into single pages per group
const mergeFilesByGroup = async (dir: string): Promise<void> => {
  const grouped = new Map<string, GroupedFile[]>()
  const fileToGroupMap = new Map<string, string>()
  const files = await collectMarkdownFiles(dir)

  // First pass: collect all files and build the file-to-group mapping
  for (const file of files) {
    const content = await readFile(file.path, 'utf-8')

    // Extract title from frontmatter
    const titleMatch = /^title:\s*['"]?(.+?)['"]?\s*$/m.exec(content)
    const title = titleMatch?.[1] ?? file.name.replace(/\.mdx?$/, '')

    // Skip module-level entries (package names like @scope/package or module names like react-virtuoso)
    if (title.startsWith('@') || title.includes('/') || title.includes('-')) {
      await unlink(file.path)
      continue
    }

    // Extract group from frontmatter (group: 'GroupName' or group: 'Multi Word'), default to 'Misc' if not found
    const groupMatch = /^group:\s*['"]([^'"]+)['"]\s*$/m.exec(content)
    const group = groupMatch ? groupMatch[1] : 'Misc'

    // Build mapping from filename (without extension) to group
    const baseFilename = file.name.replace(/\.mdx?$/, '')
    fileToGroupMap.set(baseFilename, group)

    // Remove frontmatter for merging
    const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n*/, '')

    if (!grouped.has(group)) {
      grouped.set(group, [])
    }

    grouped.get(group)?.push({
      content: contentWithoutFrontmatter,
      group,
      title,
    })

    // Delete original file
    await unlink(file.path)
  }

  // Write merged files at the root of the output directory
  for (const [group, groupFiles] of grouped) {
    const order = GROUP_ORDER.indexOf(group)
    const orderPrefix = order >= 0 ? `${order + 1}.` : ''
    const filename = `${orderPrefix}${toKebabCase(group)}.mdx`
    const sidebarOrder = order >= 0 ? order + 1 : 99

    // Sort files by custom priority first, then alphabetically for items without priority
    groupFiles.sort((a, b) => {
      const priorityA = getItemSortPriority(group, a.title)
      const priorityB = getItemSortPriority(group, b.title)
      if (priorityA !== priorityB) return priorityA - priorityB
      return a.title.localeCompare(b.title)
    })

    // Process each file: increase heading levels, merge types into headings, and fix cross-links
    const processedFiles = groupFiles.map((f) => {
      const adjustedContent = increaseHeadingLevels(f.content)
      const mergedContent = mergeHeadingsWithTypes(adjustedContent)
      const fixedContent = fixCrossLinks(mergedContent, fileToGroupMap)
      return `## ${f.title}\n\n${fixedContent}`
    })

    const mergedContent = `---
title: '${group}'
sidebar:
  order: ${sidebarOrder}
  label: '${group}'
---

${processedFiles.join('\n\n---\n\n')}
`
    await writeFile(join(dir, filename), mergedContent)
  }

  // Clean up empty directories
  await removeEmptyDirs(dir)
}

export const initAstroTypedoc = async ({
  baseUrl = '/docs/',
  entryPoints,
  excludeExternals = true,
  frontmatter = {},
  outputFolder = 'src/content/api',
  tsconfig,
}: {
  baseUrl?: string
  entryPoints: EntryPoint[]
  excludeExternals?: boolean
  frontmatter?: FrontmatterObject
  outputFolder?: string
  tsconfig: string
}): Promise<AstroIntegration> => {
  const app = await Application.bootstrapWithPlugins({
    ...typedocConfig,
    ...markdownPluginConfig,
    basePath: baseUrl,
    entryPoints: entryPoints.map((e) => e.path),
    excludeExternals,
    plugin: ['typedoc-plugin-markdown', 'typedoc-plugin-no-inherit', resolve(__dirname, 'theme.js')],
    readme: 'none',
    skipErrorChecking: true,
    theme: 'custom-markdown-theme',
    tsconfig,
  })

  app.options.addReader(new TSConfigReader())
  app.converter.on(Converter.EVENT_CREATE_DECLARATION, onDeclaration(entryPoints))

  // Track the current page end handler to prevent duplicates
  let currentPageEndHandler: ((event: PageEvent) => void) | null = null

  const getReflections = async (): Promise<ProjectReflection | undefined> => await app.convert()
  const generateDocs = async ({ frontmatter, outputFolder = 'src/pages/docs', project }: GenerateDocsOptions): Promise<void> => {
    // Remove the previous handler if it exists
    if (currentPageEndHandler) {
      app.renderer.off(PageEvent.END, currentPageEndHandler)
    }

    // Create and register the new frontmatter handler
    currentPageEndHandler = onRendererPageEnd(frontmatter)
    app.renderer.on(PageEvent.END, currentPageEndHandler)

    // Configure outputs dynamically to ensure markdown generation
    app.options.setValue('outputs', [
      {
        name: 'markdown',
        path: outputFolder,
      },
    ])

    await app.generateOutputs(project)

    // Remove redundant prefixes from generated files
    await removePrefixesFromFiles(outputFolder)

    // Merge files by @group tag into single pages per group
    await mergeFilesByGroup(outputFolder)

    // Remove README.md if it exists
    try {
      await unlink(join(outputFolder, 'README.md'))
    } catch {
      // Ignore if file doesn't exist
    }
  }

  const setupWatch = (frontmatter?: FrontmatterObject, outputFolder = 'src/pages/docs') => {
    const watchers: ReturnType<typeof watch>[] = []
    let regenerateTimeout: NodeJS.Timeout | null = null

    // Debounced regeneration function
    const regenerateDocs = () => {
      if (regenerateTimeout) {
        clearTimeout(regenerateTimeout)
      }

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      regenerateTimeout = setTimeout(async () => {
        console.log('[TypeDoc] Regenerating documentation...')
        try {
          const project = await getReflections()
          if (project) {
            await generateDocs({ frontmatter, outputFolder, project })
            console.log('[TypeDoc] Documentation regenerated successfully')
          }
        } catch (error) {
          console.error('[TypeDoc] Error regenerating documentation:', error)
        }
      }, 300) // 300ms debounce
    }

    // Watch all entry points and their directories
    entryPoints.forEach(({ path }) => {
      const dir = dirname(path)

      try {
        const watcher = watch(dir, { recursive: true }, (_eventType, filename) => {
          if (filename?.endsWith('.ts')) {
            console.log(`[TypeDoc] File changed: ${filename}`)
            regenerateDocs()
          }
        })

        watchers.push(watcher)
        console.log(`[TypeDoc] Watching ${dir} for changes...`)
      } catch (error) {
        console.error(`[TypeDoc] Error setting up watch for ${dir}:`, error)
      }
    })

    // Return cleanup function
    return () => {
      if (regenerateTimeout) {
        clearTimeout(regenerateTimeout)
      }
      for (const watcher of watchers) {
        watcher.close()
      }
      console.log('[TypeDoc] Stopped watching for changes')
    }
  }

  let cleanupWatch: (() => void) | null = null

  return {
    hooks: {
      'astro:config:done': async ({ logger }) => {
        logger.info('Generating TypeDoc documentation...')

        try {
          const project = await getReflections()

          if (!project) {
            logger.warn('No TypeDoc reflections found. Skipping documentation generation.')
            return
          }

          await generateDocs({ frontmatter, outputFolder, project })

          logger.info('TypeDoc documentation generated successfully')
        } catch (error) {
          logger.error('Failed to generate TypeDoc documentation:')
          console.error(error)
        }
      },
      'astro:server:done': ({ logger }) => {
        if (cleanupWatch) {
          logger.info('Cleaning up TypeDoc file watcher...')
          cleanupWatch()
          cleanupWatch = null
        }
      },
      'astro:server:setup': ({ logger }) => {
        logger.info('Setting up TypeDoc file watcher for development...')
        cleanupWatch = setupWatch(frontmatter, outputFolder)
      },
    },
    name: 'astro-typedoc',
  }
}

export default initAstroTypedoc
