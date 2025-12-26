/* eslint-disable */
// @ts-nocheck - TypeDoc plugin integration with complex external types
import { MarkdownTheme, MarkdownThemeContext } from 'typedoc-plugin-markdown'
import { ReflectionKind } from 'typedoc'

export function load(app) {
  app.renderer.defineTheme('custom-markdown-theme', CustomMarkdownTheme)
}

class CustomMarkdownTheme extends MarkdownTheme {
  getRenderContext(page) {
    return new CustomMarkdownThemeContext(this, page, this.application.options)
  }
}

class CustomMarkdownThemeContext extends MarkdownThemeContext {
  constructor(theme, page, options) {
    super(theme, page, options)
    const originalDeclarationTitle = this.partials.declarationTitle.bind(this)

    this.partials = {
      ...this.partials,
      declarationTitle: (model) => {
        // For simple properties (not functions), show just the type inline
        if (model.kind === ReflectionKind.Property) {
          const typeStr = model.type?.toString()
          // Skip function-like properties - they need the full signature
          if (typeStr && !typeStr.includes('=>') && !typeStr.includes('(')) {
            const type = model.type ? this.partials.someType(model.type) : 'unknown'
            return `${type}\n\n`
          }
        }
        // For functions, methods, or complex properties, keep the original signature
        return originalDeclarationTitle(model)
      },
    }
  }
}
