"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Utensils, Bus, CalendarDays, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/cafeteria", label: "Cafeteria", icon: Utensils },
  { href: "/ring-tracking", label: "Ring", icon: Bus },
  { href: "/appointments", label: "Bookings", icon: CalendarDays },
//  { href: "/profile", label: "Profile", icon: UserCircle }, // Profile is in header
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-14 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = (item.href === "/" && pathname === "/") || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
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
  );
} 