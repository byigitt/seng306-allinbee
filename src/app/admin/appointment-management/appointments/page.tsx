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
    <div className="space-y-6 p-2 sm:p-0">
      <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">View All Appointments</h1>
          <p className="text-muted-foreground">Review and manage all user appointments.</p>
        </div>
      </div>

    <Card className="w-full">
        <CardHeader className="p-4">
            <CardTitle>Filter & Export</CardTitle>
              <div className="flex flex-col gap-4 pt-2 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-3 md:flex-row md:gap-2 md:items-center flex-wrap">
                    <Input placeholder="Search by user or service..." className="w-full md:max-w-xs"/>
                    <DatePickerWithRange className="w-full md:w-auto"/>
                    {/* TODO: Add Select for Status Filter - ensure it also handles mobile width */}
                    {/* Example Select for Status Filter: */}
                    {/* <Select>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="past">Past</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select> */}
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:gap-2 md:shrink-0">
                    <Button variant="outline" className="w-full md:w-auto"><Filter className="mr-2 h-4 w-4" /> Apply Filters</Button>
                    <Button variant="outline" className="w-full md:w-auto"><Download className="mr-2 h-4 w-4" /> Export Data</Button>
                </div>
              </div>
        </CardHeader>
    </Card>

    <Card className="w-full mb-[80px]">
      <CardHeader className="p-4">
        <CardTitle>Scheduled Appointments</CardTitle>
        </CardHeader>
      <CardContent className="p-0 md:p-4">
        {/* Desktop Table - Hidden on sm and below */}
        <div className="hidden md:block overflow-x-auto">
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
                  <TableCell><Badge variant={appt.status === "Upcoming" || appt.status === "Past" ? "default" : appt.status === "Cancelled" ? "destructive" : "secondary"}>{appt.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" disabled={appt.status !== "Upcoming"}>Cancel</Button>
                  </TableCell>
                </TableRow>
              ))}
                {mockAdminAppointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                    No appointments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card List - Visible on sm and below, hidden on md and up */}
        <div className="block md:hidden space-y-4 p-2 sm:p-4 ">
          {mockAdminAppointments.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No appointments found.</p>
          )}
          {mockAdminAppointments.map((appt) => (
            <Card key={appt.id + '-mobile'} className="w-full shadow-lg border rounded-lg overflow-hidden">
              <CardHeader className="p-4 bg-muted/30">
                <div className="flex justify-between items-center gap-2">
                  <CardTitle className="text-md font-semibold leading-snug flex-1 break-words">{appt.serviceName}</CardTitle>
                  <Badge 
                      variant={appt.status === "Upcoming" ? "default" : appt.status === "Cancelled" ? "destructive" : "secondary"} 
                      className="ml-2 shrink-0 text-xs px-2 py-1 whitespace-nowrap">
                    {appt.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 text-sm space-y-2.5">
                <div className="flex items-center">
                  <span className="w-16 font-medium text-muted-foreground text-xs">User:</span>
                  <span className="flex-1 text-foreground break-words">{appt.userName}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-16 font-medium text-muted-foreground text-xs">Date:</span>
                  <span className="text-foreground">{new Date(appt.date).toLocaleDateString('en-CA')}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-16 font-medium text-muted-foreground text-xs">Time:</span>
                  <span className="text-foreground">{appt.time}</span>
                </div>
                {appt.status === "Upcoming" && (
                  <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3 border-destructive text-destructive hover:bg-destructive/5 hover:text-destructive-foreground focus-visible:ring-destructive">
                    Cancel Appointment
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
