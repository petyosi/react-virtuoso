import { lazy } from 'react'
import { Route } from '../../../../src/'

const AboutPage = lazy(() => import('./AboutPage').then((m) => ({ default: m.AboutPage })))

export const about$ = Route('/about', () => <AboutPage />)
