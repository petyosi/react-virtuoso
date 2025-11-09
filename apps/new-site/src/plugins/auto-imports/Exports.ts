import { readFile } from 'node:fs/promises'

import type { Export, NameFilter } from './types'

import { parseExports } from './parseExports'

type Filename = string

export class Exports {
  readonly exports: Partial<Record<Filename, Export[]>> = {}

  constructor(
    private file: string,
    private nameFilter: NameFilter
  ) {}

  async find(name: null | string): Promise<Export | null> {
    if (!name) return null

    let exports = this.exports[this.file]
    if (!exports) {
      const src = await readFile(this.file, 'utf8')
      exports = parseExports(src, this.nameFilter).map((p) => {
        return { ...p, file: this.file }
      })
      this.exports[this.file] = exports
    }

    const found = exports.find((e) => e.identifiers.includes(name))
    if (found) {
      return found
    }

    return null
  }
}
