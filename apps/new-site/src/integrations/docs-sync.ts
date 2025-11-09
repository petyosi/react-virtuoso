/* eslint-disable @typescript-eslint/no-misused-promises */
import type { AstroIntegration } from 'astro'

import { type FSWatcher, watch } from 'node:fs'
import { mkdir, readdir, readFile, rm, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface DocsSyncSource {
  /** Target subdirectory under src/content/docs/ */
  dest: string
  /** Single file to sync */
  file?: string
  /** Source directory path (relative to project root or absolute) */
  path?: string
  /** Transform function for file content (optional) */
  transform?: (content: string, filePath: string) => string
}

interface DocsSyncOptions {
  /** Subdirectories to exclude from cleanup (relative to dest) */
  excludeFromCleanup?: string[]
  sources: DocsSyncSource[]
}

const MD_PATTERN = /\.(md|mdx)$/
const NUMERIC_PREFIX_PATTERN = /^(\d+)\./

// Extract numeric prefix from filename (e.g., "6.troubleshooting.md" → 6)
function getNumericPrefix(filename: string): null | number {
  const match = NUMERIC_PREFIX_PATTERN.exec(filename)
  return match ? parseInt(match[1], 10) : null
}

// Inject sidebar.order and prefixed label into frontmatter based on filename prefix
function injectSidebarOrder(content: string, filename: string): string {
  const order = getNumericPrefix(filename)
  if (order === null) return content

  // Check if file has frontmatter
  if (content.startsWith('---')) {
    const endOfFrontmatter = content.indexOf('---', 3)
    if (endOfFrontmatter !== -1) {
      let frontmatter = content.slice(0, endOfFrontmatter)
      const rest = content.slice(endOfFrontmatter)

      // Extract current label or title for prefixing
      const labelMatch = /label:\s*['"]?([^'"\n]+)['"]?/.exec(frontmatter)
      const titleMatch = /title:\s*['"]?([^'"\n]+)['"]?/.exec(frontmatter)
      const currentLabel = labelMatch?.[1] ?? titleMatch?.[1] ?? filename.replace(/^\d+\./, '').replace(/\.(md|mdx)$/, '')

      // Remove any existing numeric prefix from the label
      const cleanLabel = currentLabel.replace(/^\d+\./, '')
      const prefixedLabel = `${order}.${cleanLabel}`

      // Check if sidebar section exists
      if (frontmatter.includes('sidebar:')) {
        // Replace or add order
        if (/order:\s*\d+/.test(frontmatter)) {
          frontmatter = frontmatter.replace(/order:\s*\d+/, `order: ${order}`)
        } else {
          frontmatter = frontmatter.replace(/sidebar:/, `sidebar:\n  order: ${order}`)
        }
        // Replace or add label
        if (/label:\s*['"]?[^'"\n]+['"]?/.test(frontmatter)) {
          frontmatter = frontmatter.replace(/label:\s*['"]?[^'"\n]+['"]?/, `label: "${prefixedLabel}"`)
        } else {
          frontmatter = frontmatter.replace(/sidebar:/, `sidebar:\n  label: "${prefixedLabel}"`)
        }
        return frontmatter + rest
      }

      // Add sidebar block before end of frontmatter
      return frontmatter + `sidebar:\n  order: ${order}\n  label: "${prefixedLabel}"\n` + rest
    }
  } else {
    // No frontmatter, add it
    const cleanName = filename.replace(/^\d+\./, '').replace(/\.(md|mdx)$/, '')
    return `---\nsidebar:\n  order: ${order}\n  label: "${order}.${cleanName}"\n---\n\n${content}`
  }

  return content
}

async function* walkDirectory(dir: string): AsyncGenerator<string> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          yield* walkDirectory(fullPath)
        }
      } else if (entry.isFile() && MD_PATTERN.test(entry.name)) {
        yield fullPath
      }
    }
  } catch (_error) {
    // Directory doesn't exist or can't be read
  }
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await mkdir(dir, { recursive: true })
  } catch (_error) {
    // Directory already exists
  }
}

async function syncFile(
  sourcePath: string,
  destPath: string,
  transform?: (content: string, filePath: string) => string
): Promise<null | string> {
  try {
    let content = await readFile(sourcePath, 'utf-8')

    if (transform) {
      content = transform(content, sourcePath)
    }

    // Inject sidebar.order based on filename prefix
    const filename = basename(destPath)
    content = injectSidebarOrder(content, filename)

    // Convert .md files to .mdx for JSX support
    const finalDestPath = destPath.replace(/\.md$/, '.mdx')

    await ensureDir(dirname(finalDestPath))
    await writeFile(finalDestPath, content, 'utf-8')
    return finalDestPath
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.error(`Failed to sync ${sourcePath}: ${error}`)
    return null
  }
}

async function cleanDestDir(destDir: string, excludes: string[] = []): Promise<void> {
  try {
    if (excludes.length === 0) {
      await rm(destDir, { force: true, recursive: true })
      return
    }

    // If there are excludes, we need to selectively remove contents
    const entries = await readdir(destDir, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = join(destDir, entry.name)
      if (!excludes.includes(entry.name)) {
        await rm(entryPath, { force: true, recursive: true })
      }
    }
  } catch {
    // Directory doesn't exist or can't be removed
  }
}

async function syncSource(
  source: DocsSyncSource,
  projectRoot: string,
  docsDir: string,
  cleanedDests: Set<string>,
  excludeFromCleanup: string[] = []
): Promise<string[]> {
  const syncedFiles: string[] = []
  const destDir = join(docsDir, source.dest)

  // Clean destination directory before syncing (only once per dest)
  if (!cleanedDests.has(destDir)) {
    await cleanDestDir(destDir, excludeFromCleanup)
    cleanedDests.add(destDir)
  }

  if (source.file) {
    // Single file sync
    const sourcePath = source.file.startsWith('/') ? source.file : join(projectRoot, source.file)

    try {
      await stat(sourcePath)
    } catch {
      console.warn(`Source file does not exist: ${sourcePath}`)
      return syncedFiles
    }

    const fileName = basename(sourcePath)
    // For single files, use index.mdx if dest is a directory name
    const destFileName = fileName.toLowerCase() === 'readme.md' ? 'index.mdx' : fileName
    const destPath = join(destDir, destFileName)

    const result = await syncFile(sourcePath, destPath, source.transform)
    if (result) syncedFiles.push(result)
  } else if (source.path) {
    // Directory sync
    const sourcePath = source.path.startsWith('/') ? source.path : join(projectRoot, source.path)

    try {
      await stat(sourcePath)
    } catch {
      console.warn(`Source path does not exist: ${sourcePath}`)
      return syncedFiles
    }

    for await (const filePath of walkDirectory(sourcePath)) {
      const relativePath = relative(sourcePath, filePath)
      const destPath = join(destDir, relativePath)

      const result = await syncFile(filePath, destPath, source.transform)
      if (result) syncedFiles.push(result)
    }
  }

  return syncedFiles
}

export function docsSync(options: DocsSyncOptions): AstroIntegration {
  const watchers: FSWatcher[] = []
  let projectRoot: string
  let docsDir: string

  return {
    hooks: {
      'astro:config:setup': async ({ config, logger }) => {
        projectRoot = fileURLToPath(config.root)
        docsDir = join(projectRoot, 'src/content/docs')

        // Perform initial sync
        let totalFiles = 0
        const cleanedDests = new Set<string>()
        for (const source of options.sources) {
          const synced = await syncSource(source, projectRoot, docsDir, cleanedDests, options.excludeFromCleanup)
          totalFiles += synced.length
        }

        logger.info(`Synced ${totalFiles} files`)
      },

      'astro:server:done': () => {
        // Clean up watchers
        for (const watcher of watchers) {
          watcher.close()
        }
        watchers.length = 0
      },

      'astro:server:setup': ({ logger }) => {
        let watchCount = 0

        for (const source of options.sources) {
          if (source.file) {
            // Watch single file
            const sourcePath = source.file.startsWith('/') ? source.file : join(projectRoot, source.file)
            const sourceDir = dirname(sourcePath)
            const fileName = basename(sourcePath)

            try {
              const watcher = watch(sourceDir, async (eventType, changedFile) => {
                if (changedFile !== fileName) return

                const destDir = join(docsDir, source.dest)
                const destFileName = fileName.toLowerCase() === 'readme.md' ? 'index.mdx' : fileName
                const destPath = join(destDir, destFileName)

                if (eventType === 'rename') {
                  try {
                    await stat(sourcePath)
                    await syncFile(sourcePath, destPath, source.transform)
                  } catch {
                    // File was deleted
                    try {
                      await unlink(destPath)
                    } catch {
                      /* empty */
                    }
                  }
                } else {
                  await syncFile(sourcePath, destPath, source.transform)
                }
              })

              watchers.push(watcher)
              watchCount++
            } catch (error) {
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              logger.warn(`Could not watch ${sourcePath}: ${error}`)
            }
          } else if (source.path) {
            // Watch directory
            const sourcePath = source.path.startsWith('/') ? source.path : join(projectRoot, source.path)

            try {
              const watcher = watch(sourcePath, { recursive: true }, async (eventType, filename) => {
                if (!filename || !MD_PATTERN.test(filename)) return

                const fullSourcePath = join(sourcePath, filename)
                const destDir = join(docsDir, source.dest)
                const destPath = join(destDir, filename)

                if (eventType === 'rename') {
                  try {
                    await stat(fullSourcePath)
                    await syncFile(fullSourcePath, destPath, source.transform)
                  } catch {
                    // File was deleted
                    try {
                      await unlink(destPath)
                    } catch {
                      /* empty */
                    }
                  }
                } else {
                  await syncFile(fullSourcePath, destPath, source.transform)
                }
              })

              watchers.push(watcher)
              watchCount++
            } catch (error) {
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              logger.warn(`Could not watch ${sourcePath}: ${error}`)
            }
          }
        }

        logger.info(`Watching ${watchCount} sources for changes`)
      },
    },
    name: 'docs-sync',
  }
}

export default docsSync
