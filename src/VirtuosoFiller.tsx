import React, { FC } from 'react'
import { CallbackRef } from 'Utils'

export const VirtuosoFiller: FC<{ fillerRef: CallbackRef; height: number }> = ({ fillerRef, height }) => (
  <div ref={fillerRef} style={{ height: `${height}px`, position: 'absolute', top: 0 }}>
    &nbsp;
  </div>
)
