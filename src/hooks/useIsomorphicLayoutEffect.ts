import { useEffect, useLayoutEffect } from 'react'

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect

export default useIsomorphicLayoutEffect
