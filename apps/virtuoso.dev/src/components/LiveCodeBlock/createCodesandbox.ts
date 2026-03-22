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
      content: `
<!DOCTYPE html>
<html>
  <head>
    <title>Dynamic Sandbox</title>
  </head>
  <body>
    <div id="root" style="height: 400px"></div>
  </body>
</html>
        `,
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
