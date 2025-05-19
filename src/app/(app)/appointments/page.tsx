import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Dumbbell, Library, Users } from "lucide-react";
import Link from "next/link";

// Mock Data
const mockServices = [
  {
    id: "sports-facility",
    name: "Sports Facility Booking",
    description: "Book time slots for basketball, tennis, gym, etc.",
    icon: Dumbbell,
    color: "text-blue-500",
  },
  {
    id: "health-center",
    name: "Health Center Appointments",
    description: "Schedule appointments with doctors or nurses.",
    icon: Users, // Placeholder, consider Users2 or HeartPulse
    color: "text-red-500",
  },
  {
    id: "library-books",
    name: "Library Book Reservation",
    description: "Reserve library books for pickup.",
    icon: Library,
    color: "text-green-500",
  },
  {
    id: "academic-advising",
    name: "Academic Advising",
    description: "Book a session with your academic advisor.",
    icon: CalendarCheck,
    color: "text-purple-500", 
  }
];

export default function BrowseAppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
            <h1 className="text-2xl font-semibold">Book an Appointment</h1>
            <p className="text-muted-foreground">Select a service to view availability and book.</p>
        </div>
        <Button asChild variant="outline">
            <Link href="/appointments/my-appointments">My Appointments</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockServices.map((service) => {
          const Icon = service.icon;
          return (
            <Card key={service.id}>
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className={`rounded-lg bg-primary/10 p-3 ${service.color}`}>
                    <Icon className="h-8 w-8" />
                </div>
                <div>
                    <CardTitle>{service.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">{service.description}</CardDescription>
                </div>
              </CardHeader>
              <CardFooter>
                <Button asChild className="w-full">
                  {/* The link will eventually be to /appointments/book/[service.id] */}
                  <Link href={`/appointments/book/${service.id}`}>View Availability & Book</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 