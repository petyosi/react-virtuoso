import { Virtuoso } from '../src'

const itemContent = (index: number) => <div style={{ background: 'white', height: index % 2 ? 30 : 20 }}>Item {index}</div>

export function App() {
  const data = Array(50)
    .fill(undefined)
    .map((_, i) => i)

  return (
    <div className="App">
      <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
        {Array(20)
          .fill(undefined)
          .map((_, i) => (
            <Virtuoso
              data={data}
              //initialScrollTop={200}
              initialTopMostItemIndex={5}
              itemContent={(_, i) => <div style={{ backgroundColor: i == 0 ? 'red' : 'transparent' }}>{i}</div>}
              key={i}
              style={{
                border: '2px black solid',
                flex: 1,
                height: 400,
              }}
            />
          ))}
      </div>
    </div>
  )
}

export function Example() {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', height: 400 }}>
        {Array.from({ length: 30 }).map((_, key) => {
          return (
            <Virtuoso
              initialTopMostItemIndex={20}
              itemContent={itemContent}
              key={key}
              style={{ flex: 1, fontSize: '7px', height: 300, minWidth: '3rem' }}
              totalCount={100}
            />
          )
        })}
      </div>
    </>
  )
}
