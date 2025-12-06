// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightUtils from "@lorenzo_lewis/starlight-utils";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { dirname, resolve } from "node:path";
import initAstroTypedoc from "./src/plugins/astro-typedoc";
import { fileURLToPath } from "node:url";
import { remarkCustomCodeBlocks } from "./src/plugins/remark-custom-code-blocks";
import { autoImports } from "./src/plugins/auto-imports";
import { docsSync } from "./src/integrations/docs-sync";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Components that will be auto-imported when used in MDX files
const autoImportConfig = {
  imports: {
    LiveCodeBlock: {
      // Use absolute path from project root for MDX imports
      from: "/src/components/LiveCodeBlock/LiveCodeBlock.tsx",
      default: true,
    },
    StaticCodeBlock: {
      from: "/src/components/StaticCodeBlock/StaticCodeBlock.tsx",
      default: true,
    },
  },
};

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@components": resolve(__dirname, "./src/components"),
      },
    },
    ssr: {
      noExternal: ["monaco-editor"],
    },
  },
  markdown: {
    // @ts-ignore
    remarkPlugins: [remarkCustomCodeBlocks, [autoImports, autoImportConfig]],
  },
  integrations: [
    docsSync({
      excludeFromCleanup: ["99.api-reference"],
      sources: [
        {
          file: "../../packages/react-virtuoso/README.md",
          dest: "react-virtuoso",
        },
        {
          path: "../../packages/react-virtuoso/docs",
          dest: "react-virtuoso",
        },
        {
          file: "../../packages/masonry/README.md",
          dest: "masonry",
        },
        {
          path: "../../packages/masonry/docs",
          dest: "masonry",
        },
      ],
    }),
    react(),
    await initAstroTypedoc({
      baseUrl: "/react-virtuoso/api-reference/",
      entryPoints: [
        {
          path: resolve(
            __dirname,
            "../../packages/react-virtuoso/src/index.tsx",
          ),
        },
      ],
      tsconfig: resolve(
        __dirname,
        "../../packages/react-virtuoso/tsconfig.json",
      ),
      outputFolder: "src/content/docs/react-virtuoso/99.api-reference",
    }),
    starlight({
      title: "Virtuoso",
      customCss: ["./src/styles/global.css"],
      routeMiddleware: "./src/routeData.ts",
      components: {
        Header: "./src/components/Header.astro",
        SiteTitle: "./src/components/SiteTitle.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
      },
      plugins: [
        starlightUtils({
          multiSidebar: {
            switcherStyle: "hidden",
          },
        }),
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/withastro/starlight",
        },
      ],
      sidebar: [
        {
          label: "react-virtuoso",
          autogenerate: { directory: "react-virtuoso" },
          collapsed: true,
        },
        {
          label: "masonry",
          autogenerate: { directory: "masonry" },
          collapsed: true,
        },
      ],
    }),
  ],
});
