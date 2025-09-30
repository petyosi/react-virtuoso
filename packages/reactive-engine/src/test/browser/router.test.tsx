/// <reference types="@vitest/browser/matchers" />

import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { EngineProvider, useCellValue, useEngine, usePublisher } from '../../react'
import { Router as createRouter, Layout, Route } from '../../router'

describe('Router React Integration', () => {
  it('renders the active route component', async () => {
    const home$ = Route('/', () => <div>Home Page</div>)
    const user$ = Route('/users/{userId:number}', ({ pathParams }) => <div>User: {pathParams.userId}</div>)
    const router = createRouter([home$, user$])

    function TestApp() {
      const engine = useEngine()
      React.useEffect(() => {
        engine.pub(home$, {})
      }, [engine])

      return <RouterView router={router} />
    }

    function RouterView({ router }: { router: ReturnType<typeof createRouter> }) {
      const ActiveComponent = useCellValue(router.component$)

      if (!ActiveComponent) {
        return null
      }

      return <ActiveComponent />
    }

    const screen = render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()
  })

  it('switches between routes when route cells are published to', async () => {
    const home$ = Route('/', () => <div>Home Page</div>)
    const user$ = Route('/users/{userId:number}', ({ pathParams }) => <div>User: {pathParams.userId}</div>)
    const router = createRouter([home$, user$])

    function TestApp() {
      const engine = useEngine()
      const [activeRoute, setActiveRoute] = React.useState<'home' | 'user'>('home')

      React.useEffect(() => {
        if (activeRoute === 'home') {
          engine.pub(home$, {})
        } else {
          engine.pub(user$, { userId: 42 })
        }
      }, [engine, activeRoute])

      return (
        <div>
          <button
            onClick={() => {
              setActiveRoute('home')
            }}
          >
            Go Home
          </button>
          <button
            onClick={() => {
              setActiveRoute('user')
            }}
          >
            Go to User
          </button>
          <RouterView router={router} />
        </div>
      )
    }

    function RouterView({ router }: { router: ReturnType<typeof createRouter> }) {
      const ActiveComponent = useCellValue(router.component$)

      if (!ActiveComponent) {
        return <div>No route</div>
      }

      return <ActiveComponent />
    }

    const screen = render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()

    await screen.getByText('Go to User').click()
    await expect.element(screen.getByText('User: 42')).toBeInTheDocument()

    await screen.getByText('Go Home').click()
    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()
  })

  it('navigates via goToUrl$ stream', async () => {
    const home$ = Route('/', () => <div>Home Page</div>)
    const user$ = Route('/users/{userId:number}', ({ pathParams }) => <div>User: {pathParams.userId}</div>)
    const router = createRouter([home$, user$])

    function TestApp() {
      const publishUrl = usePublisher(router.goToUrl$)

      React.useEffect(() => {
        publishUrl('/')
      }, [publishUrl])

      return (
        <div>
          <button
            onClick={() => {
              publishUrl('/')
            }}
          >
            Go Home
          </button>
          <button
            onClick={() => {
              publishUrl('/users/42')
            }}
          >
            Go to User 42
          </button>
          <button
            onClick={() => {
              publishUrl('/users/99')
            }}
          >
            Go to User 99
          </button>
          <RouterView router={router} />
        </div>
      )
    }

    function RouterView({ router }: { router: ReturnType<typeof createRouter> }) {
      const ActiveComponent = useCellValue(router.component$)

      if (!ActiveComponent) {
        return <div>No route</div>
      }

      return <ActiveComponent />
    }

    const screen = render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()

    await screen.getByText('Go to User 42').click()
    await expect.element(screen.getByText('User: 42')).toBeInTheDocument()

    await screen.getByText('Go to User 99').click()
    await expect.element(screen.getByText('User: 99')).toBeInTheDocument()

    await screen.getByText('Go Home').click()
    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()
  })

  it('renders layouts wrapping the route component', async () => {
    const rootLayout = Layout('/', ({ children }) => (
      <div>
        <header>Root Header</header>
        {children}
      </div>
    ))

    const usersLayout = Layout('/users', ({ children }) => (
      <div>
        <nav>Users Nav</nav>
        {children}
      </div>
    ))

    const home$ = Route('/', () => <div>Home Page</div>)
    const user$ = Route('/users/{userId:number}', ({ pathParams }) => <div>User: {pathParams.userId}</div>)
    const router = createRouter([home$, user$], [rootLayout, usersLayout])

    function TestApp() {
      const publishUrl = usePublisher(router.goToUrl$)

      React.useEffect(() => {
        publishUrl('/')
      }, [publishUrl])

      return (
        <div>
          <button
            onClick={() => {
              publishUrl('/')
            }}
          >
            Go Home
          </button>
          <button
            onClick={() => {
              publishUrl('/users/42')
            }}
          >
            Go to User 42
          </button>
          <RouterView router={router} />
        </div>
      )
    }

    function RouterView({ router }: { router: ReturnType<typeof createRouter> }) {
      const ActiveComponent = useCellValue(router.component$)

      if (!ActiveComponent) {
        return <div>No route</div>
      }

      return <ActiveComponent />
    }

    const screen = render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Home should have root layout but not users layout
    await expect.element(screen.getByText('Root Header')).toBeInTheDocument()
    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()

    await screen.getByText('Go to User 42').click()

    // User should have both root and users layout
    await expect.element(screen.getByText('Root Header')).toBeInTheDocument()
    await expect.element(screen.getByText('Users Nav')).toBeInTheDocument()
    await expect.element(screen.getByText('User: 42')).toBeInTheDocument()
  })

  it('properly nests multiple layouts from outermost to innermost', async () => {
    const rootLayout = Layout('/', ({ children }: { children: React.ReactNode }) => (
      <div data-testid="root">
        Root
        {children}
      </div>
    ))

    const sectionLayout = Layout('/section', ({ children }: { children: React.ReactNode }) => (
      <div data-testid="section">
        Section
        {children}
      </div>
    ))

    const subLayout = Layout('/section/sub', ({ children }: { children: React.ReactNode }) => (
      <div data-testid="sub">
        Sub
        {children}
      </div>
    ))

    const page$ = Route('/section/sub/page/{id:number}', ({ pathParams }) => <div data-testid="page">Page: {pathParams.id}</div>)
    const router = createRouter([page$], [rootLayout, sectionLayout, subLayout])

    function TestApp() {
      const publishUrl = usePublisher(router.goToUrl$)

      React.useEffect(() => {
        publishUrl('/section/sub/page/123')
      }, [publishUrl])

      return <RouterView router={router} />
    }

    function RouterView({ router }: { router: ReturnType<typeof createRouter> }) {
      const ActiveComponent = useCellValue(router.component$)

      if (!ActiveComponent) {
        return null
      }

      return <ActiveComponent />
    }

    const screen = render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Verify all layouts are present
    await expect.element(screen.getByTestId('root')).toBeInTheDocument()
    await expect.element(screen.getByTestId('section')).toBeInTheDocument()
    await expect.element(screen.getByTestId('sub')).toBeInTheDocument()
    await expect.element(screen.getByTestId('page')).toBeInTheDocument()

    // Verify nesting order by checking DOM structure
    const root = screen.getByTestId('root')
    const section = screen.getByTestId('section')
    const sub = screen.getByTestId('sub')
    const page = screen.getByTestId('page')

    expect(root.element().contains(section.element())).toBe(true)
    expect(section.element().contains(sub.element())).toBe(true)
    expect(sub.element().contains(page.element())).toBe(true)
  })

  it('handles routes without components (no rendering)', async () => {
    const home$ = Route('/')
    const user$ = Route('/users/{userId:number}')
    const router = createRouter([home$, user$])

    function TestApp() {
      const publishUrl = usePublisher(router.goToUrl$)
      const currentRoute = useCellValue(router.currentRoute$)

      React.useEffect(() => {
        publishUrl('/')
      }, [publishUrl])

      return (
        <div>
          <div>Current: {currentRoute ?? 'none'}</div>
          <button
            onClick={() => {
              publishUrl('/users/42')
            }}
          >
            Go to User 42
          </button>
          <RouterView router={router} />
        </div>
      )
    }

    function RouterView({ router }: { router: ReturnType<typeof createRouter> }) {
      const activeComponent = useCellValue(router.component$)

      if (!activeComponent) {
        return <div>No component</div>
      }

      return <div>Has component</div>
    }

    const screen = render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Current: /')).toBeInTheDocument()
    await expect.element(screen.getByText('No component')).toBeInTheDocument()

    await screen.getByText('Go to User 42').click()
    await expect.element(screen.getByText('Current: /users/42')).toBeInTheDocument()
    await expect.element(screen.getByText('No component')).toBeInTheDocument()
  })

  it('handles query parameters in route components', async () => {
    const search$ = Route('/search/{query}/?filter={filter}&sort={sort?}', ({ pathParams, queryParams }) => (
      <div>
        <div>Query: {pathParams.query}</div>
        <div>Filter: {queryParams.filter}</div>
        {queryParams.sort && <div>Sort: {queryParams.sort}</div>}
      </div>
    ))
    const router = createRouter([search$])

    function TestApp() {
      const publishUrl = usePublisher(router.goToUrl$)

      React.useEffect(() => {
        publishUrl('/search/test/?filter=active&sort=date')
      }, [publishUrl])

      return <RouterView router={router} />
    }

    function RouterView({ router }: { router: ReturnType<typeof createRouter> }) {
      const ActiveComponent = useCellValue(router.component$)

      if (!ActiveComponent) {
        return null
      }

      return <ActiveComponent />
    }

    const screen = render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Query: test')).toBeInTheDocument()
    await expect.element(screen.getByText('Filter: active')).toBeInTheDocument()
    await expect.element(screen.getByText('Sort: date')).toBeInTheDocument()
  })
})
