// oxlint-disable typescript/strict-boolean-expressions, typescript/no-unsafe-argument, typescript/no-unsafe-call -- untyped JavaScript fixture for distWarning.test.ts
// Stands in for tiny-invariant, which reads process.env.NODE_ENV when it loads, so the no-replacement bundle in
// distWarning.test.ts checks only this package's own development check.
export default function invariant(condition, message) {
  if (!condition) {
    throw new Error(typeof message === 'function' ? message() : message)
  }
}
