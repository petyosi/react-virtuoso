import React from 'react'
import { VirtuosoGrid } from '../src'

export function Example() {
  return <VirtuosoGrid id="root" initialTopMostItemIndex={10} totalCount={20000} initialItemCount={30} />
}
