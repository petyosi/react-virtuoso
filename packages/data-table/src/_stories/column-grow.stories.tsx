import type { CSSProperties, ReactNode } from 'react'

import { PROMPT_TABLE_WIDTHS, PromptListGrowTable } from './column-grow.fixture'

const STORY_SHELL_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  maxWidth: '100%',
  padding: 16,
}
const STORY_TITLE_STYLE: CSSProperties = { margin: 0, fontSize: 16, fontWeight: 600 }
const STORY_DESCRIPTION_STYLE: CSSProperties = { margin: 0, maxWidth: 720, color: '#64748b', fontSize: 13 }

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
