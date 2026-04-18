import { readFile } from 'node:fs/promises'

import { parseExports } from './parseExports'

import type { Export } from './types'

const CAPITAL_LETTER = /[A-Z]/

export function isJsxName(name: string): boolean {
  return name.length > 0 && CAPITAL_LETTER.test(name.charAt(0))
}

export async function getExports(file: string): Promise<Export[]> {
  const src = await readFile(file, 'utf8')
  const exports: Export[] = []
  for (const parsedExport of parseExports(src, isJsxName)) {
    exports.push({ ...parsedExport, file })
  }
  return exports
}
