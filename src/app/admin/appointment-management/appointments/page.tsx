import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePickerWithRange } from "@/app/_components/common/date-range-picker";
import { Input } from "@/components/ui/input";
import { Filter, Download } from "lucide-react";

// Mock Data
const mockAdminAppointments = [
  { id: "appt_101", userName: "Alice Wonderland", serviceName: "Sports Facility - Tennis Court 1", date: "2023-11-15", time: "10:00", status: "Upcoming" },
  { id: "appt_102", userName: "Bob The Builder", serviceName: "Health Center - Dr. Feelgood", date: "2023-11-16", time: "14:30", status: "Upcoming" },
  { id: "appt_103", userName: "Charlie Brown", serviceName: "Library Book Reservation", date: "2023-11-10", time: "N/A", status: "Past" },
  { id: "appt_104", userName: "Diana Prince", serviceName: "Academic Advising - Prof. Minerva", date: "2023-11-05", time: "09:00", status: "Cancelled" },
];

export default function ViewAppointmentsAdminPage() {
  // TODO: Implement filtering, pagination, and real data fetching
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">View All Appointments</h1>
        <p className="text-muted-foreground">Review and manage all user appointments.</p>
      </div>

    <Card>
        <CardHeader>
            <CardTitle>Filter & Export</CardTitle>
             <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                    <Input placeholder="Search by user or service..." className="w-full sm:w-auto"/>
                    <DatePickerWithRange className="w-full sm:w-auto"/>
                    {/* Add Select for Status Filter */}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Apply Filters</Button>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Data</Button>
                </div>
            </div>
        </CardHeader>
    </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAdminAppointments.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell>{appt.userName}</TableCell>
                  <TableCell>{appt.serviceName}</TableCell>
                  <TableCell>{new Date(appt.date).toLocaleDateString('en-CA')}</TableCell>
                  <TableCell>{appt.time}</TableCell>
                  <TableCell><Badge variant={appt.status === "Upcoming" ? "default" : appt.status === "Cancelled" ? "destructive" : "secondary"}>{appt.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" disabled={appt.status !== "Upcoming"}>Cancel</Button>
                    {/* Further actions like Reschedule, View Details can be added */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
