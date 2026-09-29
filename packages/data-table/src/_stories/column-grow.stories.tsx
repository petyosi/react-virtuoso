import { useCallback, useState } from 'react'
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'

import { PROMPT_TABLE_WIDTHS, PromptListGrowTable } from './column-grow.fixture'

import type { ColumnHeaderContainerProps } from '..'

const STORY_SHELL_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  maxWidth: '100%',
  padding: 16,
}
const STORY_TITLE_STYLE: CSSProperties = { margin: 0, fontSize: 16, fontWeight: 600 }
const STORY_DESCRIPTION_STYLE: CSSProperties = { margin: 0, maxWidth: 720, color: '#64748b', fontSize: 13 }
const STORY_BUTTON_STYLE: CSSProperties = {
  alignSelf: 'flex-start',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  padding: '6px 10px',
}
const INTERACTIVE_HEADER_CSS = `
  [data-interactive-column-header] {
    cursor: pointer;
    transition: background-color 120ms ease;
  }
  [data-interactive-column-header]:hover {
    background: #eff6ff;
  }
  [data-interactive-column-header][data-active="true"] {
    background: #dbeafe;
    box-shadow: inset 0 -2px #2563eb;
  }
  [data-interactive-column-header]:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: -2px;
  }
`

function StoryFrame({ title, description, width, children }: { title: string; description: string; width: number; children: ReactNode }) {
  return (
    <section style={{ ...STORY_SHELL_STYLE, width }}>
      <div>
        <h2 style={STORY_TITLE_STYLE}>{title}</h2>
        <p style={STORY_DESCRIPTION_STYLE}>{description}</p>
      </div>
      {children}
    </section>
  )
}

export function WidePromptListGrowColumns() {
  return (
    <StoryFrame
      description="Two text-heavy columns absorb spare width while the sortable icon boundary shows where header controls end."
      title="Prompt List Grow Columns"
      width={PROMPT_TABLE_WIDTHS.wide}
    >
      <PromptListGrowTable showSortIconBoundaries />
    </StoryFrame>
  )
}

export function NarrowPromptListGrowColumns() {
  return (
    <StoryFrame
      description="The same prompt list in a narrow viewport keeps base widths and relies on horizontal scrolling."
      title="Prompt List Narrow Viewport"
      width={PROMPT_TABLE_WIDTHS.narrow}
    >
      <PromptListGrowTable />
    </StoryFrame>
  )
}

export function ResizablePromptListGrowColumns() {
  return (
    <StoryFrame
      description="Drag a divider or double-click it to verify that resized grow columns use the override as their new base."
      title="Prompt List Grow Columns With Resize"
      width={PROMPT_TABLE_WIDTHS.wide}
    >
      <PromptListGrowTable resizable />
    </StoryFrame>
  )
}

export function FullWidthInteractiveHeaderSurface() {
  const [activeColumn, setActiveColumn] = useState('description')
  const [width, setWidth] = useState<number>(PROMPT_TABLE_WIDTHS.wide)
  const headerContainerProps = useCallback(
    (columnKey: string): ColumnHeaderContainerProps => {
      const activate = () => setActiveColumn(columnKey)

      return {
        'aria-pressed': activeColumn === columnKey,
        'data-active': activeColumn === columnKey,
        'data-interactive-column-header': '',
        onClick: activate,
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            activate()
          }
        },
        role: 'button',
        tabIndex: 0,
        title: `Activate ${columnKey} column`,
      }
    },
    [activeColumn]
  )

  return (
    <StoryFrame
      description="Hover or activate any point in a header. The full rendered column is interactive, while its inner content still provides the base width. Toggle the table width to verify that grow columns return their spare width."
      title="Full-width header surface with intrinsic measurement"
      width={PROMPT_TABLE_WIDTHS.wide}
    >
      <style>{INTERACTIVE_HEADER_CSS}</style>
      <button
        style={STORY_BUTTON_STYLE}
        type="button"
        onClick={() =>
          setWidth((current) => (current === PROMPT_TABLE_WIDTHS.wide ? PROMPT_TABLE_WIDTHS.narrow : PROMPT_TABLE_WIDTHS.wide))
        }
      >
        Use {width === PROMPT_TABLE_WIDTHS.wide ? 'narrow' : 'wide'} table
      </button>
      <p aria-live="polite" style={STORY_DESCRIPTION_STYLE}>
        Active column: <strong>{activeColumn}</strong>
      </p>
      <PromptListGrowTable headerContainerProps={headerContainerProps} width={width} />
    </StoryFrame>
  )
}
