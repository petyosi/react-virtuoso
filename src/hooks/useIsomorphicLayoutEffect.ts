import React from 'react'

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect

export default useIsomorphicLayoutEffect
