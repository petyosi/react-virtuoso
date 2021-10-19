import * as u from '@virtuoso.dev/urx'

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace globalThis {
  let VIRTUOSO_LOG_LEVEL: LogLevel | undefined
}

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}
export interface LogMessage {
  level: LogLevel
  message: any
  label: string
}

export type Log = (label: string, message: any, level?: LogLevel) => void

const CONSOLE_METHOD_MAP = {
  [LogLevel.DEBUG]: 'debug',
  [LogLevel.INFO]: 'log',
  [LogLevel.WARN]: 'warn',
  [LogLevel.ERROR]: 'error',
} as const

export const loggerSystem = u.system(
  () => {
    const logLevel = u.statefulStream<LogLevel>(LogLevel.ERROR)
    const log = u.statefulStream<Log>((label: string, message: any, level: LogLevel = LogLevel.INFO) => {
      const currentLevel = (globalThis || window)['VIRTUOSO_LOG_LEVEL'] ?? u.getValue(logLevel)
      if (level >= currentLevel) {
        console[CONSOLE_METHOD_MAP[level]]('%creact-virtuoso: %c%s %o', 'color: #0253b3; font-weight: bold', 'color: black', label, message)
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
