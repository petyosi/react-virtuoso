/* eslint-disable */
// @ts-nocheck - TypeDoc plugin integration with complex external types
import { slug } from 'github-slugger'
import path from 'node:path'
import { MarkdownTheme, MarkdownThemeRenderContext } from 'typedoc-plugin-markdown'

const externalLinkRegex = /^\w+:/

export function load(app) {
  app.renderer.defineTheme('custom-markdown-theme', CustomMarkdownTheme)
}

export class CustomMarkdownTheme extends MarkdownTheme {
  getRenderContext(pageEvent) {
    return new CustomMarkdownThemeContext(pageEvent, this.application.options)
  }
}

class CustomMarkdownThemeContext extends MarkdownThemeRenderContext {
  relativeURL = (url) => {
    if (!url) {
      return null
    } else if (externalLinkRegex.test(url)) {
      return url
    }

    const basePath = this.options.getValue('basePath')
    const basePathParsed = path.parse(basePath)
    const baseUrl = basePath.replace(basePathParsed.root, '/')
    const filePathParsed = path.parse(url)
    const directory = filePathParsed.dir.split(path.sep).join('/')
    const [, anchor] = filePathParsed.base.split('#')

    let constructedUrl = typeof baseUrl === 'string' ? baseUrl : ''
    constructedUrl += '/'
    constructedUrl += directory.length > 0 ? `${directory}/` : ''
    constructedUrl += filePathParsed.name
    constructedUrl += anchor && anchor.length > 0 ? `#${slug(anchor)}` : ''

    return constructedUrl
  }
}
