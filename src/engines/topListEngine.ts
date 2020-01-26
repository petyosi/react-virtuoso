import { subject, map } from '../tinyrx'
import { ListItem } from '../GroupIndexTransposer'

export function topListEngine() {
  const topList$ = subject<ListItem[]>([])

  const topListHeight$ = topList$.pipe(map(items => items.reduce((total, item) => total + item.size, 0)))

  const minListIndex$ = topList$.pipe(
    map(topList => {
      return topList.length && topList[topList.length - 1].index + 1
    })
  )

  return {
    topList$,
    topListHeight$,
    minListIndex$,
  }
}
