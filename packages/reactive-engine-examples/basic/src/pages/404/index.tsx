import { lazy } from 'react'
import { Route } from '@virtuoso.dev/reactive-engine-router'

const NotFoundPage = lazy(() => import('./NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

export const notFound$ = Route('/404', () => <NotFoundPage />)
