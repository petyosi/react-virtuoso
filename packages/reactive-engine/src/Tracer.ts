import type { TracerConsole } from './types'

import { crossEnvLog } from './CC'

export class Tracer {
  private console?: TracerConsole
  private currentIndentLevel = 0

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
      crossEnvLog(this.console, indent, ...chunks)
    }
  }

  setConsole(console: TracerConsole | undefined) {
    this.console = console
  }

  span(...chunks: unknown[]) {
    this.log(...chunks)
    this.currentIndentLevel++
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const tracer = this
    return {
      dispose() {
        this[Symbol.dispose]()
      },
      [Symbol.dispose]: () => {
        tracer.currentIndentLevel--
      },
    }
  }
}
