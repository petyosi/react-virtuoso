import type { Identifier, Program, VariableDeclaration, VariableDeclarator } from 'estree'
import type { Root } from 'mdast'

import { EXIT, isMdxjsEsm, isObjectExpression, isVariableDeclarator, visit } from '@virtuoso.dev/m2dx-utils'
import { EXIT as esEXIT, visit as esVisit } from 'estree-util-visit'

export function findExportInProgram(program: Program): undefined | VariableDeclarator {
  let found: undefined | VariableDeclarator
  esVisit(program, (n, _, __, ancestors) => {
    if (isVariableDeclarator(n)) {
      const name = (n.id as Identifier).name
      const declaration = ancestors[ancestors.length - 1] as VariableDeclaration
      if (name === 'components' && declaration.kind === 'const' && isObjectExpression(n.init)) {
        found = n
        return esEXIT
      }
    }
    return undefined
  })
  return found
}

export function findExportInMdx(root: Root): undefined | VariableDeclarator {
  let found: undefined | VariableDeclarator
  visit(root, isMdxjsEsm, (node) => {
    if (node.data?.estree) {
      found = findExportInProgram(node.data.estree)
      if (found) {
        return EXIT
      }
    }
    return undefined
  })
  return found
}
