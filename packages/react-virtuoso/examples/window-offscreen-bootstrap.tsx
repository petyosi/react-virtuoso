import { Virtuoso } from '../src'

const ITEM_COUNT = 100

export function Example() {
  return (
    <main style={{ margin: '0 auto', maxWidth: 720, padding: '0 24px 48px' }}>
      <section
        data-testid="content-above-list"
        style={{
          alignItems: 'center',
          background: '#e2e8f0',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh + 320px)',
          justifyContent: 'flex-start',
          padding: '32px 24px',
        }}
      >
        <h1 style={{ margin: 0 }}>Content above an off-screen window-scrolling list</h1>
        <p style={{ lineHeight: 1.5, maxWidth: 560 }}>
          On initial render, the list starts below the viewport. Its estimated height should already be included in the document scrollbar.
        </p>
      </section>

      <Virtuoso
        itemContent={(index) => (
          <div
            style={{
              background: index % 2 === 0 ? '#ffffff' : '#f8fafc',
              borderBottom: '1px solid #cbd5e1',
              boxSizing: 'border-box',
              height: 40 + (index % 3) * 20,
              padding: '10px 16px',
            }}
          >
            Row {index + 1}
          </div>
        )}
        style={{ border: '1px solid #94a3b8' }}
        totalCount={ITEM_COUNT}
        useWindowScroll
      />
    </main>
  )
}
