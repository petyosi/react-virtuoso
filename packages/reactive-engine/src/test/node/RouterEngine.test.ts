import { beforeEach, describe, expect, it } from 'vitest'

import { Engine } from '../..'
import { Route } from '../../router/Route'
import { RouterEngine } from '../../router/RouterEngine'

describe('route interpolation', () => {
  let eng!: Engine
  beforeEach(() => {
    eng = new Engine()
  })

  it('starts with a null value', () => {
    const { currentRoute$ } = RouterEngine(eng, [])
    expect(eng.getValue(currentRoute$)).toBe(null)
  })

  it('interpolates route params when publishing in a route', () => {
    const userProfile$ = Route('/users/{userId}')
    const { currentRoute$ } = RouterEngine(eng, [userProfile$])
    eng.pub(userProfile$, { userId: '123' })
    expect(eng.getValue(currentRoute$)).toBe('/users/123')
  })

  it('interpolates multiple parameters', () => {
    const orgSettings$ = Route('/users/{user}/{org}/settings')
    const { currentRoute$ } = RouterEngine(eng, [orgSettings$])
    eng.pub(orgSettings$, { org: 'acme', user: 'john' })
    expect(eng.getValue(currentRoute$)).toBe('/users/john/acme/settings')
  })

  it('interpolates typed parameters', () => {
    const orgSettings$ = Route('/users/{userId:number}/{orgId:number}/settings')
    const { currentRoute$ } = RouterEngine(eng, [orgSettings$])
    eng.pub(orgSettings$, { orgId: 456, userId: 123 })
    expect(eng.getValue(currentRoute$)).toBe('/users/123/456/settings')
  })

  it('interpolates rest segments', () => {
    const files$ = Route('/users/{userId:number}/{*rest}')
    const { currentRoute$ } = RouterEngine(eng, [files$])
    eng.pub(files$, { rest: ['documents', 'project', 'file.txt'], userId: 123 })
    expect(eng.getValue(currentRoute$)).toBe('/users/123/documents/project/file.txt')
  })

  it('interpolates with query params', () => {
    const users$ = Route('/users/{userId:number}/?orgId={orgId}')
    const { currentRoute$ } = RouterEngine(eng, [users$])
    eng.pub(users$, { $search: { orgId: '456' }, userId: 123 })
    expect(eng.getValue(currentRoute$)).toBe('/users/123/?orgId=456')
  })

  it('interpolates with optional query params', () => {
    const users$ = Route('/users/{userId:number}/?orgId={orgId?}')
    const { currentRoute$ } = RouterEngine(eng, [users$])
    eng.pub(users$, { $search: { orgId: '456' }, userId: 123 })
    expect(eng.getValue(currentRoute$)).toBe('/users/123/?orgId=456')
  })

  it('interpolates with typed query params', () => {
    const users$ = Route('/users/{userId:number}/?orgId={orgId?:number}')
    const { currentRoute$ } = RouterEngine(eng, [users$])
    eng.pub(users$, { $search: { orgId: 789 }, userId: 123 })
    expect(eng.getValue(currentRoute$)).toBe('/users/123/?orgId=789')
  })

  it('interpolates with array query params', () => {
    const users$ = Route('/users/{userId:number}/?orgIds={orgIds:number[]}')
    const { currentRoute$ } = RouterEngine(eng, [users$])
    eng.pub(users$, { $search: { orgIds: [1, 2, 3] }, userId: 123 })
    expect(eng.getValue(currentRoute$)).toBe('/users/123/?orgIds=1&orgIds=2&orgIds=3')
  })

  it('handles differently named query params', () => {
    const users$ = Route('/users/{userId:number}/?org={orgId}')
    const { currentRoute$ } = RouterEngine(eng, [users$])
    eng.pub(users$, { $search: { orgId: '456' }, userId: 123 })
    expect(eng.getValue(currentRoute$)).toBe('/users/123/?org=456')
  })

  it('supports passing arbitrary search param', () => {
    const users$ = Route('/users/{userId:number}/?org={orgId}&filter={filter:boolean}')
    const { currentRoute$ } = RouterEngine(eng, [users$])
    eng.pub(users$, { $search: { filter: true, orgId: '456' }, userId: 123 })
    expect(eng.getValue(currentRoute$)).toBe('/users/123/?org=456&filter=true')
  })
})

describe('route exclusiveness', () => {
  let eng!: Engine
  beforeEach(() => {
    eng = new Engine()
  })

  it('publishes to one route and nullifies other routes', () => {
    const users$ = Route('/users/{userId:number}/?org={orgId}')
    const project$ = Route('/projects/{projectId:number}/?org={orgId}')
    const { currentRoute$ } = RouterEngine(eng, [users$, project$])
    expect(eng.getValue(currentRoute$)).toBe(null)

    eng.pub(users$, { $search: { orgId: '456' }, userId: 123 })
    expect(eng.getValue(currentRoute$)).toBe('/users/123/?org=456')
    expect(eng.getValue(project$)).toBe(null)

    eng.pub(project$, { $search: { orgId: '456' }, projectId: 789 })
    expect(eng.getValue(currentRoute$)).toBe('/projects/789/?org=456')
    expect(eng.getValue(users$)).toBe(null)
  })
})

describe('goToUrl', () => {
  let eng!: Engine
  beforeEach(() => {
    eng = new Engine()
  })

  it('parses URL and activates matching route with simple params', () => {
    const users$ = Route('/users/{userId}')
    const { currentRoute$, goToUrl$ } = RouterEngine(eng, [users$])

    eng.pub(goToUrl$, '/users/123')
    expect(eng.getValue(currentRoute$)).toBe('/users/123')
    expect(eng.getValue(users$)).toEqual({ userId: '123' })
  })

  it('parses URL with typed params', () => {
    const users$ = Route('/users/{userId:number}')
    const { currentRoute$, goToUrl$ } = RouterEngine(eng, [users$])

    eng.pub(goToUrl$, '/users/456')
    expect(eng.getValue(currentRoute$)).toBe('/users/456')
    expect(eng.getValue(users$)).toEqual({ userId: 456 })
  })

  it('parses URL with multiple params', () => {
    const settings$ = Route('/users/{userId:number}/orgs/{orgId:number}')
    const { currentRoute$, goToUrl$ } = RouterEngine(eng, [settings$])

    eng.pub(goToUrl$, '/users/123/orgs/456')
    expect(eng.getValue(currentRoute$)).toBe('/users/123/orgs/456')
    expect(eng.getValue(settings$)).toEqual({ orgId: 456, userId: 123 })
  })

  it('parses URL with query params', () => {
    const users$ = Route('/users/{userId:number}/?org={orgId}')
    const { currentRoute$, goToUrl$ } = RouterEngine(eng, [users$])

    eng.pub(goToUrl$, '/users/123/?org=456')
    expect(eng.getValue(currentRoute$)).toBe('/users/123/?org=456')
    expect(eng.getValue(users$)).toEqual({ $search: { orgId: '456' }, userId: 123 })
  })

  it('parses URL with typed query params', () => {
    const users$ = Route('/users/{userId:number}/?orgId={orgId:number}')
    const { currentRoute$, goToUrl$ } = RouterEngine(eng, [users$])

    eng.pub(goToUrl$, '/users/123/?orgId=789')
    expect(eng.getValue(currentRoute$)).toBe('/users/123/?orgId=789')
    expect(eng.getValue(users$)).toEqual({ $search: { orgId: 789 }, userId: 123 })
  })

  it('parses URL with array query params', () => {
    const users$ = Route('/users/{userId:number}/?ids={ids:number[]}')
    const { currentRoute$, goToUrl$ } = RouterEngine(eng, [users$])

    eng.pub(goToUrl$, '/users/123/?ids=1&ids=2&ids=3')
    expect(eng.getValue(currentRoute$)).toBe('/users/123/?ids=1&ids=2&ids=3')
    expect(eng.getValue(users$)).toEqual({ $search: { ids: [1, 2, 3] }, userId: 123 })
  })

  it('parses URL with rest segments', () => {
    const files$ = Route('/files/{*path}')
    const { currentRoute$, goToUrl$ } = RouterEngine(eng, [files$])

    eng.pub(goToUrl$, '/files/documents/project/file.txt')
    expect(eng.getValue(currentRoute$)).toBe('/files/documents/project/file.txt')
    expect(eng.getValue(files$)).toEqual({ path: ['documents', 'project', 'file.txt'] })
  })

  it('handles multiple routes and activates the matching one', () => {
    const users$ = Route('/users/{userId:number}')
    const projects$ = Route('/projects/{projectId:number}')
    const { currentRoute$, goToUrl$ } = RouterEngine(eng, [users$, projects$])

    eng.pub(goToUrl$, '/users/123')
    expect(eng.getValue(currentRoute$)).toBe('/users/123')
    expect(eng.getValue(users$)).toEqual({ userId: 123 })
    expect(eng.getValue(projects$)).toBe(null)

    eng.pub(goToUrl$, '/projects/456')
    expect(eng.getValue(currentRoute$)).toBe('/projects/456')
    expect(eng.getValue(projects$)).toEqual({ projectId: 456 })
    expect(eng.getValue(users$)).toBe(null)
  })

  it('does nothing when URL does not match any route', () => {
    const users$ = Route('/users/{userId:number}')
    const { currentRoute$, goToUrl$ } = RouterEngine(eng, [users$])

    eng.pub(goToUrl$, '/products/123')
    expect(eng.getValue(currentRoute$)).toBe(null)
    expect(eng.getValue(users$)).toBe(null)
  })

  it('parses arbitrary query params not in template', () => {
    const users$ = Route('/users/{userId:number}/?org={orgId}')
    const { currentRoute$, goToUrl$ } = RouterEngine(eng, [users$])

    eng.pub(goToUrl$, '/users/123/?org=456&filter=active')
    expect(eng.getValue(currentRoute$)).toBe('/users/123/?org=456&filter=active')
    expect(eng.getValue(users$)).toEqual({ $search: { filter: 'active', orgId: '456' }, userId: 123 })
  })
})
