import type { Root } from "mdast";

import type { VFile } from "./VFile";

export type RemarkPlugin = (tree: Root, file: VFile) => void | Promise<void>;
