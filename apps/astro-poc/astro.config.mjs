// @ts-check

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import initAstroTypedoc from "./src/plugins/astro-typedoc";
import { autoImports } from "./src/plugins/auto-imports";
import { remarkLiveCode } from "./src/plugins/remark-live-code";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://github.com/andrezero/andretorgal-site/blob/main/src/integration/remark/autoImports.ts#L45
//
const autoImportFile = resolve("./autoImports.ts");

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    mdx({
      remarkPlugins: [
        remarkLiveCode,
        // @ts-expect-error - Custom plugin type doesn't match unified Plugin type exactly
        [autoImports, { autoImportFile }],
      ],
    }),
    await initAstroTypedoc({
      baseUrl: "/api/",
      entryPoints: [
        {
          path: resolve(__dirname, "./example/index.ts"),
        },
      ],
      tsconfig: resolve(__dirname, "./example/tsconfig.json"),
      frontmatter: {
        layout: resolve(__dirname, "./src/layouts/DocLayout.astro"),
      },
      outputFolder: "src/content/api",
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
