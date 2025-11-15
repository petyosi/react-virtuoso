import type { Identifier, Program, VariableDeclaration, VariableDeclarator } from 'estree'
import { EXIT as esEXIT, visit as esVisit } from 'estree-util-visit'
import { EXIT, isMdxjsEsm, isObjectExpression, isVariableDeclarator, visit } from 'm2dx-utils'

export function findExportInProgram(program: Program): VariableDeclarator | undefined {
  let found: VariableDeclarator | undefined
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

export function findExportInMdx(root: unknown): VariableDeclarator | undefined {
  let found: VariableDeclarator | undefined
  visit(root as any, isMdxjsEsm, (node) => {
    if (node.data?.estree) {
      found = findExportInProgram(node.data?.estree)
      if (found) {
        return EXIT
      }
    }
    return undefined
  })
  return found
}
