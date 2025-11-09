import { watch } from "node:fs";
import { readdir, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AstroIntegration } from "astro";
import {
  Application,
  Converter,
  type DeclarationReflection,
  PageEvent,
  type ProjectReflection,
  ReflectionKind,
  TSConfigReader,
} from "typedoc";

interface EntryPoint {
  name?: string;
  path: string;
}

interface FrontmatterObject {
  [key: string]: string | number;
}

interface GenerateDocsOptions {
  frontmatter?: FrontmatterObject;
  outputFolder?: string;
  project: ProjectReflection;
}

const objectToFrontmatter = (object: FrontmatterObject = {}): string =>
  Object.entries(object)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

const onRendererPageEnd =
  (frontmatterObject?: FrontmatterObject) => (event: PageEvent<any>) => {
    if (!event.contents) {
      return;
    }

    const prependix = `---
title: '${event.model.name}'
${objectToFrontmatter(frontmatterObject)}
---

`;

    event.contents = prependix + event.contents;
  };

const onDeclaration =
  (entryPoints: EntryPoint[] = []) =>
  (_context: unknown, reflection: DeclarationReflection) => {
    if (reflection.kind === ReflectionKind.Module) {
      const matchingEntryPoint = entryPoints.find(
        (entryPoint) =>
          entryPoint.path === reflection.sources?.[0]?.fullFileName,
      );

      reflection.name = matchingEntryPoint?.name ?? reflection.name;
    }
  };

const typedocConfig = {
  excludeExternals: true,
  excludeInternal: true,
  excludePrivate: true,
  excludeProtected: true,
  githubPages: false,
};

const markdownPluginConfig = {
  fileExtension: ".md",
  hideBreadcrumbs: true,
  hidePageHeader: true,
  hidePageTitle: true,
};

// Remove redundant prefixes like "class.", "function.", "interface.", etc.
const removePrefixFromFilename = (filename: string): string => {
  const prefixes = [
    "class.",
    "function.",
    "interface.",
    "type.",
    "enum.",
    "variable.",
    "namespace.",
  ];
  for (const prefix of prefixes) {
    if (filename.toLowerCase().startsWith(prefix)) {
      return filename.slice(prefix.length);
    }
  }
  return filename;
};

// Recursively rename files in a directory to remove prefixes
const removePrefixesFromFiles = async (dir: string): Promise<void> => {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await removePrefixesFromFiles(fullPath);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".md") || entry.name.endsWith(".html"))
    ) {
      const newName = removePrefixFromFilename(entry.name);
      if (newName !== entry.name) {
        const newPath = join(dir, newName);
        await rename(fullPath, newPath);
      }
    }
  }
};

export const initAstroTypedoc = async ({
  baseUrl = "/docs/",
  entryPoints,
  tsconfig,
  frontmatter = {},
  outputFolder = "src/content/api",
}: {
  baseUrl?: string;
  entryPoints: EntryPoint[];
  tsconfig: string;
  frontmatter?: FrontmatterObject;
  outputFolder?: string;
}): Promise<AstroIntegration> => {
  const app = await Application.bootstrapWithPlugins({
    ...typedocConfig,
    ...markdownPluginConfig,
    basePath: baseUrl,
    entryPoints: entryPoints.map((e) => e.path),
    plugin: ["typedoc-plugin-markdown"],
    readme: "none",
    tsconfig,
    skipErrorChecking: true,
  });

  app.options.addReader(new TSConfigReader());
  app.converter.on(
    Converter.EVENT_CREATE_DECLARATION,
    onDeclaration(entryPoints),
  );

  // Track the current page end handler to prevent duplicates
  let currentPageEndHandler: ((event: PageEvent<any>) => void) | null = null;

  const getReflections = async (): Promise<ProjectReflection | undefined> =>
    await app.convert();
  const generateDocs = async ({
    frontmatter,
    outputFolder = "src/pages/docs",
    project,
  }: GenerateDocsOptions): Promise<void> => {
    // Remove the previous handler if it exists
    if (currentPageEndHandler) {
      app.renderer.off(PageEvent.END, currentPageEndHandler);
    }

    // Create and register the new frontmatter handler
    currentPageEndHandler = onRendererPageEnd(frontmatter);
    app.renderer.on(PageEvent.END, currentPageEndHandler);

    await app.generateDocs(project, outputFolder);

    // Remove redundant prefixes from generated files
    await removePrefixesFromFiles(outputFolder);

    // Remove README.md if it exists
    try {
      await unlink(join(outputFolder, "README.md"));
    } catch {
      // Ignore if file doesn't exist
    }
  };

  const setupWatch = (
    frontmatter?: FrontmatterObject,
    outputFolder: string = "src/pages/docs",
  ) => {
    const watchers: ReturnType<typeof watch>[] = [];
    let regenerateTimeout: NodeJS.Timeout | null = null;

    // Debounced regeneration function
    const regenerateDocs = () => {
      if (regenerateTimeout) {
        clearTimeout(regenerateTimeout);
      }

      regenerateTimeout = setTimeout(async () => {
        console.log("[TypeDoc] Regenerating documentation...");
        try {
          const project = await getReflections();
          if (project) {
            await generateDocs({ frontmatter, outputFolder, project });
            console.log("[TypeDoc] Documentation regenerated successfully");
          }
        } catch (error) {
          console.error("[TypeDoc] Error regenerating documentation:", error);
        }
      }, 300); // 300ms debounce
    };

    // Watch all entry points and their directories
    entryPoints.forEach(({ path }) => {
      const dir = dirname(path);

      try {
        const watcher = watch(
          dir,
          { recursive: true },
          (_eventType, filename) => {
            if (filename && /\.ts$/.test(filename)) {
              console.log(`[TypeDoc] File changed: ${filename}`);
              regenerateDocs();
            }
          },
        );

        watchers.push(watcher);
        console.log(`[TypeDoc] Watching ${dir} for changes...`);
      } catch (error) {
        console.error(`[TypeDoc] Error setting up watch for ${dir}:`, error);
      }
    });

    // Return cleanup function
    return () => {
      if (regenerateTimeout) {
        clearTimeout(regenerateTimeout);
      }
      for (const watcher of watchers) {
        watcher.close();
      }
      console.log("[TypeDoc] Stopped watching for changes");
    };
  };

  let cleanupWatch: (() => void) | null = null;

  return {
    name: "astro-typedoc",
    hooks: {
      "astro:config:done": async ({ logger }) => {
        logger.info("Generating TypeDoc documentation...");

        try {
          const project = await getReflections();

          if (!project) {
            logger.warn(
              "No TypeDoc reflections found. Skipping documentation generation.",
            );
            return;
          }

          await generateDocs({ frontmatter, outputFolder, project });

          logger.info("TypeDoc documentation generated successfully");
        } catch (error) {
          logger.error("Failed to generate TypeDoc documentation:");
          console.error(error);
        }
      },
      "astro:server:setup": async ({ logger }) => {
        logger.info("Setting up TypeDoc file watcher for development...");
        cleanupWatch = setupWatch(frontmatter, outputFolder);
      },
      "astro:server:done": async ({ logger }) => {
        if (cleanupWatch) {
          logger.info("Cleaning up TypeDoc file watcher...");
          cleanupWatch();
          cleanupWatch = null;
        }
      },
    },
  };
};

export default initAstroTypedoc;
