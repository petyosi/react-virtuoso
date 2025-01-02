import { type FC, type RefObject, createRef, useEffect } from 'react'
import { render } from 'vitest-browser-react'

export interface RenderHookResult<Result, Props> {
  /**
   * Triggers a re-render. The props will be passed to your renderHook callback.
   */
  rerender: (props: Props) => void
  /**
   * This is a stable reference to the latest value returned by your renderHook
   * callback
   */
  result: RefObject<Result>
}

export interface RenderHookOptions<Props> {
  /**
   * If `hydrate` is set to `true`, then it will render with `ReactDOM.hydrate`. This may be useful if you are using server-side
   *  rendering and use ReactDOM.hydrate to mount your components.
   *
   *  @see https://testing-library.com/docs/react-testing-library/api/#hydrate)
   */
  hydrate?: boolean | undefined
  /**
   * Pass a React Component as the wrapper option to have it rendered around the inner element. This is most useful for creating
   *  reusable custom render functions for common data providers. See setup for examples.
   *
   *  @see https://testing-library.com/docs/react-testing-library/api/#wrapper
   */
  wrapper?: React.JSXElementConstructor<{ children: React.ReactNode }> | undefined
  /**
   * The argument passed to the renderHook callback. Can be useful if you plan
   * to use the rerender utility to change the values passed to your hook.
   */
  initialProps: Props
}

export function renderHook<Result, Props>(
  useHookFn: (initialProps: Props) => Result,
  options: RenderHookOptions<Props>
): RenderHookResult<Result, Props> {
  const { initialProps, ...renderOptions } = options

  const result = createRef<Result>()

  const TestComponent: FC<{ renderCallbackProps: Props }> = ({ renderCallbackProps }) => {
    const pendingResult = useHookFn(renderCallbackProps)
    useEffect(() => {
      // @ts-expect-error
      result.current = pendingResult
    })

    return null
  }

  const { rerender: baseRerender } = render(<TestComponent renderCallbackProps={initialProps} />, renderOptions)

  function rerender(rerenderCallbackProps: Props) {
    baseRerender(<TestComponent renderCallbackProps={rerenderCallbackProps} />)
  }
  return { result, rerender }
}
