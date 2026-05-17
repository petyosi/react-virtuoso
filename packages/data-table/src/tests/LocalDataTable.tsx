import React from 'react'

import { VirtuosoDataTable } from '../core/VirtuosoDataTable'
import { localModel } from '../model/local-model'

import type { VirtuosoDataTableProps } from '../interfaces'

export interface LocalDataTableProps<Data, Context, Group = never> extends Omit<VirtuosoDataTableProps<Data, Context, Group>, 'model'> {
  source: Data[] | { data: (Data | Group)[]; groups: { index: number; level: number }[] }
  groups?: { index: number; level: number }[]
}

export function LocalDataTable<Data, Context = unknown, Group = never>({
  source,
  groups,
  ...props
}: LocalDataTableProps<Data, Context, Group>) {
  const sourceData = Array.isArray(source) ? source : source.data
  const sourceGroups = Array.isArray(source) ? groups : source.groups
  const model = React.useMemo(
    () => localModel<Data, Group>({ data: sourceData as Data[], ...(sourceGroups === undefined ? {} : { groups: sourceGroups }) }),
    [sourceData, sourceGroups]
  )
  React.useEffect(() => {
    model.setData?.(sourceData as Data[], sourceGroups)
  }, [sourceData, sourceGroups, model])

  return <VirtuosoDataTable {...props} model={model} />
}
