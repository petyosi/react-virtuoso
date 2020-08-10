import * as React from 'react'
import { FC } from 'react'

export const VirtuosoFiller: FC<{ height: number }> = ({ height }) => (
  <div style={{ height: `${height}px`, position: 'absolute', top: 0 }}>&nbsp;</div>
)
