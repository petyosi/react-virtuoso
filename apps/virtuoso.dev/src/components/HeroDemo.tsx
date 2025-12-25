import { Virtuoso } from 'react-virtuoso'

export default function HeroDemo() {
  return (
    <div className="not-content h-96 w-full">
      <Virtuoso
        className={`
          h-96 border border-gray-300 bg-gray-100
          dark:border-gray-700 dark:bg-gray-800
        `}
        itemContent={(index) => (
          <div
            className={`
              border-b border-gray-300 px-5 py-4 text-sm
              dark:border-gray-700
            `}
          >
            Item {index}
          </div>
        )}
        totalCount={1000}
      />
    </div>
  )
}
