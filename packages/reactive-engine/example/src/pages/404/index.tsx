import { lazy } from 'react'
import { Route } from '../../../../src/'

const NotFoundPage = lazy(() => import('./NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

export const notFound$ = Route('/404', () => <NotFoundPage />)
