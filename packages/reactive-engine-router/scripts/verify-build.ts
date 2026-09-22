/// <reference types="node" />

// oxlint-disable-next-line import/no-nodejs-modules -- build verification intentionally runs in Node.js
import { readFile } from 'node:fs/promises'

const output = await readFile(new URL('../dist/index.js', import.meta.url), 'utf8')

if (!output.includes('from "@virtuoso.dev/reactive-engine-react"')) {
  throw new Error('The router build must import the shared reactive-engine React adapter')
}

if (output.includes('createContext(')) {
  throw new Error('The router build must not bundle a private React engine context')
}
