// @index// @index(['./*.ts', './!(private|parts|functions)*/index.ts'], f => `export * from '${f.path.replace(/\/index$/, '')}';`)
export type * from './RemarkPlugin'
export type * from './VFile'
