import * as u from './urx'

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace globalThis {
  let VIRTUOSO_LOG_LEVEL: LogLevel | undefined
}

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace window {
  let VIRTUOSO_LOG_LEVEL: LogLevel | undefined
}

/**
 * Log levels for controlling virtuoso diagnostic output.
 * Use with the `logLevel` prop to enable debugging information.
 *
 * @example
 * ```tsx
 * import { Virtuoso, LogLevel } from 'react-virtuoso'
 *
 * <Virtuoso
 *   totalCount={1000}
 *   logLevel={LogLevel.DEBUG}
 *   itemContent={(index) => <div>Item {index}</div>}
 * />
 * ```
 *
 * @group Common
 */
export enum LogLevel {
  /** Detailed debugging information including item measurements */
  DEBUG,
  /** General informational messages */
  INFO,
  /** Warning messages for potential issues */
  WARN,
  /** Error messages for failures (default level) */
  ERROR,
}
export type Log = (label: string, message: any, level?: LogLevel) => void

export interface LogMessage {
  label: string
  level: LogLevel
  message: any
}

const CONSOLE_METHOD_MAP = {
  [LogLevel.DEBUG]: 'debug',
  [LogLevel.ERROR]: 'error',
  [LogLevel.INFO]: 'log',
  [LogLevel.WARN]: 'warn',
} as const

const getGlobalThis = () => (typeof globalThis === 'undefined' ? window : globalThis)

export const loggerSystem = u.system(
  () => {
    const logLevel = u.statefulStream<LogLevel>(LogLevel.ERROR)
    const log = u.statefulStream<Log>((label: string, message: any, level: LogLevel = LogLevel.INFO) => {
      const currentLevel = getGlobalThis().VIRTUOSO_LOG_LEVEL ?? u.getValue(logLevel)
      if (level >= currentLevel) {
        // eslint-disable-next-line no-console
        console[CONSOLE_METHOD_MAP[level]](
          '%creact-virtuoso: %c%s %o',
          'color: #0253b3; font-weight: bold',
          'color: initial',
          label,
          message
        )
      }
    })

    return {
      log,
      logLevel,
    }
  },
  [],
  { singleton: true }
)
