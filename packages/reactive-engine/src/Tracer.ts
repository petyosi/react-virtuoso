import type { TracerConsole } from './types'

import { crossEnvLog } from './CC'

export class Tracer {
  private console?: TracerConsole
  private currentIndentLevel = 0
  private instanceLabel?: string

  constructor(console?: TracerConsole) {
    if (console) {
      this.console = console
    }
  }

  groupCollapsed(label?: string) {
    this.console?.groupCollapsed(label)
  }

  groupEnd() {
    this.console?.groupEnd()
  }

  log(...chunks: unknown[]) {
    if (this.console) {
      const indent = '-> '.repeat(this.currentIndentLevel)
      if (this.instanceLabel) {
        chunks.unshift(`${this.instanceLabel} `)
      }
      crossEnvLog(this.console, indent, ...chunks)
    }
  }

  setConsole(console: TracerConsole | undefined) {
    this.console = console
  }

  setInstanceLabel(label: string) {
    this.instanceLabel = label
  }

  span(...chunks: unknown[]) {
    this.log(...chunks)
    this.currentIndentLevel++

    return {
      dispose() {
        this[Symbol.dispose]()
      },
      [Symbol.dispose]: () => {
        this.currentIndentLevel--
      },
    }
  }
}
