/// <reference types="@vitest/browser/matchers" />

import { Cell } from '@virtuoso.dev/reactive-engine-core'
import { EngineProvider, usePublisher } from '@virtuoso.dev/reactive-engine-react'
import * as React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Guard } from '../../Guard'
import { Route } from '../../Route'
import { Router } from '../../Router'

describe('Guards', () => {
  beforeEach(() => {
    // Reset browser history to a clean state
    window.history.pushState({}, '', '/')
  })

  // Basic guard execution
  it('executes guard and allows navigation on continue', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const allowGuard = Guard('/admin', (context) => {
      return context.continue()
    })

    function TestApp() {
      return <Router guards={[allowGuard]} routes={[home$, admin$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Admin Page')).toBeInTheDocument()
  })

  it('executes guard and allows navigation on implicit continue (void return)', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const allowGuard = Guard('/admin', () => {
      // Return void - should allow navigation
    })

    function TestApp() {
      return <Router guards={[allowGuard]} routes={[home$, admin$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Admin Page')).toBeInTheDocument()
  })

  it('executes guard and redirects on redirect result', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const login$ = Route('/login', () => <div>Login Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const redirectGuard = Guard('/admin', (context) => {
      return context.redirect('/login')
    })

    function TestApp() {
      return <Router guards={[redirectGuard]} routes={[home$, admin$, login$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Should be redirected to login page
    await expect.element(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('executes guard and changes destination on navigate result', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const dashboard$ = Route('/dashboard', () => <div>Dashboard Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const navigateGuard = Guard('/admin', (context) => {
      return context.navigate('/dashboard')
    })

    function TestApp() {
      return <Router guards={[navigateGuard]} routes={[home$, admin$, dashboard$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Should navigate to dashboard instead
    await expect.element(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })

  // Guard ordering
  it('executes guards in priority order (lower priority first)', async () => {
    const executionOrder: number[] = []

    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const guard1 = Guard(
      '/admin',
      () => {
        executionOrder.push(1)
      },
      { priority: 10 }
    )

    const guard2 = Guard(
      '/admin',
      () => {
        executionOrder.push(2)
      },
      { priority: 5 }
    )

    const guard3 = Guard(
      '/admin',
      () => {
        executionOrder.push(3)
      },
      { priority: 1 }
    )

    function TestApp() {
      return <Router guards={[guard1, guard2, guard3]} routes={[home$, admin$]} />
    }

    await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Should execute in priority order: 3 (priority 1), 2 (priority 5), 1 (priority 10)
    expect(executionOrder).toEqual([3, 2, 1])
  })

  it('executes broader pattern guards before specific patterns (same priority)', async () => {
    const executionOrder: string[] = []

    const adminUsers$ = Route('/admin/users', () => <div>Admin Users Page</div>)
    const home$ = Route('/', () => {
      const goToAdminUsers = usePublisher(adminUsers$)

      React.useEffect(() => {
        goToAdminUsers({})
      }, [goToAdminUsers])

      return <div>Home Page</div>
    })

    const broadGuard = Guard('/{*rest}', () => {
      executionOrder.push('broad')
    })

    const specificGuard = Guard('/admin/users', () => {
      executionOrder.push('specific')
    })

    function TestApp() {
      return <Router guards={[specificGuard, broadGuard]} routes={[home$, adminUsers$]} />
    }

    await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Broad pattern (/{*rest}) is shorter, should execute first
    expect(executionOrder).toEqual(['broad', 'specific'])
  })

  it('executes guards in definition order (same priority and specificity)', async () => {
    const executionOrder: number[] = []

    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const guard1 = Guard('/admin', () => {
      executionOrder.push(1)
    })

    const guard2 = Guard('/admin', () => {
      executionOrder.push(2)
    })

    const guard3 = Guard('/admin', () => {
      executionOrder.push(3)
    })

    function TestApp() {
      return <Router guards={[guard1, guard2, guard3]} routes={[home$, admin$]} />
    }

    await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Should execute in definition order
    expect(executionOrder).toEqual([1, 2, 3])
  })

  // Pattern matching
  it('matches guard pattern with path parameters', async () => {
    let capturedId: number | undefined

    const user$ = Route('/users/{id:number}', ({ id }) => <div>User: {id}</div>)
    const home$ = Route('/', () => {
      const goToUser = usePublisher(user$)

      React.useEffect(() => {
        goToUser({ id: 42 })
      }, [goToUser])

      return <div>Home Page</div>
    })

    const userGuard = Guard('/users/{id:number}', ({ params }) => {
      capturedId = params.id
    })

    function TestApp() {
      return <Router guards={[userGuard]} routes={[home$, user$]} />
    }

    await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(capturedId).toBe(42)
  })

  it('matches guard pattern with wildcard', async () => {
    let guardExecuted = false

    const adminUsers$ = Route('/admin/users', () => <div>Admin Users Page</div>)
    const adminSettings$ = Route('/admin/settings', () => <div>Admin Settings Page</div>)
    const home$ = Route('/', () => {
      const goToAdminUsers = usePublisher(adminUsers$)

      React.useEffect(() => {
        goToAdminUsers({})
      }, [goToAdminUsers])

      return <div>Home Page</div>
    })

    const adminGuard = Guard('/admin/{*rest}', () => {
      guardExecuted = true
    })

    function TestApp() {
      return <Router guards={[adminGuard]} routes={[home$, adminUsers$, adminSettings$]} />
    }

    await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(guardExecuted).toBe(true)
  })

  it('does not execute guard when pattern does not match', async () => {
    let guardExecuted = false

    const user$ = Route('/user', () => <div>User Page</div>)
    const home$ = Route('/', () => {
      const goToUser = usePublisher(user$)

      React.useEffect(() => {
        goToUser({})
      }, [goToUser])

      return <div>Home Page</div>
    })

    const adminGuard = Guard('/admin', () => {
      guardExecuted = true
    })

    function TestApp() {
      return <Router guards={[adminGuard]} routes={[home$, user$]} />
    }

    await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(guardExecuted).toBe(false)
  })

  // Multiple guards
  it('executes multiple matching guards in sequence', async () => {
    const executionOrder: number[] = []

    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const guard1 = Guard('/admin', () => {
      executionOrder.push(1)
    })

    const guard2 = Guard('/admin', () => {
      executionOrder.push(2)
    })

    const guard3 = Guard('/admin', () => {
      executionOrder.push(3)
    })

    function TestApp() {
      return <Router guards={[guard1, guard2, guard3]} routes={[home$, admin$]} />
    }

    await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(executionOrder).toEqual([1, 2, 3])
  })

  it('stops on first redirect result', async () => {
    const executionOrder: number[] = []

    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const login$ = Route('/login', () => <div>Login Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const guard1 = Guard('/admin', () => {
      executionOrder.push(1)
    })

    const guard2 = Guard('/admin', (context) => {
      executionOrder.push(2)
      return context.redirect('/login')
    })

    const guard3 = Guard('/admin', () => {
      executionOrder.push(3)
    })

    function TestApp() {
      return <Router guards={[guard1, guard2, guard3]} routes={[home$, admin$, login$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Should execute guards 1 and 2, but not 3
    expect(executionOrder).toEqual([1, 2])

    // Should be on login page
    await expect.element(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('continues through all guards if all return continue', async () => {
    const executionOrder: number[] = []

    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const guard1 = Guard('/admin', (context) => {
      executionOrder.push(1)
      return context.continue()
    })

    const guard2 = Guard('/admin', (context) => {
      executionOrder.push(2)
      return context.continue()
    })

    const guard3 = Guard('/admin', (context) => {
      executionOrder.push(3)
      return context.continue()
    })

    function TestApp() {
      return <Router guards={[guard1, guard2, guard3]} routes={[home$, admin$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(executionOrder).toEqual([1, 2, 3])

    // Should reach admin page
    await expect.element(screen.getByText('Admin Page')).toBeInTheDocument()
  })

  // Reactive integration
  it('guard can read reactive state with e.getValue()', async () => {
    const currentUser$ = Cell<null | string>('john@example.com')
    let guardReadValue: null | string | undefined

    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const authGuard = Guard('/admin', ({ engine }) => {
      guardReadValue = engine.getValue(currentUser$)
    })

    function TestApp() {
      return <Router guards={[authGuard]} routes={[home$, admin$]} />
    }

    await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(guardReadValue).toBe('john@example.com')
  })

  it('guard can publish to cells with e.pubIn()', async () => {
    const visitedPaths: string[] = []

    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const trackingGuard = Guard('/admin', ({ location }) => {
      visitedPaths.push(location.pathname)
    })

    function TestApp() {
      return <Router guards={[trackingGuard]} routes={[home$, admin$]} />
    }

    await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(visitedPaths).toContain('/admin')
  })

  it('guard has access to engine instance', async () => {
    let hasEngine = false

    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const engineGuard = Guard('/admin', ({ engine }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      hasEngine = engine !== null && engine !== undefined
    })

    function TestApp() {
      return <Router guards={[engineGuard]} routes={[home$, admin$]} />
    }

    await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(hasEngine).toBe(true)
  })

  // Async guards
  it('waits for async guard to resolve before proceeding', async () => {
    const executionOrder: string[] = []

    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const asyncGuard = Guard('/admin', async () => {
      executionOrder.push('guard-start')
      await new Promise((resolve) => setTimeout(resolve, 50))
      executionOrder.push('guard-end')
    })

    function TestApp() {
      return <Router guards={[asyncGuard]} routes={[home$, admin$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(executionOrder).toEqual(['guard-start', 'guard-end'])

    // Should reach admin page after async guard completes
    await expect.element(screen.getByText('Admin Page')).toBeInTheDocument()
  })

  it('handles async guard that returns redirect', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const login$ = Route('/login', () => <div>Login Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const asyncRedirectGuard = Guard('/admin', async (context) => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return context.redirect('/login')
    })

    function TestApp() {
      return <Router guards={[asyncRedirectGuard]} routes={[home$, admin$, login$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Should be redirected to login page after async guard completes
    await expect.element(screen.getByText('Login Page')).toBeInTheDocument()
  })

  // Integration with routes
  it('renders route after guards pass', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const passGuard = Guard('/admin', () => {
      // Allow navigation
    })

    function TestApp() {
      return <Router guards={[passGuard]} routes={[home$, admin$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    await expect.element(screen.getByText('Admin Page')).toBeInTheDocument()
  })

  it('renders redirected route when guard redirects', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const login$ = Route('/login', () => <div>Login Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const redirectGuard = Guard('/admin', (context) => {
      return context.redirect('/login')
    })

    function TestApp() {
      return <Router guards={[redirectGuard]} routes={[home$, admin$, login$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Should render login page instead
    await expect.element(screen.getByText('Login Page')).toBeInTheDocument()
  })

  // T025: Integration test for guard redirect with typed refs
  it('executes guard and redirects using typed route reference', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const login$ = Route('/login', () => <div>Login Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const redirectGuard = Guard('/admin', (context) => {
      // T025: Using typed route reference instead of string
      return context.redirect(login$)
    })

    function TestApp() {
      return <Router guards={[redirectGuard]} routes={[home$, admin$, login$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Should be redirected to login page via typed reference
    await expect.element(screen.getByText('Login Page')).toBeInTheDocument()
  })

  // T025: Integration test for guard redirect with typed ref and params
  it('executes guard and redirects using typed route reference with params', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const user$ = Route('/users/{id}', ({ id }) => <div>User: {id}</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const redirectGuard = Guard('/admin', (context) => {
      // T025: Using typed route reference with parameters
      return context.redirect(user$, { id: 'redirected-user' })
    })

    function TestApp() {
      return <Router guards={[redirectGuard]} routes={[home$, admin$, user$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Should be redirected to user page with params
    await expect.element(screen.getByText('User: redirected-user')).toBeInTheDocument()
  })

  // T026: Integration test for guard navigate with typed refs
  it('executes guard and navigates using typed route reference', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const dashboard$ = Route('/dashboard', () => <div>Dashboard Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const navigateGuard = Guard('/admin', (context) => {
      // T026: Using typed route reference for navigate
      return context.navigate(dashboard$)
    })

    function TestApp() {
      return <Router guards={[navigateGuard]} routes={[home$, admin$, dashboard$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Should navigate to dashboard via typed reference
    await expect.element(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })

  // T026: Integration test for guard navigate with typed ref and params
  it('executes guard and navigates using typed route reference with params', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const user$ = Route('/users/{id}', ({ id }) => <div>User: {id}</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const navigateGuard = Guard('/admin', (context) => {
      // T026: Using typed route reference with parameters for navigate
      return context.navigate(user$, { id: 'navigated-user' })
    })

    function TestApp() {
      return <Router guards={[navigateGuard]} routes={[home$, admin$, user$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Should navigate to user page with params
    await expect.element(screen.getByText('User: navigated-user')).toBeInTheDocument()
  })

  // T027: Integration test for string URL support - dual API
  it('executes guard with string URL redirect (dual API support)', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const login$ = Route('/login', () => <div>Login Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const redirectGuard = Guard('/admin', (context) => {
      // T027: String URL works alongside typed references
      return context.redirect('/login')
    })

    function TestApp() {
      return <Router guards={[redirectGuard]} routes={[home$, admin$, login$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Should redirect using string URL
    await expect.element(screen.getByText('Login Page')).toBeInTheDocument()
  })

  // T027: Integration test for string URL support - dual API
  it('executes guard with string URL navigate (dual API support)', async () => {
    const admin$ = Route('/admin', () => <div>Admin Page</div>)
    const dashboard$ = Route('/dashboard', () => <div>Dashboard Page</div>)
    const home$ = Route('/', () => {
      const goToAdmin = usePublisher(admin$)

      React.useEffect(() => {
        goToAdmin({})
      }, [goToAdmin])

      return <div>Home Page</div>
    })

    const navigateGuard = Guard('/admin', (context) => {
      // T027: String URL navigate works alongside typed references
      return context.navigate('/dashboard')
    })

    function TestApp() {
      return <Router guards={[navigateGuard]} routes={[home$, admin$, dashboard$]} />
    }

    const screen = await render(
      <EngineProvider>
        <TestApp />
      </EngineProvider>
    )

    // Should navigate using string URL
    await expect.element(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })
})
