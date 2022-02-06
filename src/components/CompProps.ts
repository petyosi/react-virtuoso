import { ForwardRefExoticComponent } from 'react'

export type CompProps<T> = T extends ForwardRefExoticComponent<infer R> ? R : never
