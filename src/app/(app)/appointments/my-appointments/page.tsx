"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarDays, Clock, Info, AlertTriangle } from "lucide-react";

// Mock data
const mockAppointments = [
  {
    id: "appt_001",
    serviceName: "Sports Facility - Basketball Court",
    date: "2024-07-20",
    time: "14:00 - 15:00",
    status: "Upcoming",
    location: "Sports Hall Court A",
    notes: "Bringing my own ball."
  },
  {
    id: "appt_002",
    serviceName: "Health Center - General Checkup",
    date: "2024-07-22",
    time: "10:30",
    status: "Upcoming",
    location: "Health Center, Room 3",
    notes: "Annual checkup."
  },
  {
    id: "appt_003",
    serviceName: "Library Study Room 1",
    date: "2024-07-15",
    time: "09:00 - 12:00",
    status: "Past",
    location: "Library, 2nd Floor",
    notes: "Group study session."
  },
  {
    id: "appt_004",
    serviceName: "Academic Advising with Prof. Elara",
    date: "2024-07-10",
    time: "11:00",
    status: "Cancelled",
    location: "Faculty Building, Office 101",
    notes: "Rescheduled for next week."
  },
];

export default function MyAppointmentsPage() {
  const upcomingAppointments = mockAppointments.filter(a => a.status === "Upcoming");
  const pastOrCancelledAppointments = mockAppointments.filter(a => a.status === "Past" || a.status === "Cancelled");

  // Placeholder for cancel action
  const handleCancelAppointment = (appointmentId: string) => {
    alert(`Cancelling appointment ${appointmentId} (Mock Action)`);
    // In a real app, call API and update state
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">My Appointments</h1>
        <p className="text-muted-foreground">
          View your upcoming, past, and cancelled appointments.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
        {upcomingAppointments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingAppointments.map((appt) => (
              <Card key={appt.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{appt.serviceName}</CardTitle>
                  <Badge>{appt.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> {new Date(appt.date).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                  <p className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> {appt.time}</p>
                  {appt.location && <p className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground" /> Location: {appt.location}</p>}
                  {appt.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {appt.notes}</p>}
                </CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="m-4 text-red-600 hover:border-red-600 hover:text-red-700">
                        <AlertTriangle className="mr-2 h-4 w-4"/> Cancel Appointment
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. Cancelling this appointment for {appt.serviceName} on {new Date(appt.date).toLocaleDateString()}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleCancelAppointment(appt.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Confirm Cancellation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">You have no upcoming appointments.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Past & Cancelled Appointments</h2>
        {pastOrCancelledAppointments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {pastOrCancelledAppointments.map((appt) => (
              <Card key={appt.id} className="opacity-75">
                <CardHeader>
                  <CardTitle className="text-lg">{appt.serviceName}</CardTitle>
                  <Badge variant={appt.status === "Cancelled" ? "destructive" : "secondary"}>{appt.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> {new Date(appt.date).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                  <p className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> {appt.time}</p>
                  {appt.location && <p className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground" /> Location: {appt.location}</p>}
                   {appt.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {appt.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No past or cancelled appointments found.</p>
        )}
      </section>

      <Button variant="link" asChild className="mt-6">
        <Link href="/appointments">Browse Services to Book</Link>
      </Button>
    </div>
  );
} 