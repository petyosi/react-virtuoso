import { ForwardRefExoticComponent } from 'react'
import { TableVirtuosoProps, GroupedVirtuosoProps, VirtuosoGridProps, VirtuosoProps } from '../src/components'
import { List } from '../src/List'
import { Grid } from '../src/Grid'
import { Table } from '../src/Table'

type CompProps<T> = T extends ForwardRefExoticComponent<infer R> ? R : never
type ListProps = Omit<CompProps<typeof List>, 'groupCounts' | 'groupContent' | 'itemsRendered'>

interface GroupedListProps
  extends Omit<ListProps, 'totalCount' | 'itemContent'>,
    Pick<CompProps<typeof List>, 'groupCounts' | 'groupContent'> {}
type GridProps = CompProps<typeof Grid>
type TableProps = CompProps<typeof Table>

function typeCheckCast(arg: any) {
  void arg
}

describe('public interfaces', () => {
  it('works as expected', () => {
    const listProps: VirtuosoProps<any, any> = {}
    const groupedListProps: GroupedVirtuosoProps<any, any> = {}
    const gridProps: VirtuosoGridProps<any> = { totalCount: 100 }
    const tableProps: TableVirtuosoProps<any, any> = {}

    typeCheckCast(listProps as ListProps)
    typeCheckCast(groupedListProps as GroupedListProps)
    typeCheckCast(gridProps as GridProps)
    typeCheckCast(tableProps as TableProps)

    expect(true).toBeTruthy()
  })
})
