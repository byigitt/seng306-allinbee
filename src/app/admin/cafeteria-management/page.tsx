import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Utensils, Edit, BarChartBig } from "lucide-react";

export default function AdminCafeteriaOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cafeteria Management</h1>
        <p className="text-muted-foreground">Manage dishes, menus, and view sales reports.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Utensils className="h-5 w-5"/> Manage Dishes</CardTitle>
            <CardDescription>Create, update, and delete cafeteria dishes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/admin/cafeteria-management/dishes">Go to Dishes</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Edit className="h-5 w-5"/> Manage Menus</CardTitle>
            <CardDescription>Create and publish daily or weekly menus.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/admin/cafeteria-management/menus">Go to Menus</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChartBig className="h-5 w-5"/> View Sales</CardTitle>
            <CardDescription>Access sales reports and analytics.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/admin/cafeteria-management/sales">Go to Sales</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 