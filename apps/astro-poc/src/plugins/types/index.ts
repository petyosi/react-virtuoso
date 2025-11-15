// @index// @index(['./*.ts', './!(private|parts|functions)*/index.ts'], f => `export * from '${f.path.replace(/\/index$/, '')}';`)
export * from './RemarkPlugin'
export * from './VFile'
