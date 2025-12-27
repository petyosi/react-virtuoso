import { lazy } from 'react'
import { Route } from '@virtuoso.dev/reactive-engine-router'

const BlogPage = lazy(() => import('./BlogPage').then((m) => ({ default: m.BlogPage })))

export const blog$ = Route('/blog/{slug}/?category={category}&tag={tag?}', BlogPage)
