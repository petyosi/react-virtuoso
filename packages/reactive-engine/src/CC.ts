/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
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

/**
 * A console color utility for cross-environment logging.
 */
export const CC = {
  bgWarn: (s: unknown) =>
    isBrowser
      ? [`%c${s}`, 'background:gold;color:black;padding:0 2px;border-radius:2px']
      : [`${ansi.colors.bgYellow[0]}${s}${ansi.colors.bgYellow[1]}`],
  blue: (s: unknown) => (isBrowser ? [`%c${s}`, 'color:royalblue'] : [`${ansi.colors.blue[0]}${s}${ansi.colors.blue[1]}`]),
  bold: (s: unknown) => (isBrowser ? [`%c${s}`, 'font-weight:bold'] : [`${ansi.boldOn}${s}${ansi.boldOff}`]),
  cyan: (s: unknown) => (isBrowser ? [`%c${s}`, 'color:teal'] : [`${ansi.colors.cyan[0]}${s}${ansi.colors.cyan[1]}`]),
  gray: (s: unknown) => (isBrowser ? [`%c${s}`, 'color:gray'] : [`${ansi.colors.gray[0]}${s}${ansi.colors.gray[1]}`]),
  green: (s: unknown) => (isBrowser ? [`%c${s}`, 'color:green'] : [`${ansi.colors.green[0]}${s}${ansi.colors.green[1]}`]),
  magenta: (s: unknown) => (isBrowser ? [`%c${s}`, 'color:magenta'] : [`${ansi.colors.magenta[0]}${s}${ansi.colors.magenta[1]}`]),
  plain: (s: unknown) => [s], // no styling
  red: (s: unknown) => (isBrowser ? [`%c${s}`, 'color:red'] : [`${ansi.colors.red[0]}${s}${ansi.colors.red[1]}`]),
  yellow: (s: unknown) => (isBrowser ? [`%c${s}`, 'color:goldenrod'] : [`${ansi.colors.yellow[0]}${s}${ansi.colors.yellow[1]}`]),
}

export function crossEnvLog(theConsole: Pick<Console, 'log'>, ...chunks: unknown[]) {
  // Allow raw strings too
  const normalized = chunks.map((ch) => (Array.isArray(ch) ? ch : CC.plain(ch)))

  if (isBrowser) {
    const fmt = normalized.map((x) => x[0]).join('')
    const cssArgs = normalized.flatMap((x) => x.slice(1))
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    theConsole.log(fmt, ...cssArgs)
  } else {
    // Strip colors if stdout isn't a TTY

    const supportsColor = true
    const text = normalized.map((x) => x[0]).join('')
    // eslint-disable-next-line no-control-regex, @typescript-eslint/no-unnecessary-condition
    theConsole.log(supportsColor ? text : text.replace(/\x1b\[[0-9;]*m/g, ''))
  }
}
