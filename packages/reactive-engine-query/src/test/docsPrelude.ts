// Declarations the docs snippets assume. docsSnippets.test.ts prepends this to the snippets before type-checking them,
// with '../index' rewritten to the package name so the snippets check against the built declarations.
import { e, Engine } from '@virtuoso.dev/reactive-engine-core'

import { ConcurrentMutation, Mutation, Query } from '../index'

import type { ConcurrentMutationState, MutationResult, QueryResult } from '../index'
import type { NodeRef, StateRef } from '@virtuoso.dev/reactive-engine-core'

interface Task {
  done: boolean
  id: number
  listId: string
  title: string
}
type TParams = unknown
type TData = unknown

declare const api: {
  createTask: (params: { listId: string; title: string }, signal: AbortSignal) => Promise<Task>
  updateTask: (task: Task, signal: AbortSignal) => Promise<Task>
}
declare const tasks$: NodeRef<{ id: string } | null>
declare const userQuery: { data$: StateRef<QueryResult<{ id: string }>> }
declare const ordersQuery: { enabled$: NodeRef<boolean> }
declare function useCellValue<T>(node: StateRef<T>): T
declare function usePublisher<T>(node: NodeRef<T>): (value: T) => void
declare const React: { memo: <P>(component: (props: P) => unknown) => (props: P) => unknown }
declare function Spinner(): unknown
declare function ErrorView(props: { error: unknown }): unknown
declare function TaskList(props: { refreshing: boolean; tasks: Task[] }): unknown
declare global {
  // oxlint-disable-next-line typescript/no-namespace -- minimal JSX typing for the docs snippets
  namespace JSX {
    type Element = unknown
    interface IntrinsicAttributes {
      key?: number | string
    }
    interface IntrinsicElements {
      // oxlint-disable-next-line typescript/consistent-indexed-object-style -- JSX.IntrinsicElements must be an interface
      [name: string]: Record<string, unknown>
    }
  }
}

export type { ConcurrentMutationState, MutationResult, QueryResult, Task, TData, TParams }
export {
  api,
  ConcurrentMutation,
  e,
  Engine,
  ErrorView,
  Mutation,
  ordersQuery,
  Query,
  React,
  Spinner,
  TaskList,
  tasks$,
  useCellValue,
  usePublisher,
  userQuery,
}
