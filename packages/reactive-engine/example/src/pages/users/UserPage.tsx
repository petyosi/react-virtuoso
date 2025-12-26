import type { RouteParams } from '../../../../src/'

export const UserPage: React.ComponentType<RouteParams<'/users/{userId:number}'>> = ({ userId }) => (
  <div style={{ padding: '20px' }}>
    <h2>User Profile</h2>
    <p>User ID: {userId}</p>
  </div>
)
