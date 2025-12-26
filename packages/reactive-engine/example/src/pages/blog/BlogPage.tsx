import type { RouteParams } from '../../../../src/'

export const BlogPage: React.ComponentType<RouteParams<'/blog/{slug}/?category={category}&tag={tag?}'>> = ({
  slug,
  $search,
}) => (
  <div style={{ padding: '20px' }}>
    <h2>Blog Post</h2>
    <p>Slug: {slug}</p>
    <p>Category: {$search.category}</p>
    {$search.tag && <p>Tag: {$search.tag}</p>}
  </div>
)
