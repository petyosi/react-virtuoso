import tseslint from 'typescript-eslint'

declare const defaultExport: ReturnType<typeof tseslint.config>
export default defaultExport
