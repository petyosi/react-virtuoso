import type { RouteParams } from '@virtuoso.dev/reactive-engine-router'

export const UserPage: React.ComponentType<RouteParams<'/users/{userId:number}'>> = ({ userId }) => (
  <div style={{ padding: '20px' }}>
    <h2>User Profile</h2>
    <p>User ID: {userId}</p>
  </div>
)
