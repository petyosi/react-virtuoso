/// <reference types="@vitest/browser/matchers" />

import { EngineProvider, usePublisher } from '@virtuoso.dev/reactive-engine-react'
import * as React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Layout } from '../../Layout'
import { Route } from '../../Route'
import { Router } from '../../Router'

describe('Router', () => {
  beforeEach(() => {
    // Reset browser history to a clean state
    window.history.pushState({}, '', '/')
  })

  it('renders the active route component with browser history enabled', async () => {
    const home$ = Route('/', () => <div>Home Page</div>)
    const about$ = Route('/about', () => <div>About Page</div>)

    function TestApp() {
      const goToHome = usePublisher(home$)

      React.useEffect(() => {
        goToHome({})
      }, [goToHome])

      return <Router routes={[home$, about$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()
  })

  it('renders without browser history when useBrowserHistory is false', async () => {
    const home$ = Route('/', () => <div>Home Page</div>)
    const user$ = Route('/users/{userId:number}', ({ userId }) => <div>User: {userId}</div>)

    function TestApp() {
      const goToHome = usePublisher(home$)
      const goToUser = usePublisher(user$)

      React.useEffect(() => {
        goToHome({})
      }, [goToHome])

      return (
        <div>
          <button
            onClick={() => {
              goToUser({ userId: 42 })
            }}
          >
            Go to User
          </button>
          <Router routes={[home$, user$]} useBrowserHistory={false} />
        </div>
      )
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()

    // Verify URL hasn't changed
    expect(window.location.pathname).toBe('/')

    // Navigate to user
    await screen.getByText('Go to User').click()
    await expect.element(screen.getByText('User: 42')).toBeInTheDocument()

    // Verify URL still hasn't changed (no browser history integration)
    expect(window.location.pathname).toBe('/')
  })

  it('syncs route changes to browser URL', async () => {
    const home$ = Route('/', () => <div>Home Page</div>)
    const about$ = Route('/about', () => <div>About Page</div>)
    const user$ = Route('/users/{userId:number}', ({ userId }) => <div>User: {userId}</div>)

    function TestApp() {
      const goToHome = usePublisher(home$)
      const goToAbout = usePublisher(about$)
      const goToUser = usePublisher(user$)

      React.useEffect(() => {
        goToHome({})
      }, [goToHome])

      return (
        <div>
          <button
            onClick={() => {
              goToAbout({})
            }}
          >
            Go to About
          </button>
          <button
            onClick={() => {
              goToUser({ userId: 123 })
            }}
          >
            Go to User 123
          </button>
          <Router routes={[home$, about$, user$]} />
        </div>
      )
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')

    // Navigate to about
    await screen.getByText('Go to About').click()
    await expect.element(screen.getByText('About Page')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/about')

    // Navigate to user
    await screen.getByText('Go to User 123').click()
    await expect.element(screen.getByText('User: 123')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/users/123')
  })

  it('handles browser back button navigation', async () => {
    const home$ = Route('/', () => <div>Home Page</div>)
    const about$ = Route('/about', () => <div>About Page</div>)
    const contact$ = Route('/contact', () => <div>Contact Page</div>)

    function TestApp() {
      const goToHome = usePublisher(home$)
      const goToAbout = usePublisher(about$)
      const goToContact = usePublisher(contact$)

      React.useEffect(() => {
        goToHome({})
      }, [goToHome])

      return (
        <div>
          <button
            onClick={() => {
              goToAbout({})
            }}
          >
            Go to About
          </button>
          <button
            onClick={() => {
              goToContact({})
            }}
          >
            Go to Contact
          </button>
          <Router routes={[home$, about$, contact$]} />
        </div>
      )
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Start at home
    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')

    // Navigate to about
    await screen.getByText('Go to About').click()
    await expect.element(screen.getByText('About Page')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/about')

    // Navigate to contact
    await screen.getByText('Go to Contact').click()
    await expect.element(screen.getByText('Contact Page')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/contact')

    // Go back to about
    window.history.back()
    // Trigger popstate event manually
    window.dispatchEvent(new PopStateEvent('popstate'))
    await expect.element(screen.getByText('About Page')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/about')

    // Go back to home
    window.history.back()
    window.dispatchEvent(new PopStateEvent('popstate'))
    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('handles browser forward button navigation', async () => {
    const home$ = Route('/', () => <div>Home Page</div>)
    const about$ = Route('/about', () => <div>About Page</div>)

    function TestApp() {
      const goToHome = usePublisher(home$)
      const goToAbout = usePublisher(about$)

      React.useEffect(() => {
        goToHome({})
      }, [goToHome])

      return (
        <div>
          <button
            onClick={() => {
              goToAbout({})
            }}
          >
            Go to About
          </button>
          <Router routes={[home$, about$]} />
        </div>
      )
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Navigate to about
    await screen.getByText('Go to About').click()
    await expect.element(screen.getByText('About Page')).toBeInTheDocument()

    // Go back to home
    window.history.back()
    window.dispatchEvent(new PopStateEvent('popstate'))
    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()

    // Go forward to about
    window.history.forward()
    window.dispatchEvent(new PopStateEvent('popstate'))
    await expect.element(screen.getByText('About Page')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/about')
  })

  it('works with basePath prefix', async () => {
    // Start at a URL that includes the basePath
    window.history.pushState({}, '', '/app/')

    const home$ = Route('/', () => <div>Home Page</div>)
    const about$ = Route('/about', () => <div>About Page</div>)

    function TestApp() {
      const goToAbout = usePublisher(about$)

      return (
        <div>
          <button
            onClick={() => {
              goToAbout({})
            }}
          >
            Go to About
          </button>
          <Router basePath="/app" routes={[home$, about$]} />
        </div>
      )
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/app/')

    // Navigate to about with basePath
    await screen.getByText('Go to About').click()
    await expect.element(screen.getByText('About Page')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/app/about')
  })

  it('renders with layouts when specified', async () => {
    const rootLayout = Layout('/', ({ children }) => (
      <div>
        <header>Root Header</header>
        {children}
      </div>
    ))

    const home$ = Route('/', () => <div>Home Page</div>)

    function TestApp() {
      const goToHome = usePublisher(home$)

      React.useEffect(() => {
        goToHome({})
      }, [goToHome])

      return <Router layouts={[rootLayout]} routes={[home$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Root Header')).toBeInTheDocument()
    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()
  })

  it('handles query parameters in URLs', async () => {
    const home$ = Route('/', () => {
      const goToSearch = usePublisher(search$)

      React.useEffect(() => {
        goToSearch({ $search: { filter: 'active', sort: 'date' }, query: 'test' })
      }, [goToSearch])
      return null
    })

    const search$ = Route('/search/{query}/?filter={filter}&sort={sort?}', ({ $search, query }) => (
      <div>
        <div>Query: {query}</div>
        <div>Filter: {$search.filter}</div>
        {$search.sort && <div>Sort: {$search.sort}</div>}
      </div>
    ))

    function TestApp() {
      return <Router routes={[home$, search$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Query: test')).toBeInTheDocument()
    await expect.element(screen.getByText('Filter: active')).toBeInTheDocument()
    await expect.element(screen.getByText('Sort: date')).toBeInTheDocument()
    expect(window.location.pathname + window.location.search).toBe('/search/test/?filter=active&sort=date')
  })

  it('handles navigation with browser back after multiple route changes', async () => {
    const home$ = Route('/', () => <div>Home Page</div>)
    const user$ = Route('/users/{userId:number}', ({ userId }) => <div>User: {userId}</div>)

    function TestApp() {
      const goToHome = usePublisher(home$)
      const goToUser = usePublisher(user$)

      React.useEffect(() => {
        goToHome({})
      }, [goToHome])

      return (
        <div>
          <button
            onClick={() => {
              goToUser({ userId: 1 })
            }}
          >
            User 1
          </button>
          <button
            onClick={() => {
              goToUser({ userId: 2 })
            }}
          >
            User 2
          </button>
          <button
            onClick={() => {
              goToUser({ userId: 3 })
            }}
          >
            User 3
          </button>
          <Router routes={[home$, user$]} />
        </div>
      )
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()

    // Navigate through multiple users
    await screen.getByText('User 1').click()
    await expect.element(screen.getByText('User: 1')).toBeInTheDocument()

    await screen.getByText('User 2').click()
    await expect.element(screen.getByText('User: 2')).toBeInTheDocument()

    await screen.getByText('User 3').click()
    await expect.element(screen.getByText('User: 3')).toBeInTheDocument()

    // Go back through history
    window.history.back()
    window.dispatchEvent(new PopStateEvent('popstate'))
    await expect.element(screen.getByText('User: 2')).toBeInTheDocument()

    window.history.back()
    window.dispatchEvent(new PopStateEvent('popstate'))
    await expect.element(screen.getByText('User: 1')).toBeInTheDocument()

    window.history.back()
    window.dispatchEvent(new PopStateEvent('popstate'))
    await expect.element(screen.getByText('Home Page')).toBeInTheDocument()
  })
})
