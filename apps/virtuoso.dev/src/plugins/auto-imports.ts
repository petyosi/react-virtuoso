import type { Root, RootContent } from 'mdast'
import type { MdxjsEsm } from 'mdast-util-mdx'

import { createProgram } from '@virtuoso.dev/m2dx-utils'
import { visit } from 'unist-util-visit'

interface ComponentImport {
  /** Whether this is a default import (default: true) */
  default?: boolean
  /** Import path for this component */
  from: string
}

interface AutoImportsOptions {
  /** Map of component name to import configuration */
  imports: Record<string, ComponentImport>
}

function findExistingImports(tree: Root): Set<string> {
  const imported = new Set<string>()

  visit(tree, 'mdxjsEsm', (node: MdxjsEsm) => {
    const value = node.value || ''
    // Match: import X from, import { X } from, import { X as Y } from
    const importMatch = /import\s+(?:{([^}]+)}|(\w+))\s+from/.exec(value)
    if (importMatch) {
      const namedImports = importMatch[1]
      const defaultImport = importMatch[2]

      if (defaultImport) {
        imported.add(defaultImport)
      }

      if (namedImports) {
        const names = namedImports.split(',').map((s) => {
          const parts = s.trim().split(/\s+as\s+/)
          return parts[parts.length - 1].trim()
        })
        names.forEach((n) => imported.add(n))
      }
    }
  })

  return imported
}

function findUsedComponents(tree: Root): Set<string> {
  const used = new Set<string>()

  visit(tree, (node) => {
    if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name && /^[A-Z]/.test(node.name)) {
      used.add(node.name)
    }
  })

  return used
}

export function autoImports(options: AutoImportsOptions) {
  const { imports } = options

  return function transformer(tree: Root): void {
    const existingImports = findExistingImports(tree)
    const usedComponents = findUsedComponents(tree)

    // Find components that are used but not imported
    const needed: { config: ComponentImport; name: string }[] = []
    for (const component of usedComponents) {
      const importConfig = imports[component]
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- importConfig can be undefined at runtime
      if (!existingImports.has(component) && importConfig) {
        needed.push({ config: importConfig, name: component })
      }
    }

    if (needed.length === 0) {
      return
    }

    // Group by import source for cleaner imports
    const bySource = new Map<string, { isDefault: boolean; name: string }[]>()
    for (const { config, name } of needed) {
      const source = config.from
      const sourceComponents = bySource.get(source)
      if (sourceComponents) {
        sourceComponents.push({ isDefault: config.default !== false, name })
      } else {
        bySource.set(source, [{ isDefault: config.default !== false, name }])
      }
    }

    // Generate import statements
    for (const [source, components] of bySource) {
      const defaultImports = components.filter((c) => c.isDefault)
      const namedImports = components.filter((c) => !c.isDefault)

      let importStatement: string
      if (defaultImports.length > 0 && namedImports.length > 0) {
        // import Default, { Named } from 'source'
        importStatement = `import ${defaultImports[0].name}, { ${namedImports.map((c) => c.name).join(', ')} } from '${source}'`
      } else if (defaultImports.length > 0) {
        // import Default from 'source'
        importStatement = `import ${defaultImports[0].name} from '${source}'`
      } else {
        // import { Named } from 'source'
        importStatement = `import { ${namedImports.map((c) => c.name).join(', ')} } from '${source}'`
      }

      const importNode = createProgram(importStatement)
      tree.children.unshift(importNode as unknown as RootContent)
    }
  }
}

export default autoImports
