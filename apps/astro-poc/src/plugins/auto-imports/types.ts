export interface Export {
  file: string;
  name: string;
  isDefault: boolean;
  identifiers: string[];
}

export type NameFilter = (name: string) => boolean;
