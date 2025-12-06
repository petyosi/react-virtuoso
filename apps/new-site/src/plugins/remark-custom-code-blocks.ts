import type { Code, Root } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import { visit } from "unist-util-visit";

/**
 * Remark plugin that transforms ALL code blocks:
 * - Code blocks with `live` meta → LiveCodeBlock (interactive)
 * - All other code blocks → StaticCodeBlock (static)
 */
export function remarkCustomCodeBlocks() {
  return (tree: Root) => {
    visit(tree, "code", (node: Code, index, parent) => {
      if (parent && typeof index === "number") {
        const isLive = node.meta?.includes("live");

        const jsxNode: MdxJsxFlowElement = {
          type: "mdxJsxFlowElement",
          name: isLive ? "LiveCodeBlock" : "StaticCodeBlock",
          attributes: isLive
            ? [
                { type: "mdxJsxAttribute", name: "code", value: node.value },
                {
                  type: "mdxJsxAttribute",
                  name: "lang",
                  value: node.lang || "tsx",
                },
                { type: "mdxJsxAttribute", name: "client:idle", value: null },
              ]
            : [
                { type: "mdxJsxAttribute", name: "code", value: node.value },
                {
                  type: "mdxJsxAttribute",
                  name: "lang",
                  value: node.lang || "text",
                },
                ...(node.meta
                  ? [
                      {
                        type: "mdxJsxAttribute" as const,
                        name: "meta",
                        value: node.meta,
                      },
                    ]
                  : []),
                { type: "mdxJsxAttribute", name: "client:load", value: null },
              ],
          children: [],
        };

        parent.children[index] = jsxNode as any;
      }
    });
  };
}
