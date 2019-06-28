import { useLayoutEffect, useRef, FC, CSSProperties } from 'react'

export const VirtuosoStyle: FC<{
  stickyClassName: string
}> = ({ stickyClassName }) => {
  const style = useRef<HTMLStyleElement | null>(null)
  useLayoutEffect(() => {
    let styleEl = document.createElement('style')
    document.head.appendChild(styleEl)
    const sheet = styleEl.sheet as any

    sheet.insertRule(
      `.${stickyClassName} {
      position: sticky;
      position: -webkit-sticky;
      z-index: 2;
    } `,
      0
    )

    style.current = styleEl

    return () => {
      document.head.removeChild(style.current!)
      style.current = null
    }
  }, [])

  return null
}

const START_CHAR = 97
const END_CHAR = 122

const randomChar = () => String.fromCharCode(Math.round(Math.random() * (END_CHAR - START_CHAR) + START_CHAR))

export const randomClassName = () =>
  new Array(12)
    .fill(0)
    .map(randomChar)
    .join('')

export const viewportStyle: CSSProperties = {
  top: 0,
  position: 'absolute',
  height: '100%',
  width: '100%',
  overflow: 'absolute',
}
