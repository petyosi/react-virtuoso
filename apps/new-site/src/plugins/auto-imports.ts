import { createProgram } from "@virtuoso.dev/m2dx-utils";
import type { Root, RootContent } from "mdast";
import type { MdxjsEsm } from "mdast-util-mdx";
import { visit } from "unist-util-visit";

interface ComponentImport {
  /** Import path for this component */
  from: string;
  /** Whether this is a default import (default: true) */
  default?: boolean;
}

interface AutoImportsOptions {
  /** Map of component name to import configuration */
  imports: Record<string, ComponentImport>;
}

function findExistingImports(tree: Root): Set<string> {
  const imported = new Set<string>();

  visit(tree, "mdxjsEsm", (node: MdxjsEsm) => {
    const value = node.value || "";
    // Match: import X from, import { X } from, import { X as Y } from
    const importMatch = value.match(/import\s+(?:{([^}]+)}|(\w+))\s+from/);
    if (importMatch) {
      const namedImports = importMatch[1];
      const defaultImport = importMatch[2];

      if (defaultImport) {
        imported.add(defaultImport);
      }

      if (namedImports) {
        const names = namedImports.split(",").map((s) => {
          const parts = s.trim().split(/\s+as\s+/);
          return parts[parts.length - 1].trim();
        });
        names.forEach((n) => imported.add(n));
      }
    }
  });

  return imported;
}

function findUsedComponents(tree: Root): Set<string> {
  const used = new Set<string>();

  visit(tree, (node: any) => {
    if (
      (node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement") &&
      node.name &&
      typeof node.name === "string" &&
      /^[A-Z]/.test(node.name)
    ) {
      used.add(node.name);
    }
  });

  return used;
}

export function autoImports(options: AutoImportsOptions) {
  const { imports } = options;

  return function transformer(tree: Root): void {
    const existingImports = findExistingImports(tree);
    const usedComponents = findUsedComponents(tree);

    // Find components that are used but not imported
    const needed: Array<{ name: string; config: ComponentImport }> = [];
    for (const component of usedComponents) {
      if (!existingImports.has(component) && imports[component]) {
        needed.push({ name: component, config: imports[component] });
      }
    }

    if (needed.length === 0) {
      return;
    }

    // Group by import source for cleaner imports
    const bySource = new Map<
      string,
      Array<{ name: string; isDefault: boolean }>
    >();
    for (const { name, config } of needed) {
      const source = config.from;
      if (!bySource.has(source)) {
        bySource.set(source, []);
      }
      bySource.get(source)!.push({ name, isDefault: config.default !== false });
    }

    // Generate import statements
    for (const [source, components] of bySource) {
      const defaultImports = components.filter((c) => c.isDefault);
      const namedImports = components.filter((c) => !c.isDefault);

      let importStatement: string;
      if (defaultImports.length > 0 && namedImports.length > 0) {
        // import Default, { Named } from 'source'
        importStatement = `import ${defaultImports[0].name}, { ${namedImports.map((c) => c.name).join(", ")} } from '${source}'`;
      } else if (defaultImports.length > 0) {
        // import Default from 'source'
        importStatement = `import ${defaultImports[0].name} from '${source}'`;
      } else {
        // import { Named } from 'source'
        importStatement = `import { ${namedImports.map((c) => c.name).join(", ")} } from '${source}'`;
      }

      const importNode = createProgram(importStatement);
      tree.children.unshift(importNode as unknown as RootContent);
    }
  };
}

export default autoImports;
