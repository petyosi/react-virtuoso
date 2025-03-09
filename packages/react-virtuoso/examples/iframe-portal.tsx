import { createPortal } from 'react-dom'
import { Virtuoso } from '../src'
import * as React from 'react'

export function Example() {
  return (
    <div style={{ height: 500 }}>
      <IframePortal>
        <Virtuoso
          useWindowScroll
          computeItemKey={(key: number) => `item-${key.toString()}`}
          initialItemCount={30}
          itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
          style={{ height: 300 }}
          totalCount={100}
        />
      </IframePortal>
    </div>
  )
}

const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')

const IframePortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [iFrameEl, setIframeEl] = React.useState<HTMLIFrameElement | null>(null)

  return (
    <iframe
      ref={(el) => {
        if (!isFirefox) {
          setIframeEl(el)
        }
      }}
      onLoad={(e) => {
        if (isFirefox) {
          setIframeEl(e.target as HTMLIFrameElement)
        }
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {iFrameEl ? createPortal(children, iFrameEl.contentDocument!.body) : 'moo'}
    </iframe>
  )
}
