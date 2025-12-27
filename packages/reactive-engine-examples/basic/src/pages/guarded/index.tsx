import { lazy } from 'react'
import { Guard, Route } from '@virtuoso.dev/reactive-engine-router'

const GuardedPage = lazy(() => import('./GuardedPage').then((m) => ({ default: m.GuardedPage })))

export const guarded$ = Route('/guarded/{userId:number}', GuardedPage)

export const theGuard$ = Guard('/guarded/', async (context) => {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return context.redirect('')
})
