export { createCookieStorageAdapter, createLocalStorageAdapter, createMemoryStorageAdapter, createSessionStorageAdapter } from './adapters'
export { linkCellToStorage } from './storageLink'
export type {
  AdapterStorageLinkOptions,
  CookieOptions,
  StorageAdapter,
  StorageAdapterFailure,
  StorageAdapterOperation,
  StorageLinkOptions,
  StorageRemovalPolicy,
  StoredValue,
} from './storageLink'
