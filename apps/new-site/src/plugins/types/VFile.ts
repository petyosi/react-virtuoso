import type { VFile as UnistVFile } from 'vfile'

export interface DataMap {
  astro: {
    frontmatter: Record<string, unknown>
  }
}
export type VFile = UnistVFile & {
  data: DataMap & Record<string, unknown>
  value: string
}
