import { lazy } from 'react'
import { Route } from '@virtuoso.dev/reactive-engine-router'

const UserPage = lazy(() => import('./UserPage').then((m) => ({ default: m.UserPage })))

export const user$ = Route('/users/{userId:number}', UserPage)
