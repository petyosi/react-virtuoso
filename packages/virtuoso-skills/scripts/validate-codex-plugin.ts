import { access, readFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const expectedSkillNames = ['react-virtuoso', 'message-list', 'data-table', 'reactive-engine'] as const
const allowedTopLevelManifestFields = new Set<string>([
  'name',
  'version',
  'description',
  'author',
  'homepage',
  'repository',
  'license',
  'keywords',
  'skills',
  'apps',
  'mcpServers',
  'interface',
])
const allowedInstallationPolicies = new Set<string>(['NOT_AVAILABLE', 'AVAILABLE', 'INSTALLED_BY_DEFAULT'])
const allowedAuthenticationPolicies = new Set<string>(['ON_INSTALL', 'ON_USE'])
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

const scriptDir = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(scriptDir, '..')
const repoRoot = resolve(packageRoot, '..', '..')
const marketplacePath = resolve(repoRoot, '.agents/plugins/marketplace.json')
const pluginRoot = resolve(repoRoot, 'plugins/virtuoso-skills')
const manifestPath = resolve(pluginRoot, '.codex-plugin/plugin.json')
const errors: string[] = []

function addError(message: string) {
  errors.push(message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

async function readJsonObject(path: string): Promise<Record<string, unknown>> {
  const content = await readFile(path, 'utf8')
  const parsed = JSON.parse(content) as unknown

  if (!isRecord(parsed)) {
    throw new Error(`${path} must contain a JSON object`)
  }

  if (content.includes('[TODO:')) {
    addError(`${path} contains a [TODO: placeholder`)
  }

  return parsed
}

function getRecord(parent: Record<string, unknown>, key: string, label: string): Record<string, unknown> | undefined {
  const value = parent[key]

  if (!isRecord(value)) {
    addError(`${label}.${key} must be an object`)
    return undefined
  }

  return value
}

function getString(parent: Record<string, unknown>, key: string, label: string): string | undefined {
  const value = parent[key]

  if (typeof value !== 'string' || value.length === 0) {
    addError(`${label}.${key} must be a non-empty string`)
    return undefined
  }

  return value
}

function getStringArray(parent: Record<string, unknown>, key: string, label: string): string[] | undefined {
  const value = parent[key]

  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || entry.length === 0)) {
    addError(`${label}.${key} must be an array of non-empty strings`)
    return undefined
  }

  return value as string[]
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function validateRelativePluginPath(value: unknown, label: string) {
  if (typeof value !== 'string' || value.length === 0) {
    addError(`${label} must be a non-empty string path`)
    return
  }

  if (!value.startsWith('./')) {
    addError(`${label} must start with ./`)
    return
  }

  const resolvedPath = resolve(pluginRoot, value)
  const relativePath = relative(pluginRoot, resolvedPath)

  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    addError(`${label} must stay inside plugins/virtuoso-skills`)
    return
  }

  if (!(await pathExists(resolvedPath))) {
    addError(`${label} points to missing path ${value}`)
  }
}

async function validateManifest(manifest: Record<string, unknown>) {
  for (const key of Object.keys(manifest)) {
    if (!allowedTopLevelManifestFields.has(key)) {
      addError(`plugin.json contains unsupported top-level field "${key}"`)
    }
  }

  if (manifest.hooks !== undefined) {
    addError('plugin.json must not include hooks')
  }

  if (getString(manifest, 'name', 'plugin') !== 'virtuoso-skills') {
    addError('plugin.name must be virtuoso-skills')
  }

  const version = getString(manifest, 'version', 'plugin')
  if (version && !semverPattern.test(version)) {
    addError('plugin.version must be strict semver')
  }

  getString(manifest, 'description', 'plugin')

  const author = getRecord(manifest, 'author', 'plugin')
  if (author) {
    getString(author, 'name', 'plugin.author')
  }

  if (getString(manifest, 'skills', 'plugin') !== './skills/') {
    addError('plugin.skills must be ./skills/')
  }

  const interfaceMetadata = getRecord(manifest, 'interface', 'plugin')
  if (interfaceMetadata) {
    getString(interfaceMetadata, 'displayName', 'plugin.interface')
    getString(interfaceMetadata, 'shortDescription', 'plugin.interface')
    getString(interfaceMetadata, 'longDescription', 'plugin.interface')
    getString(interfaceMetadata, 'developerName', 'plugin.interface')
    getString(interfaceMetadata, 'category', 'plugin.interface')

    const capabilities = getStringArray(interfaceMetadata, 'capabilities', 'plugin.interface')
    if (capabilities && capabilities.length === 0) {
      addError('plugin.interface.capabilities must contain at least one entry')
    }

    const defaultPrompt = getStringArray(interfaceMetadata, 'defaultPrompt', 'plugin.interface')
    if (defaultPrompt) {
      if (defaultPrompt.length === 0 || defaultPrompt.length > 3) {
        addError('plugin.interface.defaultPrompt must contain 1-3 entries')
      }

      for (const prompt of defaultPrompt) {
        if (prompt.length > 128) {
          addError('plugin.interface.defaultPrompt entries must be at most 128 characters')
        }
      }
    }

    for (const pathField of ['composerIcon', 'logo'] as const) {
      if (interfaceMetadata[pathField] !== undefined) {
        await validateRelativePluginPath(interfaceMetadata[pathField], `plugin.interface.${pathField}`)
      }
    }

    if (interfaceMetadata.screenshots !== undefined) {
      const screenshots = getStringArray(interfaceMetadata, 'screenshots', 'plugin.interface')
      if (screenshots) {
        for (const screenshot of screenshots) {
          await validateRelativePluginPath(screenshot, 'plugin.interface.screenshots[]')
        }
      }
    }
  }

  for (const pathField of ['apps', 'mcpServers'] as const) {
    if (manifest[pathField] !== undefined) {
      await validateRelativePluginPath(manifest[pathField], `plugin.${pathField}`)
    }
  }

  for (const skillName of expectedSkillNames) {
    const skillPath = resolve(pluginRoot, 'skills', skillName, 'SKILL.md')
    if (!(await pathExists(skillPath))) {
      addError(`Missing generated skill ${relative(repoRoot, skillPath)}`)
    }
  }
}

function validateMarketplace(marketplace: Record<string, unknown>) {
  if (getString(marketplace, 'name', 'marketplace') !== 'virtuoso') {
    addError('marketplace.name must be virtuoso')
  }

  const plugins = marketplace.plugins
  if (!Array.isArray(plugins)) {
    addError('marketplace.plugins must be an array')
    return
  }

  const entry = plugins.find((plugin): plugin is Record<string, unknown> => isRecord(plugin) && plugin.name === 'virtuoso-skills')

  if (!entry) {
    addError('marketplace.plugins must include virtuoso-skills')
    return
  }

  const source = getRecord(entry, 'source', 'marketplace.plugins[virtuoso-skills]')
  if (source) {
    if (getString(source, 'source', 'marketplace.plugins[virtuoso-skills].source') !== 'local') {
      addError('marketplace plugin source.source must be local')
    }

    if (getString(source, 'path', 'marketplace.plugins[virtuoso-skills].source') !== './plugins/virtuoso-skills') {
      addError('marketplace plugin source.path must be ./plugins/virtuoso-skills')
    }
  }

  const policy = getRecord(entry, 'policy', 'marketplace.plugins[virtuoso-skills]')
  if (policy) {
    const installation = getString(policy, 'installation', 'marketplace.plugins[virtuoso-skills].policy')
    if (installation && !allowedInstallationPolicies.has(installation)) {
      addError('marketplace plugin policy.installation is invalid')
    }

    const authentication = getString(policy, 'authentication', 'marketplace.plugins[virtuoso-skills].policy')
    if (authentication && !allowedAuthenticationPolicies.has(authentication)) {
      addError('marketplace plugin policy.authentication is invalid')
    }
  }

  getString(entry, 'category', 'marketplace.plugins[virtuoso-skills]')
}

async function main() {
  const [manifest, marketplace] = await Promise.all([readJsonObject(manifestPath), readJsonObject(marketplacePath)])

  await validateManifest(manifest)
  validateMarketplace(marketplace)

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`- ${error}`)
    }

    process.exitCode = 1
    return
  }

  console.log('Codex plugin manifest and marketplace validation passed')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
