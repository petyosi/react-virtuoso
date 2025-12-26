import { lazy } from 'react'
import { Route } from '../../../../src/'

const UserPage = lazy(() => import('./UserPage').then((m) => ({ default: m.UserPage })))

export const user$ = Route('/users/{userId:number}', UserPage)
