import * as React from 'react'

import { Realm } from './realm'

/**
 * @category React Components
 * The context that provides the realm to the built-in hooks.
 */
export const RealmContext = React.createContext<null | Realm>(null)

/**
 * @category React Components
 */
export function RealmProvider({
  children,
  initWith,
  updateWith = {},
}: {
  /**
   * The children to render
   */
  children: React.ReactNode
  /**
   * The initial values to set in the realm
   */
  initWith?: Record<string, unknown>
  /**
   * The values to update in the realm on each render
   */
  updateWith?: Record<string, unknown>
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const theRealm = React.useMemo(() => new Realm(initWith), [])

  React.useEffect(() => {
    theRealm.pubIn(updateWith)
  }, [updateWith, theRealm])

  return <RealmContext.Provider value={theRealm}>{children}</RealmContext.Provider>
}
