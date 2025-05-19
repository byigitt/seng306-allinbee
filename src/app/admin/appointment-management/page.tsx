import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { BookOpenCheck, ListChecks } from "lucide-react";
import Link from "next/link";

export default function AdminAppointmentOverviewPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-semibold text-xl md:text-2xl">
						Appointment Management
					</h1>
					<p className="text-muted-foreground">
						Oversee scheduled appointments and manage bookable services.
					</p>
				</div>
			</div>
			<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ListChecks className="h-5 w-5" /> View All Appointments
						</CardTitle>
						<CardDescription>
							Review, filter, and manage all scheduled appointments.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<Link href="/admin/appointment-management/appointments">
								Go to Appointments
							</Link>
						</Button>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BookOpenCheck className="h-5 w-5" /> Manage Bookable Services
						</CardTitle>
						<CardDescription>
							Define and configure services available for booking.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<Link href="/admin/appointment-management/books">
								Go to Services
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
