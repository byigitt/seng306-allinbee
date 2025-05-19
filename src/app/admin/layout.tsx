"use client";

import Link from "next/link";
import { Home, Package2, Utensils, Bus, CalendarCheck } from "lucide-react"; // Simplified imports, MenuIcon is in AdminPageHeader

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Import the new AdminPageHeader component
import AdminPageHeader from "@/app/_components/common/admin-page-header"; 

// Keep AdminNavItems definition here as it's used by AdminPageHeader and desktop sidebar
const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/cafeteria-management", label: "Cafeteria Mgmt", icon: Utensils, subMenu: [
    { href: "/admin/cafeteria-management/dishes", label: "Manage Dishes"},
    { href: "/admin/cafeteria-management/menus", label: "Manage Menus"},
    { href: "/admin/cafeteria-management/sales", label: "View Sales"},
  ]}, 
  { href: "/admin/ring-tracking-management", label: "Ring Bus Mgmt", icon: Bus, subMenu: [
    { href: "/admin/ring-tracking-management/routes", label: "Manage Routes"},
    { href: "/admin/ring-tracking-management/stations", label: "Manage Stations"},
  ]}, 
  { href: "/admin/appointment-management", label: "Appointment Mgmt", icon: CalendarCheck, subMenu: [
    { href: "/admin/appointment-management/appointments", label: "View Appointments"},
    { href: "/admin/appointment-management/books", label: "Manage Books"},
  ]},
];

const adminBottomNavItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/cafeteria-management", label: "Cafeteria", icon: Utensils },
  { href: "/admin/ring-tracking-management", label: "Ring Bus", icon: Bus },
  { href: "/admin/appointment-management", label: "Bookings", icon: CalendarCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); 
  // TODO: Implement a way to get the current page's title dynamically for AdminPageHeader
  const currentPageTitle = "Admin Panel"; // Placeholder

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar - remains the same */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="">AllInBee Admin</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {adminNavItems.map((item) => (
                <React.Fragment key={item.href + "-desktop"}>
                    <Link
                    href={item.href}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", item.subMenu ? 'font-semibold' : '', pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)) ? "bg-muted text-primary" : "")}
                    >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    </Link>
                    {item.subMenu && (
                        <div className="ml-7 grid gap-1">
                            {item.subMenu.map(subItem => (
                                 <Link
                                    key={subItem.href + "-desktop"}
                                    href={subItem.href}
                                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-xs", pathname === subItem.href ? "bg-muted text-primary" : "")}
                                >
                                {subItem.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col">
        {/* Use the new AdminPageHeader for mobile header */}
        <AdminPageHeader title={currentPageTitle} navItems={adminNavItems} />

        {/* Desktop Header (Title part) - This div ensures the title is shown on desktop 
             and does not interfere with the mobile header which is handled by AdminPageHeader.
             The AdminPageHeader itself is hidden on md+ screens via its own Tailwind classes.
        */}
        <header className="hidden h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:flex">
            <div className="w-full flex-1">
                {/* This title should ideally be dynamic based on the content of {children} */}
                <h1 className="text-lg font-semibold">{currentPageTitle}</h1> 
            </div>
            {/* Potential place for desktop-specific header actions if any */}
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
        
        {/* Admin Bottom Navigation - remains the same */}
        <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <div className="flex h-16 items-center justify-around">
            {adminBottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = (item.href === "/admin" && pathname === "/admin") || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href + "-bottom"}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
} 