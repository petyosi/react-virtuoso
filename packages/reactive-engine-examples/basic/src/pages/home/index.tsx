import { lazy } from 'react'
import { Route } from '@virtuoso.dev/reactive-engine-router'

const HomePage = lazy(() => import('./HomePage').then((m) => ({ default: m.HomePage })))

export const home$ = Route('/', () => <HomePage />)
