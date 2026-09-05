import * as React from 'react'

import { TableVirtuoso, Virtuoso } from '../src'
import { stressStyles } from './prepend-stress-styles'

const START = 100000
const authors = ['Mira / support', 'Jon / engineering', 'Alex / customer', 'Sam / operations']
const paragraphs = [
  'The attachment finished uploading, but the preview still shows yesterday’s version. I retried on a narrow screen and the long filenames wrapped onto three lines.',
  'Please keep the original request open. There are two separate exports, several screenshots, and a reply from the customer further up this conversation.',
  'Reproduction: open the workspace, select the archived project, expand all details, then return to the conversation. The summary below contains the exact values we received.',
  'Update from the overnight run: most jobs completed, three are waiting for a retry, and one returned a different result. We need to compare the output before closing this thread.',
]

function Message({ id }: { id: number }) {
  const variant = id % 6
  return (
    <article className="prepend-message" data-stress-row={id} data-tone={id % 2}>
      <header>
        <strong>#{id}</strong>
        <span>{authors[id % authors.length]}</span>
        <span>09:{String(id % 60).padStart(2, '0')}</span>
      </header>
      <p>{paragraphs[id % paragraphs.length]}</p>
      {variant === 0 && (
        <blockquote>
          “This only happens after opening the older messages. Can you check the attached report?”<p>{paragraphs[1]}</p>
        </blockquote>
      )}
      {variant === 1 && (
        <pre>{`POST /api/workspaces/production/exports\nrequest_id: req_${id}_retry_03\nstatus: waiting_for_attachment\n\n{\n  "files": ["report-final-v7.csv", "trace.json"],\n  "attempt": 3,\n  "message": "Upstream response took too long"\n}`}</pre>
      )}
      {variant === 2 && (
        <div className="prepend-attachments">
          {['Latency trace', 'Mobile screenshot', 'Export preview'].map((title, index) => (
            <figure key={title}>
              <div style={{ height: 65 + index * 23 }} className="prepend-preview">
                {id % 100} / {index + 1}
              </div>
              <figcaption>
                {title}
                <br />
                customer-workspace-{id}-final.png
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {variant === 3 && (
        <table>
          <thead>
            <tr>
              <th>Job</th>
              <th>Result</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }, (_, index) => (
              <tr key={index}>
                <td>export-{id + index}</td>
                <td>{index % 2 ? 'Waiting for retry' : 'Complete'}</td>
                <td>{17 + index * 31} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {variant === 4 && (
        <>
          <p>{paragraphs[(id + 1) % paragraphs.length]}</p>
          <ul>
            <li>Compare the original attachment with the regenerated version.</li>
            <li>Keep the full request and response, including the retry headers.</li>
            <li>Check the customer’s follow-up before marking this resolved.</li>
          </ul>
        </>
      )}
      {variant === 5 && (
        <details>
          <summary>Expand diagnostic details (changes row height)</summary>
          <pre>{Array.from({ length: 12 }, (_, index) => `[${index}] worker-${id % 9}: received ${index * 137} bytes`).join('\n')}</pre>
          <p>{paragraphs[2]}</p>
        </details>
      )}
      <footer>
        Reply to #{id - 3} · {(id % 7) + 1} replies · {(id % 4) + 1} attachments
      </footer>
    </article>
  )
}

interface Result {
  anchor: string
  blank: number
  missing: number
  drift: number
  frames: number
}

function Stress({ table = false, pinned = false }: { table?: boolean; pinned?: boolean }) {
  const [range, setRange] = React.useState({ first: START, count: 20 })
  const [generation, setGeneration] = React.useState(0)
  const [width, setWidth] = React.useState(720)
  const [result, setResult] = React.useState<Result | null>(null)
  const [running, setRunning] = React.useState(false)
  const scroller = React.useRef<HTMLElement | null>(null)
  const frame = React.useRef(0)
  const burstFrame = React.useRef(0)
  const cancel = React.useCallback(() => {
    cancelAnimationFrame(frame.current)
    cancelAnimationFrame(burstFrame.current)
  }, [])
  React.useEffect(() => cancel, [cancel])

  const captureScroller = React.useCallback((element: HTMLElement | null | Window) => {
    scroller.current = element instanceof HTMLElement ? element : null
  }, [])

  function prepend(count: number) {
    setRange((current) => ({ first: current.first - count, count: current.count + count }))
  }

  function run(count: number, secondCount = 0) {
    const element = scroller.current
    if (!element) {
      return
    }
    cancel()
    const bounds = element.getBoundingClientRect()
    // Only inspect the scrolling list: a pinned row must not hide a blank viewport.
    const rows = () => Array.from(element.querySelectorAll<HTMLElement>('[data-testid="virtuoso-item-list"] [data-stress-row]'))
    const visible = rows().filter((row) => {
      const rect = row.getBoundingClientRect()
      return rect.bottom > bounds.top && rect.top < bounds.bottom
    })
    const anchor = visible.find((row) => row.getBoundingClientRect().top >= bounds.top + (pinned ? 80 : 0)) ?? visible[0]
    if (!anchor) {
      return
    }
    const id = anchor.dataset.stressRow!
    const initialTop = anchor.getBoundingClientRect().top - bounds.top
    const measurement: Result = { anchor: id, blank: 0, missing: 0, drift: 0, frames: 0 }
    const started = performance.now()
    setRunning(true)
    setResult(null)
    const sample = () => {
      const view = element.getBoundingClientRect()
      const currentRows = rows()
      measurement.frames++
      if (
        !currentRows.some((row) => {
          const rect = row.getBoundingClientRect()
          return rect.bottom > view.top && rect.top < view.bottom
        })
      ) {
        measurement.blank++
      }
      const currentAnchor = currentRows.find((row) => row.dataset.stressRow === id)
      if (currentAnchor) {
        measurement.drift = Math.max(measurement.drift, Math.abs(currentAnchor.getBoundingClientRect().top - view.top - initialTop))
      } else {
        measurement.missing++
      }
      if (performance.now() - started < 700) {
        frame.current = requestAnimationFrame(sample)
      } else {
        setResult(measurement)
        setRunning(false)
      }
    }
    // Register before the prepend so the sampler can observe its intermediate layout.
    frame.current = requestAnimationFrame(sample)
    prepend(count)
    if (secondCount) {
      burstFrame.current = requestAnimationFrame(() => prepend(secondCount))
    }
  }

  const props = {
    skipAnimationFrameInResizeObserver: true,
    firstItemIndex: range.first,
    totalCount: range.count,
    scrollerRef: captureScroller,
    style: { height: 520, background: '#ff00a8' },
  }

  return (
    <div className="prepend-stress">
      <style>{stressStyles}</style>
      <h2>Prepend stress / {table ? 'table' : pinned ? 'pinned row' : 'message feed'}</h2>
      <p>
        Start with 20 mixed-height messages. Watch the numbered rails and the yellow guide while adding a much larger page. Exposed magenta
        means missing content.
      </p>
      <div className="prepend-controls">
        <button disabled={running} onClick={() => run(100)}>
          Prepend 100
        </button>
        <button disabled={running} onClick={() => run(200)}>
          Prepend 200
        </button>
        <button disabled={running} onClick={() => run(100, 100)}>
          Burst 100 + 100
        </button>
        <button disabled={running} onClick={() => run(100, 37)}>
          Burst 100 + 37
        </button>
        <button disabled={running} onClick={() => scroller.current?.scrollTo({ top: 0 })}>
          Back to top
        </button>
        <button
          onClick={() => {
            cancel()
            setRunning(false)
            setResult(null)
            setRange({ first: START, count: 20 })
            setGeneration((value) => value + 1)
          }}
        >
          Reset to 20
        </button>
        <label>
          Width{' '}
          <input
            aria-label="Feed width"
            type="range"
            min={360}
            max={1000}
            value={width}
            disabled={running}
            onChange={(event) => setWidth(Number(event.target.value))}
          />{' '}
          {width}px
        </label>
      </div>
      <output aria-live="polite" className="prepend-result">
        {running
          ? 'Sampling for 700ms — do not scroll or resize…'
          : result
            ? `Anchor #${result.anchor} · max movement ${result.drift.toFixed(1)}px · blank samples ${result.blank} · missing anchor samples ${result.missing} · ${result.frames} frames sampled`
            : 'Ready. Reset before each large-prepend comparison.'}
      </output>
      <div className="prepend-stage" style={{ width, maxWidth: '100%' }}>
        {table ? (
          <TableVirtuoso
            {...props}
            key={generation}
            itemContent={(id) => (
              <td style={{ padding: 0 }}>
                <Message id={id} />
              </td>
            )}
          />
        ) : (
          <Virtuoso {...props} key={generation} topItemCount={pinned ? 1 : 0} itemContent={(id) => <Message id={id} />} />
        )}
        <div className="prepend-guide" aria-hidden="true" />
      </div>
      <p>
        {range.count} messages · No overscan, external images, or random content. Burst requests arrive in separate animation-frame updates.
        Expand details or narrow the feed to challenge measurement.
      </p>
      <p>
        Frame samples report geometry, not proof of a painted frame. Compare the same story on the base and PR branches; use a browser
        recording to inspect flashes.
      </p>
    </div>
  )
}

export function MessyMessages() {
  return <Stress />
}
export function MessyTable() {
  return <Stress table />
}
export function PinnedMessage() {
  return <Stress pinned />
}
