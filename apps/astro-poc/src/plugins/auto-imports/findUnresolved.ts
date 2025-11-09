import type { MdxJsxElement } from "m2dx-utils";
import { findAllImportSpecifiers, findAllJsxElements } from "m2dx-utils";
import type { Root } from "mdast";

export function findUnresolved(root: Root): MdxJsxElement[] {
  const imports = findAllImportSpecifiers(root).map((i) => i.name);
  const elements = findAllJsxElements(root);
  return elements.filter((n) => !imports.includes(n.name ?? ""));
}
