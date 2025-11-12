import { Menu } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Guide {
  id: string;
  title: string;
}

interface GuideSideNavProps {
  guides: Guide[];
  currentPath: string;
}

interface DirectoryNode {
  name: string;
  guides: Guide[];
  subdirectories: Map<string, DirectoryNode>;
}

function buildDirectoryTree(guides: Guide[]): DirectoryNode {
  const root: DirectoryNode = {
    name: "",
    guides: [],
    subdirectories: new Map(),
  };

  for (const guide of guides) {
    const parts = guide.id.split("/");
    let current = root;

    // Navigate through directory parts (all but the last part)
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.subdirectories.has(part)) {
        current.subdirectories.set(part, {
          name: part,
          guides: [],
          subdirectories: new Map(),
        });
      }
      const next = current.subdirectories.get(part);
      if (next) {
        current = next;
      }
    }

    // Add guide to the final directory
    current.guides.push(guide);
  }

  return root;
}

function formatDirectoryName(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface DirectoryTreeProps {
  node: DirectoryNode;
  currentPath: string;
  level?: number;
}

function DirectoryTree({ node, currentPath, level = 0 }: DirectoryTreeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={cn(level > 0 && "ml-4")}>
      {node.name && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="font-semibold text-sm mb-2 hover:underline"
        >
          {isExpanded ? "▼" : "▶"} {formatDirectoryName(node.name)}
        </button>
      )}

      {isExpanded && (
        <>
          {node.guides.length > 0 && (
            <ul className="list-none p-0 space-y-2 mb-4">
              {node.guides.map((guide) => (
                <li key={guide.id}>
                  <a
                    href={`/guides/${guide.id}`}
                    className={cn(
                      "block hover:underline text-sm",
                      currentPath === `/guides/${guide.id}` && "font-bold",
                    )}
                  >
                    {guide.title}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {Array.from(node.subdirectories.values()).map((subdir) => (
            <DirectoryTree
              key={subdir.name}
              node={subdir}
              currentPath={currentPath}
              level={level + 1}
            />
          ))}
        </>
      )}
    </div>
  );
}

function SideNavContent({ guides, currentPath }: GuideSideNavProps) {
  const tree = buildDirectoryTree(guides);

  return (
    <div>
      {tree.guides.length > 0 && (
        <ul className="list-none p-0 space-y-2 mb-4">
          {tree.guides.map((guide) => (
            <li key={guide.id}>
              <a
                href={`/guides/${guide.id}`}
                className={cn(
                  "block hover:underline text-sm",
                  currentPath === `/guides/${guide.id}` && "font-bold",
                )}
              >
                {guide.title}
              </a>
            </li>
          ))}
        </ul>
      )}

      {Array.from(tree.subdirectories.values()).map((subdir) => (
        <DirectoryTree
          key={subdir.name}
          node={subdir}
          currentPath={currentPath}
        />
      ))}
    </div>
  );
}

export function GuideSideNav({ guides, currentPath }: GuideSideNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed left-4 top-2 z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px]">
          <SheetHeader>
            <SheetTitle>Guides</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            <div className="pr-4">
              <SideNavContent guides={guides} currentPath={currentPath} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <nav className="hidden md:fixed md:block left-0 top-0 w-[220px] h-screen bg-background z-50">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 py-2">
            <a href="/">
              <Logo />
            </a>
          </div>

          {/* Navigation content */}
          <div className="flex-1 overflow-hidden p-4">
            <h3 className="font-semibold mb-4">Guides</h3>
            <ScrollArea className="h-[calc(100vh-140px)]">
              <SideNavContent guides={guides} currentPath={currentPath} />
            </ScrollArea>
          </div>
        </div>
      </nav>
    </>
  );
}
