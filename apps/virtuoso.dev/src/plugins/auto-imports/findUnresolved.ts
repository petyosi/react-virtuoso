import type { MdxJsxElement } from '@virtuoso.dev/m2dx-utils'
import type { Root } from 'mdast'

import { findAllImportSpecifiers, findAllJsxElements } from '@virtuoso.dev/m2dx-utils'

export function findUnresolved(root: Root): MdxJsxElement[] {
  const imports = findAllImportSpecifiers(root).map((i) => i.name)
  const elements = findAllJsxElements(root)
  return elements.filter((n) => !imports.includes(n.name ?? ''))
}
