/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { describe, expect, it, vi } from 'vitest'

import { RefCount } from '../../RefCount'

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined'

const ansi = {
  boldOff: '\x1b[22m',
  boldOn: '\x1b[1m',
  colors: {
    bgYellow: ['\x1b[43m', '\x1b[49m'],
    blue: ['\x1b[34m', '\x1b[39m'],
    cyan: ['\x1b[36m', '\x1b[39m'],
    gray: ['\x1b[90m', '\x1b[39m'],
    green: ['\x1b[32m', '\x1b[39m'],
    magenta: ['\x1b[35m', '\x1b[39m'],
    red: ['\x1b[31m', '\x1b[39m'],
    yellow: ['\x1b[33m', '\x1b[39m'],
  },
  reset: '\x1b[0m',
}

type PrimitiveValue = boolean | Date | null | number | string | undefined
type Primitive = PrimitiveValue | PrimitiveValue[] | Record<string, PrimitiveValue | PrimitiveValue[]>

// style helpers return a "chunk" understood by log()
const CC = {
  bgWarn: (s: Primitive) =>
    isBrowser
      ? [`%c${s}`, 'background:gold;color:black;padding:0 2px;border-radius:2px']
      : [`${ansi.colors.bgYellow[0]}${s}${ansi.colors.bgYellow[1]}`],
  blue: (s: Primitive) => (isBrowser ? [`%c${s}`, 'color:royalblue'] : [`${ansi.colors.blue[0]}${s}${ansi.colors.blue[1]}`]),
  bold: (s: Primitive) => (isBrowser ? [`%c${s}`, 'font-weight:bold'] : [`${ansi.boldOn}${s}${ansi.boldOff}`]),
  cyan: (s: Primitive) => (isBrowser ? [`%c${s}`, 'color:teal'] : [`${ansi.colors.cyan[0]}${s}${ansi.colors.cyan[1]}`]),
  gray: (s: Primitive) => (isBrowser ? [`%c${s}`, 'color:gray'] : [`${ansi.colors.gray[0]}${s}${ansi.colors.gray[1]}`]),
  green: (s: Primitive) => (isBrowser ? [`%c${s}`, 'color:green'] : [`${ansi.colors.green[0]}${s}${ansi.colors.green[1]}`]),
  magenta: (s: Primitive) => (isBrowser ? [`%c${s}`, 'color:magenta'] : [`${ansi.colors.magenta[0]}${s}${ansi.colors.magenta[1]}`]),
  plain: (s: Primitive) => [String(s)], // no styling
  red: (s: Primitive) => (isBrowser ? [`%c${s}`, 'color:red'] : [`${ansi.colors.red[0]}${s}${ansi.colors.red[1]}`]),
  yellow: (s: Primitive) => (isBrowser ? [`%c${s}`, 'color:goldenrod'] : [`${ansi.colors.yellow[0]}${s}${ansi.colors.yellow[1]}`]),
}

function crossEnvLog(theConsole: Pick<Console, 'log'>, ...chunks: Primitive[]) {
  // Allow raw strings too
  const normalized = chunks.map((ch) => (Array.isArray(ch) ? ch : CC.plain(ch)))

  if (isBrowser) {
    const fmt = normalized.map((x) => x[0]).join('')
    const cssArgs = normalized.flatMap((x) => x.slice(1))
    theConsole.log(fmt, ...cssArgs)
  } else {
    // Strip colors if stdout isn't a TTY

    const supportsColor = true
    const text = normalized.map((x) => x[0]).join('')
    // eslint-disable-next-line no-control-regex
    theConsole.log(supportsColor ? text : text.replace(/\x1b\[[0-9;]*m/g, ''))
  }
}

class Tracer {
  private console?: Pick<Console, 'log'>
  private currentIndentLevel = 0

  constructor(console?: Pick<Console, 'log'>) {
    if (console) {
      this.console = console
    }
  }

  log(...chunks: Primitive[]) {
    if (this.console) {
      const indent = '-> '.repeat(this.currentIndentLevel)
      crossEnvLog(this.console, indent, ...chunks)
    }
  }

  span(...chunks: Primitive[]) {
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

describe('tracer', () => {
  it('logs a message', () => {
    const tracer = new Tracer(console)
    tracer.log('Hello, world! ', CC.blue('This is a test'), ' ', CC.bold('Bold text'), ' ', CC.red('Error!'))
  })

  it('indents with a span', () => {
    const tracer = new Tracer(console)
    {
      using _t = tracer.span('Starting a span', CC.green('This is inside the span'))
      {
        using _t = tracer.span('Starting a second-level span')
        tracer.log('Inside the span', CC.magenta('moo'))
      }
    }
    tracer.log('Back to the first level', CC.yellow('Still inside the first span'))
  })
})
