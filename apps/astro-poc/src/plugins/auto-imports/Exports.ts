import { readFile } from "node:fs/promises";

import { parseExports } from "./parseExports";
import type { Export, NameFilter } from "./types";

type Filename = string;

export class Exports {
  readonly exports: Record<Filename, Export[]> = {};

  constructor(
    private file: string,
    private nameFilter: NameFilter,
  ) {}

  async find(name: string | null): Promise<Export | null> {
    if (!name) return null;

    let exports = this.exports[this.file];
    if (!exports) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const src = await readFile(this.file, "utf8");
      exports = parseExports(src, this.nameFilter).map((p) => {
        return { ...p, file: this.file };
      });
      this.exports[this.file] = exports;
    }

    const found = exports.find((e) => e.identifiers.includes(name));
    if (found) {
      return found;
    }

    return null;
  }
}
