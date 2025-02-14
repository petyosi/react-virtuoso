export async function createSandbox(appCode: string) {
  // Define your sandbox configuration
  const sandboxConfig = {
    files: {
      'src/App.tsx': {
        content: appCode
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
`

      },
      'package.json': {
        content: JSON.stringify({
          "name": "react-virtuoso-example",
          "version": "1.0.0",
          "description": "An example forked from the docs of https://virtuoso.dev/",
          "keywords": [
            "typescript",
            "react",
            "starter",
            "react-virtuoso"
          ],
          "main": "src/index.tsx",
          "dependencies": {
            "loader-utils": "3.2.1",
            "react": "18.2.0",
            "react-dom": "18.2.0",
            "react-scripts": "5.0.1",
            "react-virtuoso": "latest"
          },
          "devDependencies": {
            "@types/react": "18.2.38",
            "@types/react-dom": "18.2.15",
            "typescript": "4.4.4"
          },
          "scripts": {
            "start": "react-scripts start",
            "build": "react-scripts build",
            "eject": "react-scripts eject"
          },
          "browserslist": [
            ">0.2%",
            "not dead",
            "not ie <= 11",
            "not op_mini all"
          ]
        }, null, 2)
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
        `
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
}`
      }
    },
    template: "react-ts"
  };

  try {
    // Make the fetch request to the CodeSandbox API
    const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: sandboxConfig.files,
        template: sandboxConfig.template
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Construct the sandbox URL from the returned sandbox ID
    const sandboxUrl = `https://codesandbox.io/s/${data.sandbox_id}`;
    window.open(sandboxUrl)

  } catch (error) {
    console.error('Error creating sandbox:', error);
  }
};
