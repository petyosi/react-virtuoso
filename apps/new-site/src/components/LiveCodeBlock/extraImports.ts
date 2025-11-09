import React from "react";
import * as _V from "react-virtuoso";

// @ts-ignore - Vite raw import for type definitions (using full paths since @types packages don't have exports)
import reactTypeDefs from "../../../node_modules/@types/react/index.d.ts?raw";
// @ts-ignore - Vite raw import for type definitions
import reactJsxRuntimeTypeDefs from "../../../node_modules/@types/react/jsx-runtime.d.ts?raw";
// @ts-ignore - Vite raw import for type definitions
import reactGlobalTypeDefs from "../../../node_modules/@types/react/global.d.ts?raw";
// @ts-ignore - Vite raw import for type definitions
import reactVirtuosoTypeDefs from "../../../node_modules/react-virtuoso/dist/index.d.ts?raw";

export const importMap: Record<string, unknown> = {
  react: React,
  "react-virtuoso": _V,
};

export const libDefinitions = [
  {
    content: reactGlobalTypeDefs,
    filePath: "file:///node_modules/@types/react/global.d.ts",
  },
  {
    content: reactTypeDefs,
    filePath: "file:///node_modules/@types/react/index.d.ts",
  },
  {
    content: reactJsxRuntimeTypeDefs,
    filePath: "file:///node_modules/@types/react/jsx-runtime.d.ts",
  },
  {
    content: reactVirtuosoTypeDefs,
    filePath: "file:///node_modules/@types/react-virtuoso/index.d.ts",
  },
];
