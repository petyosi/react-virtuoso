import React from 'react'

const useIsomorphicLayoutEffect = typeof document === 'undefined' ? React.useEffect : React.useLayoutEffect

export default useIsomorphicLayoutEffect
