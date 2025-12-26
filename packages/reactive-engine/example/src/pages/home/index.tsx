import { lazy } from 'react'
import { Route } from '../../../../src/'

const HomePage = lazy(() => import('./HomePage').then((m) => ({ default: m.HomePage })))

export const home$ = Route('/', () => <HomePage />)
