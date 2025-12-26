export interface Export {
  file: string
  identifiers: string[]
  isDefault: boolean
  name: string
}

export type NameFilter = (name: string) => boolean
