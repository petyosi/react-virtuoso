import { useContext, useLayoutEffect, useRef, FC } from 'react'
import { useOutput } from './Utils'
import { VirtuosoContext } from './VirtuosoContext'

export const VirtuosoStyle: FC<{
  fillerClassName: string
  listClassName: string
  pinnedClassName: string
  viewportClassName: string
}> = ({ fillerClassName, listClassName, pinnedClassName, viewportClassName }) => {
  const { listOffset, totalHeight } = useContext(VirtuosoContext)!
  const fillerHeight = useOutput<number>(totalHeight, 0)

  const translate = useOutput<number>(listOffset, 0)

  const style = useRef<HTMLStyleElement | null>(null)
  useLayoutEffect(() => {
    let styleEl = document.createElement('style')
    document.head.appendChild(styleEl)
    const sheet = styleEl.sheet as any

    sheet.insertRule(`.${listClassName} {
      transform: translateY(0)
    } `)

    sheet.insertRule(`.${pinnedClassName} {
      transform: translateY(0);
      position: relative
      z-index: 2
    }`)

    sheet.insertRule(`.${fillerClassName} {
      height: 0;
      position: absolute;
      top: 0
    }`)

    sheet.insertRule(`.${viewportClassName} {
      top: 0;
      position: sticky;
      position: -webkit-sticky;
      height: 100%;
      overflow: hidden;
    }`)

    style.current = styleEl

    return () => {
      document.head.removeChild(style.current!)
      style.current = null
    }
  }, [])

  useLayoutEffect(() => {
    const sheet = style.current!.sheet as any
    sheet.cssRules[3].style.transform = `translateY(${translate}px)`
    sheet.cssRules[2].style.transform = `translateY(${-translate}px)`
  }, [translate])

  useLayoutEffect(() => {
    const sheet = style.current!.sheet as any
    sheet.cssRules[1].style.height = `${fillerHeight}px`
  }, [fillerHeight])

  return null
}
