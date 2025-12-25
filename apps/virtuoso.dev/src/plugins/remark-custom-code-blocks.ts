import type { Code, Root, RootContent } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'

import { visit } from 'unist-util-visit'

/**
 * Remark plugin that transforms ALL code blocks:
 * - Code blocks with `live` meta → LiveCodeBlock (interactive)
 * - All other code blocks → StaticCodeBlock (static)
 */
export function remarkCustomCodeBlocks() {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code, index, parent) => {
      if (parent && typeof index === 'number') {
        const isLive = node.meta?.includes('live')

        const jsxNode: MdxJsxFlowElement = {
          attributes: isLive
            ? [
                { name: 'code', type: 'mdxJsxAttribute', value: node.value },
                {
                  name: 'lang',
                  type: 'mdxJsxAttribute',
                  value: node.lang ?? 'tsx',
                },
                { name: 'client:idle', type: 'mdxJsxAttribute', value: null },
              ]
            : [
                { name: 'code', type: 'mdxJsxAttribute', value: node.value },
                {
                  name: 'lang',
                  type: 'mdxJsxAttribute',
                  value: node.lang ?? 'text',
                },
                ...(node.meta
                  ? [
                      {
                        name: 'meta',
                        type: 'mdxJsxAttribute' as const,
                        value: node.meta,
                      },
                    ]
                  : []),
                { name: 'client:load', type: 'mdxJsxAttribute', value: null },
              ],
          children: [],
          name: isLive ? 'LiveCodeBlock' : 'StaticCodeBlock',
          type: 'mdxJsxFlowElement',
        }

        parent.children[index] = jsxNode as RootContent
      }
    })
  }
}
