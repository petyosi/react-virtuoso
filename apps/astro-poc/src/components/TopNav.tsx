import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "./ThemeToggle";

interface TopNavProps {
  currentPath: string;
}

export function TopNav({ currentPath }: TopNavProps) {
  return (
    <div className="sticky top-0 z-40 bg-background md:ml-[220px]">
      <div className="flex items-center justify-end px-4 h-14 gap-2">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/"
                className={navigationMenuTriggerStyle()}
              >
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/posts/post-1"
                className={cn(
                  navigationMenuTriggerStyle(),
                  currentPath.startsWith("/posts") && "font-bold",
                )}
              >
                Blog Posts
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/api"
                className={cn(
                  navigationMenuTriggerStyle(),
                  currentPath.startsWith("/api") && "font-bold",
                )}
              >
                API Reference
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <ThemeToggle />
      </div>
    </div>
  );
}
