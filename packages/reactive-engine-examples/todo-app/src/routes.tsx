import { lazy } from 'react'
import { e } from '@virtuoso.dev/reactive-engine-core'
import { Route } from '@virtuoso.dev/reactive-engine-router'
import { tasksQuery } from './queries'

const TasksPage = lazy(() => import('./TasksPage').then((m) => ({ default: m.TasksPage })))

const ListsPage = lazy(() => import('./ListsPage').then((m) => ({ default: m.ListsPage })))

export const lists$ = Route('/', ListsPage)
export const tasks$ = Route('/lists/{id:string}', TasksPage)

e.link(
  e.pipe(
    tasks$,
    e.filter((state) => state !== null),
    e.map((params) => {
      // biome-ignore lint/style/noNonNullAssertion: for now :(
      const pathParams = Array.isArray(params) ? params[0] : params!
      return { listId: pathParams.id }
    })
  ),
  tasksQuery.params$
)
