import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(scriptDir, '..')
const repoRoot = resolve(packageRoot, '..', '..')
const execFileAsync = promisify(execFile)

async function readJson(path: string): Promise<Record<string, unknown>> {
  const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${path} must contain a JSON object`)
  }

  return parsed as Record<string, unknown>
}

async function writeJson(path: string, value: Record<string, unknown>) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function main() {
  const packageJsonPath = resolve(packageRoot, 'package.json')
  const packageJson = await readJson(packageJsonPath)
  const version = packageJson.version

  if (typeof version !== 'string' || version.length === 0) {
    throw new Error(`${packageJsonPath} must contain a version string`)
  }

  const manifestPaths = [
    resolve(packageRoot, '.claude-plugin/plugin.json'),
    resolve(repoRoot, 'plugins/virtuoso-skills/.codex-plugin/plugin.json'),
  ]

  for (const manifestPath of manifestPaths) {
    const manifest = await readJson(manifestPath)
    manifest.version = version
    await writeJson(manifestPath, manifest)
  }

  await execFileAsync('pnpm', ['exec', 'oxfmt', '--write', ...manifestPaths], { cwd: repoRoot })
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
