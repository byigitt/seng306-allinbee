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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
		subTypes?: string[]; // New: For specific sport/health types
		fields?: Array<"date" | "time" | "notes" | "bookSelection" | "subTypeSelection">; // Control what UI elements to show, added subTypeSelection
	};
} = {
	"sports-facility": {
		name: "Sports Facility Booking",
		description: "Select a date and time slot for your desired sports activity.",
		requiresNotes: true,
		appointmentType: "Sport",
		defaultTypeDetail: "General Facility Use",
		subTypes: ["General Facility Use", "Fitness Center", "Basketball Court", "Volleyball Court", "Tennis Court"],
		fields: ["date", "time", "subTypeSelection", "notes"],
	},
	"health-center": {
		name: "Health Center Appointment",
		description: "Choose an available time to see a healthcare professional.",
		requiresNotes: true,
		appointmentType: "Health",
		defaultTypeDetail: "General Consultation",
		subTypes: ["General Consultation", "Psychiatrist", "Dentist", "Nutritionist"],
		fields: ["date", "time", "subTypeSelection", "notes"],
	},
	"library-books": {
		name: "Library Book Reservation",
		description: "Select books and a pickup date.",
		requiresNotes: false,
		appointmentType: "Book",
		fields: ["date", "bookSelection", "notes"],
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
	const minutes = timeValues[1];

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
	const [selectedBooks, setSelectedBooks] = useState<Array<{ isbn: string; title: string; quantity: number }>>([]);
	const [bookSearchTerm, setBookSearchTerm] = useState("");
	const [selectedSubType, setSelectedSubType] = useState<string | null>(null);

	useEffect(() => {
		if (serviceId && serviceDefinitions[serviceId]) {
			setServiceInfo(serviceDefinitions[serviceId]);
		} else {
			setServiceInfo(null); // Reset or handle unknown serviceId
		}
		setSelectedTimeSlot(null); // Reset time slot when serviceId changes
		setSelectedSubType(null); // Reset sub-type when serviceId or date changes
		setSelectedBooks([]); // Reset selected books
		setBookSearchTerm(""); // Reset search term
	}, [serviceId]);

	const listBooksQuery = api.appointments.listAvailableBooks.useQuery(
		{ searchTerm: bookSearchTerm, take: 10 },
		{ enabled: serviceId === "library-books" && serviceInfo?.appointmentType === "Book" }
	);

	const availableSlotsQuery = api.appointments.getAvailableSlots.useQuery(
		{
			serviceId: serviceId,
			date: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
		},
		{
			enabled: !!serviceId && !!selectedDate && serviceInfo?.fields?.includes("time"),
		}
	);
	
	const createAppointmentMutation = api.appointments.createAppointment.useMutation({
		onSuccess: (data) => {
			toast.success("Appointment Confirmed!", {
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
			setSelectedBooks([]); // Also reset selected books on success
			setSelectedSubType(null); // Reset sub-type on successful booking
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
		if (availableSlotsQuery.isError && availableSlotsQuery.error && serviceInfo?.fields?.includes("time")) {
			toast.error("Error fetching slots", {
				description: availableSlotsQuery.error.message || "An unknown error occurred.",
			});
		}
		if (listBooksQuery.isError && listBooksQuery.error && serviceInfo?.fields?.includes("bookSelection")) {
			toast.error("Error fetching books", {
				description: listBooksQuery.error.message || "Could not load books.",
			});
		}
	}, [
		availableSlotsQuery.isError, availableSlotsQuery.error, 
		listBooksQuery.isError, listBooksQuery.error, 
		serviceInfo
	]);

	const handleBooking = () => {
		if (!selectedDate || !serviceInfo) {
			toast.error("Missing Information", {
				description: "Please select a date.",
			});
			return;
		}

		if (serviceInfo.fields?.includes("time") && !selectedTimeSlot) {
			toast.error("Missing Information", {
				description: "Please select a time slot.",
			});
			return;
		}

		if (serviceInfo.fields?.includes("subTypeSelection") && !selectedSubType) {
			toast.error("Missing Information", {
				description: "Please select a specific service type.",
			});
			return;
		}

		if (serviceInfo.appointmentType === "Book" && selectedBooks.length === 0) {
			toast.error("Missing Information", {
				description: "Please select at least one book.",
			});
			return;
		}
		
		if (serviceInfo.appointmentType === "Other") {
			const message = `${serviceInfo.name} booking is not yet available through this form.`;
			toast.info(message);
			return;
		}

		let mutationPayload: Parameters<typeof createAppointmentMutation.mutate>[0];

		if (serviceInfo.appointmentType === "Book") {
			mutationPayload = {
				appointmentType: "Book",
				appointmentDate: selectedDate.toISOString(),
				notes: notes || undefined,
				bookDetails: selectedBooks.map(book => ({ isbn: book.isbn, borrowQuantity: book.quantity })),
			};
		} else if (serviceInfo.appointmentType === "Sport" || serviceInfo.appointmentType === "Health") {
			if (!selectedTimeSlot) {
				toast.error("Invalid Time", { description: "Time slot is required."});
				return;
			}
			let startTimeStr: string;
			try {
				startTimeStr = convertTo24HourFormat(selectedTimeSlot);
			} catch (e: unknown) {
				const errorMessage = e instanceof Error ? e.message : "Selected time slot is invalid.";
				toast.error("Invalid Time", { description: errorMessage });
				return;
			}
			const startTimeDate = new Date(`1970-01-01T${startTimeStr}:00`);
			const endTimeDate = new Date(startTimeDate.getTime() + 60 * 60 * 1000); // Add 1 hour
			const endTimeStr = `${String(endTimeDate.getHours()).padStart(2, "0")}:${String(endTimeDate.getMinutes()).padStart(2, "0")}`;
			
			mutationPayload = {
				appointmentType: serviceInfo.appointmentType,
				appointmentDate: selectedDate.toISOString(),
				notes: notes || undefined,
				sportType: serviceInfo.appointmentType === "Sport" ? (selectedSubType || serviceInfo.defaultTypeDetail || "Sport Activity") : undefined,
				healthType: serviceInfo.appointmentType === "Health" ? (selectedSubType || serviceInfo.defaultTypeDetail || "Health Consultation") : undefined,
				startTime: startTimeStr,
				endTime: endTimeStr,
			};
		} else {
			toast.error(`Booking for ${serviceInfo.name} is not supported with the current configuration.`);
			return;
		}
		
		createAppointmentMutation.mutate(mutationPayload);
	};

	const handleBookSelection = (book: { isbn: string; title: string; currentQuantity: number }, quantityParam: number) => {
		let newQuantity = quantityParam;
		setSelectedBooks(prev => {
			const existingBookIndex = prev.findIndex(b => b.isbn === book.isbn);
			if (newQuantity <= 0) {
				return prev.filter(b => b.isbn !== book.isbn); // Remove if quantity is 0 or less
			}
			if (newQuantity > book.currentQuantity) {
				toast.info("Not enough stock", { description: `Cannot reserve more than ${book.currentQuantity} copies of ${book.title}.`});
				newQuantity = book.currentQuantity; // Cap at available quantity
			}
			if (existingBookIndex > -1) {
				const updatedBooks = [...prev];
				const bookToUpdate = updatedBooks[existingBookIndex];
				if (bookToUpdate) { // Check if bookToUpdate exists
					updatedBooks[existingBookIndex] = { ...bookToUpdate, quantity: newQuantity };
				}
				return updatedBooks;
			} 
			// No 'else' needed here since previous if has a return if newQuantity <= 0
			// and the main path is to add if not existing or update if existing.
			// However, the structure is: if existing -> update and return. If not existing (and quantity > 0) -> add and return.
			// So, if not (quantity <= 0) and not (existingBookIndex > -1), then add.
			return [...prev, { isbn: book.isbn, title: book.title, quantity: newQuantity }];
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
										setSelectedTimeSlot(null); 
										setSelectedSubType(null);
									}}
									className="rounded-md border"
									disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} 
								/>
							</CardContent>
						</Card>

						{serviceInfo.fields?.includes("time") && (
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
									{availableSlotsQuery.data?.map((slot) => (
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
						)}
					</div>

					{serviceInfo.fields?.includes("bookSelection") && (
						<Card>
							<CardHeader>
								<CardTitle>Select Books</CardTitle>
								<CardDescription>Search and select books to reserve for pickup.</CardDescription>
								<Input 
									placeholder="Search books by title, author, ISBN..."
									value={bookSearchTerm}
									onChange={(e) => setBookSearchTerm(e.target.value)}
									className="mt-2"
								/>
							</CardHeader>
							<CardContent className="space-y-4 max-h-96 overflow-y-auto">
								{listBooksQuery.isLoading && <p>Loading books...</p>}
								{listBooksQuery.isError && <p className="text-red-500">Error loading books: {listBooksQuery.error?.message}</p>}
								{listBooksQuery.data?.books.length === 0 && !listBooksQuery.isLoading && <p>No books found matching your search or no books available.</p>}
								{listBooksQuery.data?.books.map(book => (
									<div key={book.isbn} className="flex items-center justify-between p-2 border rounded-md">
										<div>
											<p className="font-semibold">{book.title}</p>
											<p className="text-sm text-muted-foreground">by {book.author || "N/A"} (ISBN: {book.isbn})</p>
											<p className="text-sm text-muted-foreground">Available: {book.currentQuantity}</p>
										</div>
										<div className="flex items-center gap-2">
											<Input 
												type="number"
												min="0"
												max={book.currentQuantity}
												value={selectedBooks.find(b => b.isbn === book.isbn)?.quantity || 0}
												onChange={(e) => handleBookSelection(book, Number.parseInt(e.target.value, 10))}
												className="w-20"
												disabled={createAppointmentMutation.isPending}
											/>
										</div>
									</div>
								))}
							</CardContent>
						</Card>
					)}

					{serviceInfo.fields?.includes("notes") && (
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

					{/* SubType Selection Dropdown */}
					{serviceInfo.fields?.includes("subTypeSelection") && serviceInfo.subTypes && (
						<div className="space-y-2">
							<Label htmlFor="subType">Specific Type</Label>
							<Select onValueChange={setSelectedSubType} value={selectedSubType ?? undefined}>
								<SelectTrigger id="subType">
									<SelectValue placeholder="Select a specific type" />
								</SelectTrigger>
								<SelectContent>
									{serviceInfo.subTypes.map((subType) => (
										<SelectItem key={subType} value={subType}>
											{subType}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<div className="mb-[80px] flex flex-col gap-2 sm:flex-row sm:justify-end">
						<Button variant="outline" asChild>
							<Link href="/appointments">Cancel</Link>
						</Button>
						<Button
							onClick={handleBooking}
							disabled={
								!selectedDate || 
								createAppointmentMutation.isPending || 
								(serviceInfo.fields?.includes("time") && (availableSlotsQuery.isLoading || !selectedTimeSlot)) ||
								(serviceInfo.fields?.includes("bookSelection") && (listBooksQuery.isLoading || selectedBooks.length === 0)) ||
								(serviceInfo.fields?.includes("subTypeSelection") && !selectedSubType)
							}
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