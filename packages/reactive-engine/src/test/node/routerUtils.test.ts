import { describe, expect, it } from 'vitest'

import { matchesPathPrefix, matchGuardPattern } from '../../router/utils'

describe('matchesPathPrefix', () => {
  it('root path "/" matches everything', () => {
    expect(matchesPathPrefix('/admin', '/')).toBe(true)
    expect(matchesPathPrefix('/admin/users', '/')).toBe(true)
    expect(matchesPathPrefix('/users', '/')).toBe(true)
    expect(matchesPathPrefix('/', '/')).toBe(true)
  })

  it('exact path match', () => {
    expect(matchesPathPrefix('/admin', '/admin')).toBe(true)
    expect(matchesPathPrefix('/users', '/users')).toBe(true)
    expect(matchesPathPrefix('/admin/settings', '/admin/settings')).toBe(true)
  })

  it('prefix match with trailing segments', () => {
    expect(matchesPathPrefix('/admin/users', '/admin')).toBe(true)
    expect(matchesPathPrefix('/admin/users/123', '/admin')).toBe(true)
    expect(matchesPathPrefix('/admin/settings/profile', '/admin/settings')).toBe(true)
  })

  it('does not match when path is not a prefix', () => {
    expect(matchesPathPrefix('/users', '/admin')).toBe(false)
    expect(matchesPathPrefix('/administrator', '/admin')).toBe(false)
    expect(matchesPathPrefix('/admin-panel', '/admin')).toBe(false)
  })

  it('does not match partial segments', () => {
    // '/admin' should not match '/administrator' (not a real prefix)
    expect(matchesPathPrefix('/administrator', '/admin')).toBe(false)
    // '/user' should not match '/users/123'
    expect(matchesPathPrefix('/user', '/users')).toBe(false)
  })
})

describe('matchGuardPattern', () => {
  describe('simple path prefix matching', () => {
    it('matches exact path', () => {
      const result = matchGuardPattern('/guarded', '/guarded')
      expect(result).not.toBeNull()
      expect(result).toEqual({})
    })

    it('matches path with a slash', () => {
      const result = matchGuardPattern('/guarded/768', '/guarded/')
      expect(result).not.toBeNull()
      expect(result).toEqual({})
    })

    it('matches path with trailing segments', () => {
      const result = matchGuardPattern('/guarded/768', '/guarded')
      expect(result).not.toBeNull()
      expect(result).toEqual({})
    })

    it('matches path with multiple trailing segments', () => {
      const result = matchGuardPattern('/guarded/768/edit', '/guarded')
      expect(result).not.toBeNull()
      expect(result).toEqual({})
    })

    it('matches path with trailing slash', () => {
      const result = matchGuardPattern('/guarded/', '/guarded')
      expect(result).not.toBeNull()
      expect(result).toEqual({})
    })

    it('does not match different paths', () => {
      expect(matchGuardPattern('/users', '/guarded')).toBeNull()
      expect(matchGuardPattern('/guardedian', '/guarded')).toBeNull()
    })

    it('matches root path against all URLs', () => {
      expect(matchGuardPattern('/admin', '/')).not.toBeNull()
      expect(matchGuardPattern('/users', '/')).not.toBeNull()
      expect(matchGuardPattern('/any/path', '/')).not.toBeNull()
    })

    it('matches nested paths', () => {
      const result = matchGuardPattern('/admin/users/123', '/admin/users')
      expect(result).not.toBeNull()
      expect(result).toEqual({})
    })
  })

  describe('parameterized pattern matching', () => {
    it('matches pattern with string parameter', () => {
      const result = matchGuardPattern('/users/john', '/users/{id}')
      expect(result).not.toBeNull()
      expect(result).toEqual({ id: 'john' })
    })

    it('matches pattern with number parameter', () => {
      const result = matchGuardPattern('/users/123', '/users/{id:number}')
      expect(result).not.toBeNull()
      expect(result).toEqual({ id: 123 })
    })

    it('does not match parameterized pattern with extra segments', () => {
      // Parameterized patterns use exact matching
      const result = matchGuardPattern('/users/123/edit', '/users/{id:number}')
      expect(result).toBeNull()
    })

    it('matches pattern with multiple parameters', () => {
      const result = matchGuardPattern('/users/123/posts/456', '/users/{userId:number}/posts/{postId:number}')
      expect(result).not.toBeNull()
      expect(result).toEqual({ postId: 456, userId: 123 })
    })
  })

  describe('wildcard pattern matching', () => {
    it('matches wildcard pattern', () => {
      const result = matchGuardPattern('/admin/users', '/admin/{*rest}')
      expect(result).not.toBeNull()
      expect(result).toEqual({ rest: ['users'] })
    })

    it('matches wildcard pattern with multiple segments', () => {
      const result = matchGuardPattern('/admin/users/123/edit', '/admin/{*rest}')
      expect(result).not.toBeNull()
      expect(result).toEqual({ rest: ['users', '123', 'edit'] })
    })

    it('matches wildcard at root', () => {
      const result = matchGuardPattern('/any/path/here', '/{*rest}')
      expect(result).not.toBeNull()
      expect(result).toEqual({ rest: ['any', 'path', 'here'] })
    })
  })

  describe('query parameter handling', () => {
    it('matches simple path with query string', () => {
      const result = matchGuardPattern('/guarded?tab=settings', '/guarded')
      expect(result).not.toBeNull()
      expect(result).toEqual({})
    })

    it('matches path with trailing segments and query string', () => {
      const result = matchGuardPattern('/guarded/768?edit=true', '/guarded')
      expect(result).not.toBeNull()
      expect(result).toEqual({})
    })

    it('matches parameterized pattern with query string', () => {
      const result = matchGuardPattern('/users/123?view=profile', '/users/{id:number}')
      expect(result).not.toBeNull()
      expect(result).toEqual({ id: 123 })
    })

    it('parses query parameters when pattern includes query template', () => {
      const result = matchGuardPattern('/users?page=2', '/users?page={page:number}')
      expect(result).not.toBeNull()
      expect(result).toEqual({ $search: { page: 2 } })
    })
  })

  describe('edge cases', () => {
    it('handles empty path segments correctly', () => {
      expect(matchGuardPattern('//', '/')).not.toBeNull()
    })

    it('handles paths with special characters', () => {
      const result = matchGuardPattern('/users/john-doe', '/users/{id}')
      expect(result).not.toBeNull()
      expect(result).toEqual({ id: 'john-doe' })
    })

    it('differentiates between prefix and exact match for parameterized patterns', () => {
      // Simple path: uses prefix matching
      const prefixResult = matchGuardPattern('/admin/users', '/admin')
      expect(prefixResult).not.toBeNull()

      // Parameterized path: uses exact matching
      const exactResult = matchGuardPattern('/admin/users', '/admin/{section}')
      expect(exactResult).not.toBeNull()
      expect(exactResult).toEqual({ section: 'users' })

      // Should not match with extra segments
      const noMatchResult = matchGuardPattern('/admin/users/123', '/admin/{section}')
      expect(noMatchResult).toBeNull()
    })
  })
})
