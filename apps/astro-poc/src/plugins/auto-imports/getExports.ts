import { readFile } from "node:fs/promises";

import { parseExports } from "./parseExports";
import type { Export } from "./types";

const CAPITAL_LETTER = /[A-Z]/;

export function isJsxName(name: string): boolean {
  return !!name && name.length > 0 && CAPITAL_LETTER.test(name.charAt(0));
}

export async function getExports(file: string): Promise<Export[]> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const src = await readFile(file, "utf8");
  return parseExports(src, isJsxName).map((p) => {
    return { ...p, file };
  });
}
