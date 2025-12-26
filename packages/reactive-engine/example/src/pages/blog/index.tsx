import { lazy } from 'react'
import { Route } from '../../../../src/'

const BlogPage = lazy(() => import('./BlogPage').then((m) => ({ default: m.BlogPage })))

export const blog$ = Route('/blog/{slug}/?category={category}&tag={tag?}', BlogPage)
