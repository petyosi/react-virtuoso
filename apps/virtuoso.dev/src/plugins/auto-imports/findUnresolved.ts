import { findAllImportSpecifiers, findAllJsxElements } from '@virtuoso.dev/m2dx-utils'

import type { MdxJsxElement } from '@virtuoso.dev/m2dx-utils'
import type { Root } from 'mdast'

export function findUnresolved(root: Root): MdxJsxElement[] {
  const imports = new Set(findAllImportSpecifiers(root).map((i) => i.name))
  const elements = findAllJsxElements(root)
  return elements.filter((n) => !imports.has(n.name ?? ''))
}
