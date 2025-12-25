export function toLinux(file: string): string {
  return file.replaceAll('\\', '/')
}

import type { Export } from './types'

export function toImport(exp: Export, alias: string): string {
  const { file, isDefault, name } = exp

  return isDefault ? `import ${alias} from '${toLinux(file)}';` : `import {${name} as ${alias}} from '${toLinux(file)}'`
}
