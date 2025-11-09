import type { Code, Root } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import { visit } from "unist-util-visit";

/**
 * Remark plugin that transforms code blocks with `live` meta into
 * MDX JSX elements that can be hydrated via Astro's React integration.
 */
export function remarkLiveCode() {
  return (tree: Root) => {
    visit(tree, "code", (node: Code, index, parent) => {
      if (node.meta?.includes("live") && parent && typeof index === "number") {
        // Create a proper MDX JSX flow element
        const jsxNode: MdxJsxFlowElement = {
          type: "mdxJsxFlowElement",
          name: "LiveCodeBlock",
          attributes: [
            { type: "mdxJsxAttribute", name: "code", value: node.value },
            {
              type: "mdxJsxAttribute",
              name: "lang",
              value: node.lang || "tsx",
            },
            { type: "mdxJsxAttribute", name: "client:idle", value: null },
          ],
          children: [],
        };

        // Replace the code node with the JSX node
        parent.children[index] = jsxNode as any;
      }
    });
  };
}
