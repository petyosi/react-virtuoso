import { createPortal } from 'react-dom'
import { TableVirtuoso, Virtuoso } from '../src'
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

export function TableExample() {
  return (
    <div style={{ height: 500 }}>
      <IframePortal>
        <div style={{ paddingBottom: 100, paddingTop: 100 }}>
          <p>red background should match the size of the table</p>
          <div style={{ background: 'red' }}>
            <TableVirtuoso
              components={{
                EmptyPlaceholder: () => {
                  return (
                    <tbody>
                      <tr>
                        <td>Empty</td>
                      </tr>
                    </tbody>
                  )
                },
              }}
              fixedHeaderContent={() => {
                return (
                  <tr style={{ background: 'white' }}>
                    <th key={1} style={{ background: 'white', border: '1px solid black', height: 50 }}>
                      TH 1
                    </th>
                    <th key={2} style={{ background: 'white', border: '1px solid black', height: 50 }}>
                      TH meh
                    </th>
                  </tr>
                )
              }}
              itemContent={(index) => {
                return (
                  <>
                    <td style={{ height: 30 }}>{index}Cell 1</td>
                    <td>Cell 2</td>
                  </>
                )
              }}
              totalCount={100}
              useWindowScroll
            />
          </div>
        </div>
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
