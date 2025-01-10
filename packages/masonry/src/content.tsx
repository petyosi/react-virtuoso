import { Cell } from '@virtuoso.dev/gurx'
import type { ItemContent } from './interfaces'

export const DefaultItemContent: ItemContent = ({ index }) => {
  return <div>Item {index}</div>
}

export const itemContent$ = Cell(DefaultItemContent)
