"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
// import type { TRPCClientErrorLike } from "@trpc/client"; // Keep if error type is further refined
// import type { AppRouter } from "@/server/api/root"; // Keep if error type is further refined

// Service Details - can be expanded or fetched if dynamic
const serviceDefinitions: {
	[key: string]: { 
		name: string; 
		description: string; 
		requiresNotes?: boolean;
		appointmentType: "Sport" | "Health" | "Book" | "Other"; // To map to tRPC input
		defaultTypeDetail?: string; // e.g., "General Sports", "General Health Checkup"
	};
} = {
	"sports-facility": {
		name: "Sports Facility Booking",
		description: "Select a date and time slot for your desired sports activity.",
		requiresNotes: true,
		appointmentType: "Sport",
		defaultTypeDetail: "General Facility Use",
	},
	"health-center": {
		name: "Health Center Appointment",
		description: "Choose an available time to see a healthcare professional.",
		requiresNotes: true,
		appointmentType: "Health",
		defaultTypeDetail: "General Consultation",
	},
	"library-books": {
		name: "Library Book Reservation",
		description: "Select books and a pickup time. (Detailed booking via separate page recommended)",
		requiresNotes: false,
		appointmentType: "Book", // This will be challenging with current generic page
	},
};

// Helper to convert "HH:MM AM/PM" to "HH:MM" (24-hour)
const convertTo24HourFormat = (timeStr: string | null | undefined): string => {
	if (!timeStr) {
		console.error("convertTo24HourFormat: Invalid time string provided (null or undefined)");
		throw new Error("Invalid time string provided");
	}
	const parts = timeStr.split(" ");
	if (parts.length < 2 || !parts[0] || !parts[1]) {
		console.error(`convertTo24HourFormat: Invalid time format for '${timeStr}'. Expected 'HH:MM AM/PM'`);
		throw new Error("Invalid time format. Expected 'HH:MM AM/PM'");
	}
	const timePart = parts[0];
	const modifier = parts[1];
	
	const timeValues = timePart.split(":").map(Number);
	let hours = timeValues[0];
	let minutes = timeValues[1];

	if (hours === undefined || minutes === undefined || Number.isNaN(hours) || Number.isNaN(minutes)) {
		console.error(`convertTo24HourFormat: Invalid time numbers in '${timePart}'`);
		throw new Error("Invalid time numbers");
	}

	if (modifier.toUpperCase() === "PM" && hours < 12) {
		hours += 12;
	}
	if (modifier.toUpperCase() === "AM" && hours === 12) { // Midnight case: 12 AM is 00 hours
		hours = 0;
	}
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export default function BookAppointmentPage() {
	const params = useParams();
	const router = useRouter();
	const serviceId = params.serviceId as string;
	
	const [serviceInfo, setServiceInfo] = useState<(typeof serviceDefinitions)[string] | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
	const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
	const [notes, setNotes] = useState("");

	useEffect(() => {
		if (serviceId && serviceDefinitions[serviceId]) {
			setServiceInfo(serviceDefinitions[serviceId]);
		} else {
			setServiceInfo(null); // Reset or handle unknown serviceId
		}
		setSelectedTimeSlot(null); // Reset time slot when serviceId changes
	}, [serviceId]);

	const availableSlotsQuery = api.appointments.getAvailableSlots.useQuery(
		{
			serviceId: serviceId,
			date: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
		},
		{
			enabled: !!serviceId && !!selectedDate,
			// onError callback removed to resolve persistent type errors
			// Errors will be handled by checking availableSlotsQuery.isError and availableSlotsQuery.error in the JSX
		}
	);
	
	const createAppointmentMutation = api.appointments.createAppointment.useMutation({
		onSuccess: (data) => {
			toast.success(`Appointment Confirmed!`, {
				description: `Your booking for ${serviceInfo?.name} on ${selectedDate?.toLocaleDateString()} at ${selectedTimeSlot} is scheduled.`,
				action: {
					label: "View My Appointments",
					onClick: () => router.push("/appointments/my-appointments"),
				},
			});
			// Reset form state
			setSelectedDate(new Date()); // Or undefined, depending on desired UX
			setSelectedTimeSlot(null);
			setNotes("");
			// Refetch available slots for the newly selected date (or current date if setSelectedDate(new Date()))
			// This will happen automatically if selectedDate changes and the query is enabled
      // Or explicitly: availableSlotsQuery.refetch(); 
      // However, since selectedDate is reset, the query will refetch for the new date if it's enabled for it.
		},
		// onError callback removed, will rely on createAppointmentMutation.isError for UI updates
		// Toast for mutation error can be triggered in useEffect or handleBooking based on isError and error state
	});

	// Effect to show toast on mutation error
	useEffect(() => {
		if (createAppointmentMutation.isError && createAppointmentMutation.error) {
			toast.error("Booking Failed", {
				description: createAppointmentMutation.error.message || "An unknown error occurred while booking.",
			});
		}
	}, [createAppointmentMutation.isError, createAppointmentMutation.error]);

	// Effect to show toast on query error (if not handled inline, though inline is often better for queries)
	useEffect(() => {
		if (availableSlotsQuery.isError && availableSlotsQuery.error) {
			toast.error("Error fetching slots", {
				description: availableSlotsQuery.error.message || "An unknown error occurred.",
			});
		}
	}, [availableSlotsQuery.isError, availableSlotsQuery.error]);

	const handleBooking = () => {
		if (!selectedDate || !selectedTimeSlot || !serviceInfo) {
			toast.error("Missing Information", {
				description: "Please select a date and time slot.",
			});
			return;
		}

		if (serviceInfo.appointmentType === "Other" || (serviceInfo.appointmentType === "Book" && serviceId === "library-books")) {
			// Handling for Academic Advising (not implemented) and Library (needs detailed page)
			const message = serviceId === "library-books" 
				? "Detailed book reservation should be done via the library portal or a dedicated booking page. This page is a placeholder for that type."
				: `${serviceInfo.name} booking is not yet available through this form.`;
			toast.info(message);
			if (serviceId === "library-books") {
				// Potentially redirect or guide user:
				// router.push("/library/browse-books"); 
			}
			return;
		}
		
		if (serviceInfo.appointmentType !== "Sport" && serviceInfo.appointmentType !== "Health") {
			toast.error(`Booking for ${serviceInfo.name} is not supported here.`);
			return;
		}

		let startTimeStr: string;
		try {
			startTimeStr = convertTo24HourFormat(selectedTimeSlot);
		} catch (e: unknown) { // Type error as unknown for better practice
			const errorMessage = e instanceof Error ? e.message : "Selected time slot is invalid.";
			toast.error("Invalid Time", {
				description: errorMessage,
			});
			return;
		}

		const startTimeDate = new Date(`1970-01-01T${startTimeStr}:00`);
		const endTimeDate = new Date(startTimeDate.getTime() + 60 * 60 * 1000); // Add 1 hour
		const endTimeStr = `${String(endTimeDate.getHours()).padStart(2, "0")}:${String(endTimeDate.getMinutes()).padStart(2, "0")}`;


		createAppointmentMutation.mutate({
			appointmentType: serviceInfo.appointmentType,
			appointmentDate: selectedDate.toISOString(),
			notes: notes || undefined,
			// --- Fields specific to Sport/Health ---
			sportType: serviceInfo.appointmentType === "Sport" ? (serviceInfo.defaultTypeDetail || "Sport Activity") : undefined,
			healthType: serviceInfo.appointmentType === "Health" ? (serviceInfo.defaultTypeDetail || "Health Consultation") : undefined,
			startTime: startTimeStr,
			endTime: endTimeStr,
			// managedByStaffId is handled by backend for now
		});
	};

	if (!serviceInfo && serviceId) { // Still checking if serviceInfo is loaded before showing loading/error
		return <p>Loading service details or service not found...</p>; 
	}
	if (!serviceId) { // No service ID in URL
		return <p>No service selected. Please go back and select a service.</p>;
	}

	return (
		<div className="space-y-6">
			{serviceInfo && ( // Ensure serviceInfo is loaded before rendering dependent UI
				<>
					<div>
						<h1 className="font-semibold text-2xl">Book: {serviceInfo.name}</h1>
						<p className="text-muted-foreground">{serviceInfo.description}</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Select Date</CardTitle>
							</CardHeader>
							<CardContent className="flex justify-center">
								<Calendar
									mode="single"
									selected={selectedDate}
									onSelect={(date) => {
										setSelectedDate(date);
										setSelectedTimeSlot(null); // Reset time slot when date changes
									}}
									className="rounded-md border"
									disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Select Time Slot</CardTitle>
								<CardDescription>
									Available slots for{" "}
									{selectedDate
										? selectedDate.toLocaleDateString("en-US", {
												dateStyle: "long",
											})
										: "selected date"}
								</CardDescription>
							</CardHeader>
							<CardContent className="grid grid-cols-2 gap-2 md:grid-cols-3">
								{availableSlotsQuery.isLoading && <p className="col-span-full text-center">Loading slots...</p>}
								{availableSlotsQuery.isError && (
									<p className="col-span-full text-center text-red-500">
										Error loading slots: {availableSlotsQuery.error?.message || "Unknown error"}
									</p>
								)}
								{availableSlotsQuery.data && availableSlotsQuery.data.length === 0 && !availableSlotsQuery.isLoading && !availableSlotsQuery.isError && (
									<p className="col-span-full text-center text-muted-foreground">
										No slots available for this date.
									</p>
								)}
								{availableSlotsQuery.data && availableSlotsQuery.data.map((slot) => (
									<Button
										key={slot}
										variant={selectedTimeSlot === slot ? "default" : "outline"}
										onClick={() => setSelectedTimeSlot(slot)}
										disabled={createAppointmentMutation.isPending}
									>
										{slot}
									</Button>
								))}
							</CardContent>
						</Card>
					</div>

					{serviceInfo.requiresNotes && (
						<Card>
							<CardHeader>
								<CardTitle>Additional Notes (Optional)</CardTitle>
							</CardHeader>
							<CardContent>
								<Textarea
									placeholder="Any specific requests or information..."
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									disabled={createAppointmentMutation.isPending}
								/>
							</CardContent>
						</Card>
					)}

					<div className="mb-[80px] flex flex-col gap-2 sm:flex-row sm:justify-end">
						<Button variant="outline" asChild>
							<Link href="/appointments">Cancel</Link>
						</Button>
						<Button
							onClick={handleBooking}
							disabled={!selectedDate || !selectedTimeSlot || createAppointmentMutation.isPending || availableSlotsQuery.isLoading}
						>
							{createAppointmentMutation.isPending ? "Booking..." : "Confirm Booking"}
						</Button>
					</div>
				</>
			)}
			{!serviceInfo && serviceId && ( // Fallback if serviceInfo didn't load but serviceId was present
				 <p>Could not load details for the selected service. It might be invalid.</p>
			)}
		</div>
	);
}
