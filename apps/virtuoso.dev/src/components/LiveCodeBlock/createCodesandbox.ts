import { localFiles } from './extraImports'

interface CodeSandboxResponse {
  sandbox_id: string
}

function escapeRegExp(value: string) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}

function dirname(path: string) {
  const parts = path.split('/')
  parts.pop()
  return parts
}

function toRelativeImport(fromPath: string, toPath: string) {
  const fromParts = dirname(fromPath)
  const toParts = toPath.split('/')

  while (fromParts.length > 0 && toParts.length > 0 && fromParts[0] === toParts[0]) {
    fromParts.shift()
    toParts.shift()
  }

  const relativeParts = [...Array.from({ length: fromParts.length }, () => '..'), ...toParts]
  const joined = relativeParts.join('/').replace(/\.(tsx|ts|jsx|js)$/, '')

  return joined.startsWith('.') ? joined : `./${joined}`
}

function rewriteLocalImports(code: string, fromPath: string) {
  let rewritten = code

  for (const [specifier, localFile] of Object.entries(localFiles)) {
    const replacement = toRelativeImport(fromPath, localFile.sandboxPath)
    const pattern = new RegExp(`(['"])${escapeRegExp(specifier)}\\1`, 'g')
    rewritten = rewritten.replace(pattern, `$1${replacement}$1`)
  }

  return rewritten
}

function resolveLocalFiles(packages: string[]) {
  const resolvedFiles = new Map<string, (typeof localFiles)[string]>()
  const resolvedPackages = new Set<string>()
  const queue = packages.filter((pkg) => pkg.startsWith('@/'))

  while (queue.length > 0) {
    const specifier = queue.shift()!
    const localFile = localFiles[specifier]

    if (localFile === undefined || resolvedFiles.has(specifier)) {
      continue
    }

    resolvedFiles.set(specifier, localFile)
    localFile.dependencies.forEach((dependency) => resolvedPackages.add(dependency))
    localFile.imports?.forEach((importSpecifier) => {
      if (importSpecifier.startsWith('@/')) {
        queue.push(importSpecifier)
      } else {
        resolvedPackages.add(importSpecifier)
      }
    })
  }

  if (resolvedFiles.size > 0) {
    resolvedPackages.add('tailwindcss')
  }

  return {
    files: [...resolvedFiles.values()],
    packages: [...resolvedPackages],
  }
}

export async function createSandbox(files: Record<string, string>, packages: string[]) {
  const externalPackages = packages.filter((pkg) => !pkg.startsWith('@/'))
  const { files: resolvedLocalFiles, packages: localPackages } = resolveLocalFiles(packages)
  const sandboxDependencies = [...new Set([...externalPackages, ...localPackages])]
  const sandboxDependencyVersions = Object.fromEntries(sandboxDependencies.map((pkg) => [pkg, 'latest']))
  const sandboxFiles: Record<string, { content: string }> = {
    'package.json': {
      content: JSON.stringify(
        {
          browserslist: ['>0.2%', 'not dead', 'not ie <= 11', 'not op_mini all'],
          dependencies: {
            'loader-utils': '3.2.1',
            react: '18.2.0',
            'react-dom': '18.2.0',
            'react-scripts': '5.0.1',
            ...sandboxDependencyVersions,
          },
          description: 'An example forked from the docs of https://virtuoso.dev/',
          devDependencies: {
            '@types/react': '18.2.38',
            '@types/react-dom': '18.2.15',
            typescript: '4.4.4',
          },
          keywords: ['typescript', 'react', 'starter', 'react-virtuoso'],
          main: 'src/index.tsx',
          name: 'react-virtuoso-example',
          scripts: {
            build: 'react-scripts build',
            eject: 'react-scripts eject',
            start: 'react-scripts start',
          },
          version: '1.0.0',
        },
        null,
        2
      ),
    },
    'public/index.html': {
      content: `<!DOCTYPE html>
<html>
  <head>
    <title>Dynamic Sandbox</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      :root {
        --radius: 0.625rem;
        --background: oklch(1 0 0);
        --foreground: oklch(0.145 0 0);
        --card: oklch(1 0 0);
        --card-foreground: oklch(0.145 0 0);
        --popover: oklch(1 0 0);
        --popover-foreground: oklch(0.145 0 0);
        --primary: oklch(0.205 0 0);
        --primary-foreground: oklch(0.985 0 0);
        --secondary: oklch(0.97 0 0);
        --secondary-foreground: oklch(0.205 0 0);
        --muted: oklch(0.97 0 0);
        --muted-foreground: oklch(0.556 0 0);
        --accent: oklch(0.97 0 0);
        --accent-foreground: oklch(0.205 0 0);
        --destructive: oklch(0.577 0.245 27.325);
        --border: oklch(0.922 0 0);
        --input: oklch(0.922 0 0);
        --ring: oklch(0.708 0 0);
      }
    </style>
  </head>
  <body>
    <div id="root" style="height: 400px"></div>
  </body>
</html>`,
    },
    'src/index.tsx': {
      content: `
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root")!;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    },
    'tsconfig.json': {
      content: `
{
    "include": [
        "./src/**/*"
    ],
    "compilerOptions": {
        "baseUrl": ".",
        "strict": true,
        "esModuleInterop": true,
        "lib": [
            "dom",
            "es2015"
        ],
        "jsx": "react-jsx",
        "paths": {
            "@/*": ["src/*"]
        }
    }
}`,
    },
  }

  for (const [fileName, fileCode] of Object.entries(files)) {
    const sandboxPath = `src/${fileName}`
    sandboxFiles[sandboxPath] = { content: rewriteLocalImports(fileCode, sandboxPath) }
  }

  for (const localFile of resolvedLocalFiles) {
    sandboxFiles[localFile.sandboxPath] = { content: rewriteLocalImports(localFile.content, localFile.sandboxPath) }
  }

  try {
    const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
      body: JSON.stringify({
        files: sandboxFiles,
        template: 'react-ts',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
    const data = (await response.json()) as CodeSandboxResponse

    const sandboxUrl = `https://codesandbox.io/s/${data.sandbox_id}`
    window.open(sandboxUrl)
  } catch (error) {
    console.error('Error creating sandbox:', error)
  }
}
