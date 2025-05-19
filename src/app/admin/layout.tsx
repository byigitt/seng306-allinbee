import Link from "next/link";
import { Bell, Home, Package2, Settings, Users, Utensils, Bus, CalendarCheck, BookOpen, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import React from "react";

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
  // Add other admin sections here, e.g., User Management, Settings
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // const pathname = usePathname(); // To highlight active link

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" /> {/* Replace with a better Admin logo if available */}
              <span className="">AllInBee Admin</span>
            </Link>
            {/* <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button> */}
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {adminNavItems.map((item) => (
                <React.Fragment key={item.href}>
                    <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${item.subMenu ? 'font-semibold' : ''}`}
                    // Add active class: pathname === item.href ? "bg-muted text-primary" : ""
                    >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    </Link>
                    {item.subMenu && (
                        <div className="ml-7 grid gap-1">
                            {item.subMenu.map(subItem => (
                                 <Link
                                    key={subItem.href}
                                    href={subItem.href}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-xs"
                                    // Add active class: pathname === subItem.href ? "bg-muted text-primary" : ""
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
          {/* Optional Footer in Sidebar */}
          {/* <div className="mt-auto p-4">
            <Card>
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage admin preferences.</CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">Go to Settings</Button>
              </CardContent>
            </Card>
          </div> */}
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
            {/* Mobile Header - similar to app header but with admin nav */}
            <Sheet>
                <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-2 text-lg font-medium">
                    <Link
                    href="/admin"
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                    >
                    <Package2 className="h-6 w-6" />
                    <span className="">AllInBee Admin</span>
                    </Link>
                    {adminNavItems.map((item) => (
                        <React.Fragment key={item.href + "-mobile"}>
                            <Link
                                href={item.href}
                                className={`flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-primary ${item.subMenu ? 'font-semibold' : ''}`}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                            {item.subMenu && (
                                <div className="ml-7 grid gap-1">
                                    {item.subMenu.map(subItem => (
                                        <Link
                                            key={subItem.href + "-mobile"}
                                            href={subItem.href}
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary text-sm"
                                        >
                                        {subItem.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
                {/* Optional Mobile Sheet Footer */}
                </SheetContent>
            </Sheet>
          <div className="w-full flex-1">
            {/* Can add a search bar here if needed for admin */}
            <h1 className="text-lg font-semibold">Admin Panel</h1>
          </div>
          {/* <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                <UserCircle className="h-5 w-5" />
                <span className="sr-only">User Profile</span>
            </Button> */}
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
} 