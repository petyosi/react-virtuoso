import type { Code, Parent, Root, RootContent } from 'mdast'
import type { MdxJsxAttribute, MdxJsxFlowElement } from 'mdast-util-mdx-jsx'

interface FileEntry {
  code: string
  lang: string
}

const fileMetaRegex = /file=(\S+)/

function parseLiveFileMeta(
  node: Code
): { fileName: string; isLive: true; isWide: boolean } | { isLive: false } | { isLive: true; isWide: boolean; fileName?: undefined } {
  const meta = node.meta
  if (meta === undefined || meta === null || !meta.includes('live')) {
    return { isLive: false }
  }
  const isWide = meta.includes('wide')
  const fileMatch = fileMetaRegex.exec(meta)
  if (fileMatch) {
    return { fileName: fileMatch[1]!, isLive: true, isWide }
  }
  return { isLive: true, isWide }
}

function makeSingleFileLiveNode(node: Code, isWide: boolean): MdxJsxFlowElement {
  const attrs: MdxJsxAttribute[] = [
    { name: 'code', type: 'mdxJsxAttribute', value: node.value },
    { name: 'lang', type: 'mdxJsxAttribute', value: node.lang ?? 'tsx' },
  ]
  if (isWide) {
    attrs.push({ name: 'wide', type: 'mdxJsxAttribute', value: 'true' })
  }
  attrs.push({ name: 'client:idle', type: 'mdxJsxAttribute', value: null })

  return {
    attributes: attrs,
    children: [],
    name: 'LiveCodeBlock',
    type: 'mdxJsxFlowElement',
  }
}

function makeStaticCodeNode(node: Code): MdxJsxFlowElement {
  const attrs: MdxJsxAttribute[] = [
    { name: 'code', type: 'mdxJsxAttribute', value: node.value },
    { name: 'lang', type: 'mdxJsxAttribute', value: node.lang ?? 'text' },
  ]
  if (node.meta !== undefined && node.meta !== null) {
    attrs.push({ name: 'meta', type: 'mdxJsxAttribute', value: node.meta })
  }
  attrs.push({ name: 'client:load', type: 'mdxJsxAttribute', value: null })

  return {
    attributes: attrs,
    children: [],
    name: 'StaticCodeBlock',
    type: 'mdxJsxFlowElement',
  }
}

function makeMultiFileLiveNode(group: { code: Code; fileName: string }[], isWide: boolean): MdxJsxFlowElement {
  const files: Record<string, FileEntry> = {}
  for (const { code, fileName } of group) {
    files[fileName] = { code: code.value, lang: code.lang ?? 'tsx' }
  }

  const attrs: MdxJsxAttribute[] = [
    { name: 'files', type: 'mdxJsxAttribute', value: JSON.stringify(files) },
    { name: 'activeFile', type: 'mdxJsxAttribute', value: group[0]!.fileName },
  ]
  if (isWide) {
    attrs.push({ name: 'wide', type: 'mdxJsxAttribute', value: 'true' })
  }
  attrs.push({ name: 'client:idle', type: 'mdxJsxAttribute', value: null })

  return {
    attributes: attrs,
    children: [],
    name: 'LiveCodeBlock',
    type: 'mdxJsxFlowElement',
  }
}

function processChildren(children: RootContent[]): RootContent[] {
  const result: RootContent[] = []
  let i = 0

  while (i < children.length) {
    const node = children[i]!

    if (node.type !== 'code') {
      result.push(node)
      i++
      continue
    }

    const parsed = parseLiveFileMeta(node)

    if (!parsed.isLive) {
      result.push(makeStaticCodeNode(node) as RootContent)
      i++
      continue
    }

    if (parsed.fileName === undefined) {
      result.push(makeSingleFileLiveNode(node, parsed.isWide) as RootContent)
      i++
      continue
    }

    // Collect consecutive live file=X blocks
    const group: { code: Code; fileName: string }[] = [{ code: node, fileName: parsed.fileName }]
    let j = i + 1
    while (j < children.length) {
      const next = children[j]!
      if (next.type !== 'code') {
        break
      }
      const nextParsed = parseLiveFileMeta(next)
      if (!nextParsed.isLive || nextParsed.fileName === undefined) {
        break
      }
      group.push({ code: next, fileName: nextParsed.fileName })
      j++
    }

    if (group.length === 1) {
      result.push(makeSingleFileLiveNode(node, parsed.isWide) as RootContent)
    } else {
      result.push(makeMultiFileLiveNode(group, parsed.isWide) as RootContent)
    }
    i = j
  }

  return result
}

/**
 * Remark plugin that transforms ALL code blocks:
 * - Consecutive code blocks with `live file=X` meta → single multi-file LiveCodeBlock
 * - Single code block with `live` meta → single-file LiveCodeBlock
 * - All other code blocks → StaticCodeBlock (static)
 */
export function remarkCustomCodeBlocks() {
  return (tree: Root) => {
    function walkParent(parent: Parent) {
      parent.children = processChildren(parent.children)
      for (const child of parent.children) {
        if ('children' in child && Array.isArray(child.children)) {
          walkParent(child as Parent)
        }
      }
    }
    walkParent(tree)
  }
}
