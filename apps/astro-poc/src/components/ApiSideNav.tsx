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

interface ApiDoc {
  id: string;
  title: string;
}

interface GroupedDocs {
  [category: string]: ApiDoc[];
}

interface ApiSideNavProps {
  groupedDocs: GroupedDocs;
  currentPath: string;
}

function SideNavContent({ groupedDocs, currentPath }: ApiSideNavProps) {
  return (
    <div className="space-y-4">
      {Object.entries(groupedDocs).map(([category, docs]) => (
        <div key={category}>
          <h4 className="capitalize font-medium mb-2 text-muted-foreground">
            {category}
          </h4>
          <ul className="list-none p-0 space-y-2">
            {docs.map((doc) => (
              <li key={doc.id}>
                <a
                  href={`/api/${doc.id}`}
                  className={cn(
                    "block hover:underline text-sm",
                    currentPath === `/api/${doc.id}` && "font-bold",
                  )}
                >
                  {doc.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function ApiSideNav({ groupedDocs, currentPath }: ApiSideNavProps) {
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
            <SheetTitle>API Reference</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            <div className="pr-4">
              <SideNavContent
                groupedDocs={groupedDocs}
                currentPath={currentPath}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <nav className="hidden md:fixed md:block left-0 top-0 w-[220px] h-screen bg-background z-50">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center px-4 py-2">
            <a href="/" className="block">
              <Logo />
            </a>
          </div>

          {/* Navigation content */}
          <div className="flex-1 overflow-hidden p-4">
            <h3 className="font-semibold mb-4">API Reference</h3>
            <ScrollArea className="h-[calc(100vh-140px)]">
              <SideNavContent
                groupedDocs={groupedDocs}
                currentPath={currentPath}
              />
            </ScrollArea>
          </div>
        </div>
      </nav>
    </>
  );
}
