export interface List {
  id: string
  name: string
}

export interface Task {
  id: number
  listId: List['id']
  description: string
  done: boolean
}
