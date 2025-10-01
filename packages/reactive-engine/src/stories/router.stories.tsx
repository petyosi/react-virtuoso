import * as React from 'react'

import { EngineProvider, usePublisher } from '../react'
import { Layout } from '../router/Layout'
import { Route } from '../router/Route'
import { Router } from '../router/Router'
import { RouterEngine } from '../router/RouterEngine'

// Define routes
const home$ = Route('/', () => (
  <div style={{ padding: '20px' }}>
    <h2>Home Page</h2>
    <p>Welcome to the reactive router demo!</p>
  </div>
))

const about$ = Route('/about', () => (
  <div style={{ padding: '20px' }}>
    <h2>About Page</h2>
    <p>This is a demonstration of the reactive router with browser history integration.</p>
  </div>
))

const user$ = Route('/users/{userId:number}', ({ pathParams }) => (
  <div style={{ padding: '20px' }}>
    <h2>User Profile</h2>
    <p>User ID: {pathParams.userId}</p>
  </div>
))

const blog$ = Route('/blog/{slug}/?category={category}&tag={tag?}', ({ pathParams, queryParams }) => (
  <div style={{ padding: '20px' }}>
    <h2>Blog Post</h2>
    <p>Slug: {pathParams.slug}</p>
    <p>Category: {queryParams.category}</p>
    {queryParams.tag && <p>Tag: {queryParams.tag}</p>}
  </div>
))

const notFound$ = Route('/404', () => (
  <div style={{ color: 'red', padding: '20px' }}>
    <h2>404 - Page Not Found</h2>
    <p>The page you are looking for does not exist.</p>
  </div>
))

// Define layouts
const rootLayout = Layout('/', ({ children }) => (
  <div style={{ border: '2px solid #333', minHeight: '100vh' }}>
    <header style={{ background: '#333', color: 'white', padding: '20px' }}>
      <h1>Reactive Router Demo</h1>
    </header>
    <main>{children}</main>
    <footer style={{ background: '#f5f5f5', marginTop: '40px', padding: '20px' }}>
      <p>© 2025 Reactive Engine</p>
    </footer>
  </div>
))

const blogLayout = Layout('/blog', ({ children }) => (
  <div style={{ background: '#f9f9f9', margin: '20px', padding: '20px' }}>
    <nav style={{ background: 'white', marginBottom: '20px', padding: '10px' }}>
      <strong>Blog Navigation</strong>
    </nav>
    {children}
  </div>
))

// Create router
const router = RouterEngine([home$, about$, user$, blog$, notFound$], [rootLayout, blogLayout])

function Navigation() {
  const goToHome = usePublisher(home$)
  const goToAbout = usePublisher(about$)
  const goToUser = usePublisher(user$)
  const goToBlog = usePublisher(blog$)
  const goToNotFound = usePublisher(notFound$)

  return (
    <nav style={{ background: '#f0f0f0', margin: '0', padding: '15px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={() => {
            goToHome({})
          }}
        >
          Home
        </button>
        <button
          onClick={() => {
            goToAbout({})
          }}
        >
          About
        </button>
        <button
          onClick={() => {
            goToUser({ userId: 123 })
          }}
        >
          User 123
        </button>
        <button
          onClick={() => {
            goToUser({ userId: 456 })
          }}
        >
          User 456
        </button>
        <button
          onClick={() => {
            goToBlog([{ slug: 'hello-world' }, { category: 'tech' }])
          }}
        >
          Blog Post (Tech)
        </button>
        <button
          onClick={() => {
            goToBlog([{ slug: 'react-router' }, { category: 'tutorial', tag: 'react' }])
          }}
        >
          Blog Post (Tutorial)
        </button>
        <button
          onClick={() => {
            goToNotFound({})
          }}
        >
          404 Page
        </button>
      </div>
    </nav>
  )
}

export function BasicRouter() {
  return (
    <EngineProvider>
      <Navigation />
      <Router router={router} />
    </EngineProvider>
  )
}

function RouterWithoutHistoryInner() {
  const goToHome = usePublisher(home$)

  React.useEffect(() => {
    goToHome({})
  }, [goToHome])

  return (
    <div>
      <div style={{ background: '#fff3cd', border: '1px solid #ffc107', margin: '10px', padding: '10px' }}>
        <strong>Note:</strong> This story does not sync with browser history. Use the &ldquo;Basic Router&rdquo; story for full history
        integration.
      </div>
      <Navigation />
      <Router router={router} useBrowserHistory={false} />
    </div>
  )
}

export function RouterWithoutHistory() {
  return (
    <EngineProvider>
      <RouterWithoutHistoryInner />
    </EngineProvider>
  )
}

const deepLayout1 = Layout('/deep', ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: '#e3f2fd', margin: '20px', padding: '20px' }}>
    <h3>Deep Layout 1</h3>
    {children}
  </div>
))

const deepLayout2 = Layout('/deep/nested', ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: '#fff3e0', margin: '20px', padding: '20px' }}>
    <h4>Deep Layout 2</h4>
    {children}
  </div>
))

const deep$ = Route('/deep/nested/page', () => (
  <div style={{ background: 'white', padding: '20px' }}>
    <h5>Deeply Nested Page</h5>
    <p>This page is wrapped by 3 layouts: Root → Deep 1 → Deep 2</p>
  </div>
))

const deepRouter = RouterEngine([deep$, home$], [rootLayout, deepLayout1, deepLayout2])

function RouterWithNestedLayoutsInner() {
  const goToDeep = usePublisher(deep$)

  React.useEffect(() => {
    goToDeep({})
  }, [goToDeep])

  return (
    <div>
      <div style={{ background: '#e8f5e9', border: '1px solid #4caf50', margin: '10px', padding: '10px' }}>
        <strong>Nested Layouts Demo:</strong> This page demonstrates multiple nested layouts wrapping a route component.
      </div>
      <Router router={deepRouter} useBrowserHistory={false} />
    </div>
  )
}

export function RouterWithNestedLayouts() {
  return (
    <EngineProvider>
      <RouterWithNestedLayoutsInner />
    </EngineProvider>
  )
}

export default {
  title: 'Router',
}
