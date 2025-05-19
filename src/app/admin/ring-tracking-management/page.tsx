import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Route, MapPin } from "lucide-react";

export default function AdminRingTrackingOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ring Bus Management</h1>
        <p className="text-muted-foreground">Manage bus routes and station details.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Route className="h-5 w-5"/> Manage Routes</CardTitle>
            <CardDescription>Define and update bus routes and their schedules.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/admin/ring-tracking-management/routes">Go to Routes</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/> Manage Stations</CardTitle>
            <CardDescription>Add, edit, or remove bus stop locations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/admin/ring-tracking-management/stations">Go to Stations</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 