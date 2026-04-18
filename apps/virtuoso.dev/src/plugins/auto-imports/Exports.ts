import { readFile } from 'node:fs/promises'

import { parseExports } from './parseExports'

import type { Export, NameFilter } from './types'

type Filename = string

export class Exports {
  readonly exports: Partial<Record<Filename, Export[]>> = {}
  private file: string
  private readonly nameFilter: NameFilter

  constructor(file: string, nameFilter: NameFilter) {
    this.file = file
    this.nameFilter = nameFilter
  }

  async find(name: null | string): Promise<Export | null> {
    if (name === null) {
      return null
    }

    let exports = this.exports[this.file]
    if (!exports) {
      const src = await readFile(this.file, 'utf8')
      exports = []
      for (const parsedExport of parseExports(src, this.nameFilter)) {
        exports.push({ ...parsedExport, file: this.file })
      }
      this.exports[this.file] = exports
    }

    const found = exports.find((e) => e.identifiers.includes(name))
    if (found) {
      return found
    }

    return null
  }
}
