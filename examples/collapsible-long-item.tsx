import * as React from 'react'
import { Virtuoso } from '../src'

const Expanded = React.createContext([
  false,
  (_val: boolean) => {
    void _val
  },
] as const)

const Item = ({ index }: { index: number }) => {
  const [expanded, setExpanded] = React.useContext(Expanded)

  return (
    <div style={{ border: '1px solid black', height: index === 90 && !expanded ? 600 : 100, display: 'flex', flexDirection: 'row' }}>
      <div style={{ flex: 1 }}>Item {index}</div>
      <button
        onClick={() => {
          setExpanded(!expanded)
        }}
      >
        Toggle
      </button>
    </div>
  )
}

const ExpandedProvider: React.FC = ({ children }) => {
  const [expanded, setExpanded] = React.useState(false)
  return <Expanded.Provider value={[expanded as any, setExpanded]}>{children}</Expanded.Provider>
}

export default function App() {
  return (
    <ExpandedProvider>
      <Virtuoso
        initialTopMostItemIndex={99}
        followOutput={true}
        totalCount={100}
        itemContent={(index) => <Item index={index} />}
        style={{ height: 600 }}
      />
    </ExpandedProvider>
  )
}
