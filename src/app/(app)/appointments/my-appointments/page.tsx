"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, CalendarDays, Clock, Info, Library, Users, Dumbbell, BookHeart, HeartPulse } from "lucide-react";
import Link from "next/link";
import { api } from "@/trpc/react";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Appointment = RouterOutputs["appointments"]["listMyAppointments"]["appointments"][number];

function getAppointmentTypeAndDetails(appointment: Appointment): {
	typeName: string;
	specificDetails: string;
	Icon: React.ElementType;
} {
	if (appointment.bookBorrowRecords && appointment.bookBorrowRecords.length > 0) {
		const bookTitles = appointment.bookBorrowRecords.map((b: { book: { title: string } }) => b.book.title).join(", ");
		return { typeName: "Library Book Borrow", specificDetails: `Books: ${bookTitles}`, Icon: Library };
	}
	if (appointment.sportAppointment) {
		return { 
			typeName: "Sports Activity", 
			specificDetails: `Type: ${appointment.sportAppointment.sportType}, Time: ${new Date(appointment.sportAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(appointment.sportAppointment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 
			Icon: Dumbbell 
		};
	}
	if (appointment.healthAppointment) {
		return { 
			typeName: "Health Consultation", 
			specificDetails: `Type: ${appointment.healthAppointment.healthType}, Time: ${new Date(appointment.healthAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(appointment.healthAppointment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 
			Icon: HeartPulse 
		};
	}
	return { typeName: "General Appointment", specificDetails: "Details not specified", Icon: CalendarDays };
}

export default function MyAppointmentsPage() {
	const [showAllPast, setShowAllPast] = useState(false);
	const appointmentsQuery = api.appointments.listMyAppointments.useQuery({}); // Default take/skip
	const cancelMutation = api.appointments.cancelAppointment.useMutation({
		onSuccess: (cancelledAppointmentData, variables) => {
			// Find the original appointment from the query cache to get full details for the toast
			const originalAppointment = appointmentsQuery.data?.appointments.find(
				(appt) => appt.appointmentId === variables.appointmentId
			);

			let toastDescription = `The appointment on ${new Date(cancelledAppointmentData.appointmentDate).toLocaleDateString()} has been cancelled.`;
			if (originalAppointment) {
				toastDescription = `The appointment for ${getAppointmentTypeAndDetails(originalAppointment).typeName} on ${new Date(originalAppointment.appointmentDate).toLocaleDateString()} has been cancelled.`;
			}

			toast.success("Appointment Cancelled", {
				description: toastDescription,
			});
			appointmentsQuery.refetch();
		},
		onError: (error) => { 
			toast.error("Cancellation Failed", {
				description: error.message || "Could not cancel the appointment. Please try again.",
			});
		}
	});

	// Toast for query error
	useEffect(() => {
		if (appointmentsQuery.isError && appointmentsQuery.error) {
			toast.error("Error Loading Appointments", {
				description: appointmentsQuery.error.message || "Could not fetch your appointments.",
			});
		}
	}, [appointmentsQuery.isError, appointmentsQuery.error]);

	const handleCancelAppointment = (appointmentId: string) => {
		cancelMutation.mutate({ appointmentId });
	};

	if (appointmentsQuery.isLoading) {
		return <p>Loading your appointments...</p>; // Replace with a proper spinner/skeleton UI
	}

	if (appointmentsQuery.error) {
		return <p>Error loading appointments: {appointmentsQuery.error.message}</p>;
	}

	const allAppointments = appointmentsQuery.data?.appointments ?? [];
	const upcomingAppointments = allAppointments.filter(
		(a) => a.appointmentStatus === "Scheduled",
	);
	const pastOrCancelledAppointments = allAppointments.filter(
		(a) => a.appointmentStatus !== "Scheduled",
	);

	const displayedPastOrCancelled = showAllPast ? pastOrCancelledAppointments : pastOrCancelledAppointments.slice(0, 4);

	const renderAppointmentCard = (appt: Appointment, isUpcoming: boolean) => {
		const { typeName, specificDetails, Icon } = getAppointmentTypeAndDetails(appt);
		return (
			<Card key={appt.appointmentId} className={isUpcoming ? "" : "opacity-75"}>
				<CardHeader>
					<div className="flex items-start justify-between">
						<CardTitle className="text-lg flex items-center">
							<Icon className="mr-2 h-5 w-5 text-muted-foreground" /> {typeName}
						</CardTitle>
						<Badge 
							variant={
								appt.appointmentStatus === "Cancelled" || appt.appointmentStatus === "NoShow"
									? "destructive"
									: appt.appointmentStatus === "Completed"
										? "secondary"
										: "default" // Scheduled
							}
						>
							{appt.appointmentStatus}
						</Badge>
					</div>
					{appt.managedByStaff?.user && (
						<CardDescription className="text-xs pt-1">
							Staff: {appt.managedByStaff.user.name ?? `${appt.managedByStaff.user.fName} ${appt.managedByStaff.user.lName}`}
						</CardDescription>
					)}
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					<p className="flex items-center">
						<CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />{" "}
						{new Date(appt.appointmentDate).toLocaleDateString("en-US", {
							dateStyle: "long",
						})}
					</p>
					<p className="flex items-center">
						<Info className="mr-2 h-4 w-4 text-muted-foreground" />{" "}
						{specificDetails}
					</p>
					{/* Add other relevant details here if needed, e.g., notes from appointment itself */}
				</CardContent>
				{isUpcoming && appt.appointmentStatus === "Scheduled" && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="outline"
								className="m-4 text-red-600 hover:border-red-600 hover:text-red-700"
								disabled={cancelMutation.isPending}
							>
								<AlertTriangle className="mr-2 h-4 w-4" /> {cancelMutation.isPending ? "Cancelling..." : "Cancel Appointment"}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Are you sure you want to cancel this appointment?
								</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. Cancelling: {typeName} on{" "}
									{new Date(appt.appointmentDate).toLocaleDateString()}.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel disabled={cancelMutation.isPending}>Keep Appointment</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => handleCancelAppointment(appt.appointmentId)}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									disabled={cancelMutation.isPending}
								>
									{cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</Card>
		);
	};

	return (
		<div className="space-y-8">
			<div>
				<h1 className="font-semibold text-2xl">My Appointments</h1>
				<p className="text-muted-foreground">
					View your upcoming, past, and cancelled appointments.
				</p>
			</div>

			<section>
				<h2 className="mb-4 font-semibold text-xl">Upcoming Appointments</h2>
				{upcomingAppointments.length > 0 ? (
					<div className="grid gap-4 md:grid-cols-2">
						{upcomingAppointments.map(appt => renderAppointmentCard(appt, true))}
					</div>
				) : (
					<p className="text-muted-foreground">
						You have no upcoming appointments.
					</p>
				)}
			</section>

			<section>
				<div className="flex items-center justify-between mb-4">
					<h2 className="font-semibold text-xl">Past & Cancelled Appointments</h2>
					{pastOrCancelledAppointments.length > 4 && (
						<Button variant="link" onClick={() => setShowAllPast(!showAllPast)}>
							{showAllPast ? "Show Less" : "Show All"}
						</Button>
					)}
				</div>
				{displayedPastOrCancelled.length > 0 ? (
					<div className="grid gap-4 md:grid-cols-2">
						{displayedPastOrCancelled.map(appt => renderAppointmentCard(appt, false))}
					</div>
				) : (
					<p className="text-muted-foreground">
						No past or cancelled appointments found.
					</p>
				)}
			</section>

			<Button variant="link" asChild className="mt-6 mb-[80px]">
				<Link href="/appointments">Browse Services to Book</Link>
			</Button>
		</div>
	);
}
