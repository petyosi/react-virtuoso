import { lazy } from 'react'
import { Route } from '@virtuoso.dev/reactive-engine-router'

const AboutPage = lazy(() => import('./AboutPage').then((m) => ({ default: m.AboutPage })))

export const about$ = Route('/about', () => <AboutPage />)
