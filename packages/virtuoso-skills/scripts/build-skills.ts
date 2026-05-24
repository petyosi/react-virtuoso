import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

interface SkillSource {
  name: 'react-virtuoso' | 'message-list' | 'data-table'
  docsDir: string
  readme: string
}

const skillSources: SkillSource[] = [
  {
    name: 'react-virtuoso',
    docsDir: 'packages/react-virtuoso/docs',
    readme: 'packages/react-virtuoso/README.md',
  },
  {
    name: 'message-list',
    docsDir: 'packages/message-list/docs',
    readme: 'packages/message-list/README.md',
  },
  {
    name: 'data-table',
    docsDir: 'packages/data-table/docs',
    readme: 'packages/data-table/README.md',
  },
]

const scriptDir = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(scriptDir, '..')
const repoRoot = resolve(packageRoot, '..', '..')
const packageSkillsRoot = resolve(packageRoot, 'skills')
const rootSkillsMirror = resolve(repoRoot, 'skills')
const codexSkillsMirror = resolve(repoRoot, 'plugins/virtuoso-skills/skills')

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const entries = (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
  const files: string[] = []

  for (const entry of entries) {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(entryPath)))
      continue
    }

    if (entry.isFile() && extname(entry.name) === '.md') {
      files.push(entryPath)
    }
  }

  return files.sort((a, b) => a.localeCompare(b))
}

async function copyTextFile(source: string, destination: string) {
  const content = await readFile(source, 'utf8')
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, content.replace(/\r\n/g, '\n'), 'utf8')
}

async function copyTree(source: string, destination: string) {
  await mkdir(destination, { recursive: true })

  const entries = (await readdir(source, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))

  for (const entry of entries) {
    const sourcePath = join(source, entry.name)
    const destinationPath = join(destination, entry.name)

    if (entry.isDirectory()) {
      await copyTree(sourcePath, destinationPath)
      continue
    }

    if (entry.isFile() && extname(entry.name) === '.md') {
      await copyTextFile(sourcePath, destinationPath)
      continue
    }

    if (entry.isFile()) {
      await mkdir(dirname(destinationPath), { recursive: true })
      await cp(sourcePath, destinationPath)
    }
  }
}

async function regenerateReferences(source: SkillSource) {
  const sourceDocsDir = resolve(repoRoot, source.docsDir)
  const sourceReadmePath = resolve(repoRoot, source.readme)
  const referencesDir = resolve(packageSkillsRoot, source.name, 'references')

  await rm(referencesDir, { force: true, recursive: true })
  await mkdir(referencesDir, { recursive: true })

  const markdownFiles = await listMarkdownFiles(sourceDocsDir)

  for (const markdownFile of markdownFiles) {
    const relativePath = relative(sourceDocsDir, markdownFile)
    await copyTextFile(markdownFile, resolve(referencesDir, relativePath))
  }

  await copyTextFile(sourceReadmePath, resolve(referencesDir, 'README.md'))
  console.log(`Generated ${source.name} references from ${markdownFiles.length + 1} markdown files`)
}

async function mirrorSkills(destination: string) {
  await rm(destination, { force: true, recursive: true })
  await copyTree(packageSkillsRoot, destination)
}

async function main() {
  for (const source of skillSources) {
    await regenerateReferences(source)
  }

  await mirrorSkills(rootSkillsMirror)
  await mirrorSkills(codexSkillsMirror)

  console.log('Generated root skills/ mirror')
  console.log('Generated plugins/virtuoso-skills/skills/ mirror')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
