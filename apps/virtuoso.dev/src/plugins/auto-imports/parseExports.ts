import type { Expression, Identifier, PrivateIdentifier, Program, VariableDeclaration } from 'estree'

import {
  isExportDefaultDeclaration,
  isIdentifier,
  isObjectExpression,
  isProperty,
  isVariableDeclarator,
  parseEsm,
} from '@virtuoso.dev/m2dx-utils'
import { EXIT, visit } from 'estree-util-visit'

import type { Export, NameFilter } from './types'

function getName(key: Expression | PrivateIdentifier): string {
  if (isIdentifier(key)) {
    return key.name
  }
  if ('value' in key && typeof key.value === 'string') {
    return key.value
  }
  return `Unknown type for key: ${key.type}`
}

function findDefaultExport(root: Program): string | undefined {
  let name: string | undefined
  visit(root, (node) => {
    if (isExportDefaultDeclaration(node)) {
      name = (node.declaration as { name: string }).name
      return EXIT
    }
    return undefined
  })
  return name
}

function findDeclarators(root: Program, predicate: NameFilter, defaultExport?: string): Omit<Export, 'as' | 'file'>[] {
  const result: Omit<Export, 'file'>[] = []

  visit(root, (n, _, __, ancestors) => {
    if (isVariableDeclarator(n)) {
      const declaration = ancestors[ancestors.length - 1] as VariableDeclaration
      const init = n.init
      if (declaration.kind === 'const' && isObjectExpression(init)) {
        const name = (n.id as Identifier).name
        const isDefault = name === defaultExport
        if (isDefault || ancestors[ancestors.length - 2]?.type === 'ExportNamedDeclaration') {
          const identifiers = init.properties
            .filter(isProperty)
            .map((p) => p.key)
            .map((k) => getName(k))
            .filter(predicate)
          if (identifiers.length > 0) {
            result.push({
              identifiers,
              isDefault,
              name,
            })
          }
        }
      }
    }
  })
  return result
}

export function parseExports(src: string, predicate: NameFilter): Omit<Export, 'file'>[] {
  const root = parseEsm(src)
  const defaultExport = findDefaultExport(root)
  return findDeclarators(root, predicate, defaultExport)
}
