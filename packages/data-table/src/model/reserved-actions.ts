export const RESERVED_ACTION_NAMES = new Set<string>(['handshake', 'disconnect', 'viewportChange'])

export function warnModelActionInDev(message: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[VirtuosoDataTable] ${message}`)
  }
}

export function warnReservedModelActionInDev(action: string, context: string) {
  warnModelActionInDev(`Model action "${action}" is reserved for ${context} and was ignored.`)
}
