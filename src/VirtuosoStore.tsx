import {
  BehaviorSubject,
  combineLatest,
  concat,
  Observable,
  of,
  Subject,
} from 'rxjs';
import {
  auditTime,
  distinctUntilChanged,
  map,
  scan,
  withLatestFrom,
} from 'rxjs/operators';
import { Item, OffsetList } from './OffsetList';

export interface ItemHeight {
  index: number;
  size: number;
}

const getListTop = (items: Item[]) => (items.length > 0 ? items[0].offset : 0);

type MapToTotal = (input: [OffsetList, number]) => number;

const mapToTotal: MapToTotal = ([offsetList, totalCount]) =>
  offsetList.total(totalCount - 1);

type ListScanner = (
  overscan: number
) => (items: Item[], viewState: [number[], OffsetList]) => Item[];

const listScanner: ListScanner = overscan => (
  items,
  [
    [
      viewportHeight,
      scrollTop,
      topListHeight,
      listHeight,
      footerHeight,
      minIndex,
      totalCount,
    ],
    offsetList,
  ]
) => {
  const listTop = getListTop(items);

  const listBottom =
    listTop - scrollTop + listHeight - footerHeight - topListHeight;
  const maxIndex = Math.max(totalCount - 1, 0);

  if (listBottom < viewportHeight) {
    const startOffset = Math.max(scrollTop + topListHeight, topListHeight);
    const endOffset = scrollTop + viewportHeight + overscan * 2 - 1;
    return offsetList.range(startOffset, endOffset, minIndex, maxIndex);
  }

  if (listTop > scrollTop + topListHeight) {
    const startOffset = Math.max(
      scrollTop + topListHeight - overscan * 2,
      topListHeight
    );
    const endOffset = scrollTop + viewportHeight - 1;
    return offsetList.range(startOffset, endOffset, minIndex, maxIndex);
  }

  return items;
};

// TypeScript cannot figure out the scanner without seed here, hence the any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const offsetListScanner = (offsetList: any, itemHeight: any): any => {
  const { index, size } = itemHeight as ItemHeight;
  return (offsetList as OffsetList).insert(index, index, size);
};

const VirtuosoStore = (
  overscan: number,
  totalCount: number,
  topItems: number = 0
) => {
  const viewportHeight$ = new BehaviorSubject(0);
  const listHeight$ = new BehaviorSubject(0);
  const scrollTop$ = new BehaviorSubject(0);
  const footerHeight$ = new BehaviorSubject(0);
  const itemHeights$ = new Subject<ItemHeight>();
  const totalCount$ = new BehaviorSubject(totalCount);
  const topItemCount$ = new BehaviorSubject(topItems);

  const offsetList$: Observable<OffsetList> = concat(
    of(OffsetList.create()),
    itemHeights$
  ).pipe(scan(offsetListScanner));

  const totalListHeight$ = combineLatest(offsetList$, totalCount$).pipe(
    map(mapToTotal)
  );

  const totalHeight$ = combineLatest(totalListHeight$, footerHeight$).pipe(
    map(([totalListHeight, footerHeight]) => totalListHeight + footerHeight)
  );

  const topList$ = combineLatest(offsetList$, topItemCount$, totalCount$).pipe(
    map(([offsetList, topItemCount, totalCount]) => {
      const endIndex = Math.max(0, Math.min(topItemCount - 1, totalCount));
      return offsetList.indexRange(0, endIndex);
    })
  );

  const topListHeight$ = topList$.pipe(
    map(items => items.reduce((total, item) => total + item.size, 0)),
    distinctUntilChanged(),
    auditTime(0)
  );

  const list$: Observable<Item[]> = combineLatest(
    viewportHeight$,
    scrollTop$,
    topListHeight$,
    listHeight$,
    footerHeight$,
    topItemCount$,
    totalCount$
  ).pipe(
    withLatestFrom(offsetList$),
    scan(listScanner(overscan), []),
    distinctUntilChanged()
  );

  const biggestIndex$ = list$.pipe(
    map(items => (items.length ? items[items.length - 1].index : 0)),
    scan((prev, current) => Math.max(prev, current)),
    distinctUntilChanged()
  );

  const listOffset$ = combineLatest(list$, scrollTop$, topListHeight$).pipe(
    map(
      ([items, scrollTop, topListHeight]) =>
        getListTop(items) - scrollTop - topListHeight
    )
  );

  // topListHeight$.subscribe(val => console.log('top list height', val));

  return {
    // input
    totalCount$,
    footerHeight$,
    itemHeights$,
    listHeight$,
    scrollTop$,
    viewportHeight$,
    // output
    list$,
    listOffset$,
    totalHeight$,
    topList$,
    biggestIndex$,
  };
};

export { VirtuosoStore };
