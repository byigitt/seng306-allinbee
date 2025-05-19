'use client';

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Menu as MenuIcon, Package2 } from "lucide-react"; // Using MenuIcon to avoid conflicts if Menu is used differently
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminNavItem {
  href: string;
  label: string;
  icon?: React.ElementType;
  subMenu?: AdminNavItem[];
}

interface AdminPageHeaderProps {
  title: string;
  navItems: AdminNavItem[];
}

export default function AdminPageHeader({ title, navItems }: AdminPageHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="shrink-0">
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle Admin Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 sm:max-w-xs">
          <SheetTitle className="sr-only">Admin Menu</SheetTitle>
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-full bg-primary text-lg font-bold text-primary-foreground px-3 py-2 shadow"
            >
              <Package2 className="h-5 w-5" />
              <span className="text-sm">AllInBee Admin</span>
            </Link>
            <SheetClose asChild>
              <Button size="icon" variant="ghost" className="rounded-full">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Close Admin Menu</span>
              </Button>
            </SheetClose>
          </div>
          <nav className="flex-grow px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <React.Fragment key={item.href + "-admin-mobile"}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition",
                    item.subMenu ? 'font-semibold' : '',
                    pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)) ? "bg-accent text-accent-foreground" : ""
                  )}
                >
                  {item.icon && <item.icon className="h-5 w-5 text-primary" />}
                  {item.label}
                </Link>
                {item.subMenu && (
                  <div className="ml-8 space-y-1 py-1">
                    {item.subMenu.map(subItem => (
                      <Link
                        key={subItem.href + "-admin-mobile-sub"}
                        href={subItem.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition",
                          pathname === subItem.href ? "bg-accent text-accent-foreground" : ""
                        )}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <h1 className="text-lg font-semibold whitespace-nowrap">{title}</h1>
      </div>
      {/* Optional: Add admin-specific header actions here, like a global search or quick actions */}
    </header>
  );
} 