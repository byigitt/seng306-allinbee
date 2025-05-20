import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CalendarCheck, Dumbbell, Library, Users } from "lucide-react";
import Link from "next/link";

const Services = [
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
];

export default function BrowseAppointmentsPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-semibold text-2xl">Book an Appointment</h1>
					<p className="text-muted-foreground">
						Select a service to view availability and book.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/appointments/my-appointments">My Appointments</Link>
				</Button>
			</div>

			<div className="mb-[80px] grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Services.map((service) => {
					const Icon = service.icon;
					return (
						<Card key={service.id}>
							<CardHeader className="flex flex-row items-start gap-4 space-y-0">
								<div
									className={`rounded-lg bg-primary/10 p-3 ${service.color}`}
								>
									<Icon className="h-8 w-8" />
								</div>
								<div>
									<CardTitle>{service.name}</CardTitle>
									<CardDescription className="mt-1 line-clamp-2">
										{service.description}
									</CardDescription>
								</div>
							</CardHeader>
							<CardFooter>
								<Button asChild className="w-full">
									<Link href={`/appointments/${service.id}`}>
										View Availability & Book
									</Link>
								</Button>
							</CardFooter>
						</Card>
					);
				})}
			</div>
			<div className="mt-8 mb-[100px] flex justify-center">
				<Button variant="link" asChild>
					<Link href="/">Back to Home</Link>
				</Button>
			</div>
		</div>
	);
}
