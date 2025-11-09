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

interface Post {
  id: string;
  title: string;
}

interface PostsSideNavProps {
  posts: Post[];
  currentPath: string;
}

function SideNavContent({ posts, currentPath }: PostsSideNavProps) {
  return (
    <ul className="list-none p-0 space-y-2">
      {posts.map((post) => (
        <li key={post.id}>
          <a
            href={`/posts/${post.id}`}
            className={cn(
              "block hover:underline text-sm",
              currentPath === `/posts/${post.id}` && "font-bold",
            )}
          >
            {post.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function PostsSideNav({ posts, currentPath }: PostsSideNavProps) {
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
            <SheetTitle>Blog Posts</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            <div className="pr-4">
              <SideNavContent posts={posts} currentPath={currentPath} />
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
            <h3 className="font-semibold mb-4">Blog Posts</h3>
            <ScrollArea className="h-[calc(100vh-140px)]">
              <SideNavContent posts={posts} currentPath={currentPath} />
            </ScrollArea>
          </div>
        </div>
      </nav>
    </>
  );
}
