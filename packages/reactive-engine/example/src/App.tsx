import { Suspense } from 'react'

import { EngineProvider, Layout, Router, usePublisher } from '../../src/'
import { notFound$ } from './pages/404'
import { about$ } from './pages/about'
import { blog$ } from './pages/blog'
import { guarded$, theGuard$ } from './pages/guarded'
import { home$ } from './pages/home'
import { user$ } from './pages/users'

// Define layouts
const rootLayout = Layout('/', ({ children }) => (
  <div>
    <Navigation />
    <div style={{ border: '2px solid #333', minHeight: '80vh' }}>
      <header style={{ background: '#333', color: 'white', padding: '20px' }}>
        <h1>Reactive Router Demo</h1>
      </header>
      <main>
        <Suspense fallback={<div style={{ padding: '20px' }}>Loading content...</div>}>{children}</Suspense>
      </main>
      <footer style={{ background: '#f5f5f5', marginTop: '40px', padding: '20px' }}>
        <p>© 2025 Reactive Engine</p>
      </footer>
    </div>
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

function Navigation() {
  const goToHome = usePublisher(home$)
  const goToAbout = usePublisher(about$)
  const goToUser = usePublisher(user$)
  const goToBlog = usePublisher(blog$)
  const goToNotFound = usePublisher(notFound$)
  const goToGuarded = usePublisher(guarded$)

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
            goToBlog({ slug: 'hello-world', $search: { category: 'tech' } })
          }}
        >
          Blog Post (Tech)
        </button>
        <button
          onClick={() => {
            goToBlog({ slug: 'react-router', $search: { category: 'tutorial', tag: 'react' } })
          }}
        >
          Blog Post (Tutorial)
        </button>
        <button
          onClick={() => {
            goToGuarded({ userId: 768 })
          }}
        >
          Guarded Page, 768
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
      <Router layouts={[rootLayout, blogLayout]} routes={[home$, about$, user$, blog$, guarded$, notFound$]} guards={[theGuard$]} />
    </EngineProvider>
  )
}
