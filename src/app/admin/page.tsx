import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Bus, CalendarCheck, Users, BarChart3 } from "lucide-react";
import Link from "next/link";

const adminDashboardCards = [
  {
    title: "Cafeteria Management",
    description: "Manage daily menus, dishes, and view sales.",
    href: "/admin/cafeteria-management",
    icon: Utensils,
  },
  {
    title: "Ring Bus Management",
    description: "Manage bus routes and station information.",
    href: "/admin/ring-tracking-management",
    icon: Bus,
  },
  {
    title: "Appointment System",
    description: "Oversee appointments and manage bookable services.",
    href: "/admin/appointment-management",
    icon: CalendarCheck,
  },
  {
    title: "User Management", // Placeholder
    description: "Manage student and staff accounts.",
    href: "/admin/user-management", // Placeholder
    icon: Users,
  },
    {
    title: "System Analytics", // Placeholder
    description: "View overall system usage and statistics.",
    href: "/admin/analytics", // Placeholder
    icon: BarChart3,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview and quick access to management panels.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminDashboardCards.map((card) => (
          <Link href={card.href} key={card.title} className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 