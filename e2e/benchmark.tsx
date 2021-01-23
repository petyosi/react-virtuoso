import * as React from 'react'
import { Virtuoso } from '../src'

const CONTENT = {
  0: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum nec lorem eu turpis maximus rutrum. Nullam pellentesque elementum iaculis. Phasellus interdum ultricies sodales. Morbi vehicula aliquet ligula, malesuada tempus nunc. Integer viverra nunc ac augue luctus pretium. ',
  1: 'Morbi et suscipit nulla. Suspendisse bibendum et ligula at ullamcorper. Praesent vehicula ut velit a commodo. In sed felis sodales, efficitur sem non, sollicitudin lorem. Fusce tempus risus lacus, a finibus ligula volutpat in. Nunc tempus nulla ut enim imperdiet, ac volutpat sem tempor. Proin hendrerit fringilla lacinia. Vivamus dignissim ultricies congue. Duis purus dui, pharetra in enim vitae, dictum accumsan nisl. Sed ornare justo eu varius facilisis.',
  2: 'Cras vel augue at lorem congue tempus. Donec convallis leo neque, eu convallis mauris pulvinar et. ',
}

const itemContent = (index: number) => <div style={{ borderBottom: '1px solid black', padding: '1rem' }}>{CONTENT[index % 3]}</div>

export default function App() {
  return <Virtuoso totalCount={100000} initialTopMostItemIndex={99999} itemContent={itemContent} />
}
