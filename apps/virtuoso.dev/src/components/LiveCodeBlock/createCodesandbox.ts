interface CodeSandboxResponse {
  sandbox_id: string
}

export async function createSandbox(files: Record<string, string>, packages: string[]) {
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
            ...packages.reduce((acc, pkg) => ({ ...acc, [pkg]: 'latest' }), {}),
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
        "strict": true,
        "esModuleInterop": true,
        "lib": [
            "dom",
            "es2015"
        ],
        "jsx": "react-jsx"
    }
}`,
    },
  }

  for (const [fileName, fileCode] of Object.entries(files)) {
    sandboxFiles[`src/${fileName}`] = { content: fileCode }
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
