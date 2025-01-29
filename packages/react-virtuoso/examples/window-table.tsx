import { TableVirtuoso } from '../src/'

export function Example() {
  return (
    <div style={{ paddingBottom: 100, paddingTop: 100 }}>
      <p>red background should match the size of the table</p>
      <div style={{ background: 'red' }}>
        <TableVirtuoso
          components={{
            EmptyPlaceholder: () => {
              return (
                <tbody>
                  <tr>
                    <td>Empty</td>
                  </tr>
                </tbody>
              )
            },
          }}
          fixedHeaderContent={() => {
            return (
              <tr style={{ background: 'white' }}>
                <th key={1} style={{ background: 'white', border: '1px solid black', height: 50 }}>
                  TH 1
                </th>
                <th key={2} style={{ background: 'white', border: '1px solid black', height: 50 }}>
                  TH meh
                </th>
              </tr>
            )
          }}
          itemContent={(index) => {
            return (
              <>
                <td style={{ height: 30 }}>{index}Cell 1</td>
                <td>Cell 2</td>
              </>
            )
          }}
          totalCount={100}
          useWindowScroll
        />
      </div>
    </div>
  )
}
