import type { Code, Root } from "mdast";
import type { MdxJsxAttribute } from "mdast-util-mdx";
import { visit } from "unist-util-visit";

// import { h } from 'hastscript';

interface LiveCodeNode extends Omit<Code, "type" | "value"> {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: MdxJsxAttribute[];
}

export function remarkLiveCode() {
  return (tree: Root) => {
    visit(tree, "code", (node: Code) => {
      if (node.meta?.includes("live")) {
        const liveNode = node as unknown as LiveCodeNode;
        liveNode.type = "mdxJsxFlowElement";
        liveNode.name = "LiveCodeBlock";
        liveNode.attributes = [
          { type: "mdxJsxAttribute", name: "value", value: node.value },
          {
            type: "mdxJsxAttribute",
            name: "client:idle",
            value: null,
          },
        ];
        delete (liveNode as unknown as Record<string, unknown>).value;
      }
    });
  };
}
