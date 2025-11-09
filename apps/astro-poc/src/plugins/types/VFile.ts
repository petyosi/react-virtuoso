import type { VFile as UnistVFile } from "vfile";

export interface DataMap {
  astro: {
    frontmatter: Record<string, unknown>;
  };
}
export type VFile = UnistVFile & {
  data: Record<string, unknown> & DataMap;
  value: string;
};
