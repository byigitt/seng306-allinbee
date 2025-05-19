import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ListChecks, BookOpenCheck } from "lucide-react";

export default function AdminAppointmentOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Appointment Management</h1>
        <p className="text-muted-foreground">Oversee scheduled appointments and manage bookable services.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5"/> View All Appointments</CardTitle>
            <CardDescription>Review, filter, and manage all scheduled appointments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/admin/appointment-management/appointments">Go to Appointments</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5"/> Manage Bookable Services</CardTitle>
            <CardDescription>Define and configure services available for booking.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/admin/appointment-management/books">Go to Services</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
