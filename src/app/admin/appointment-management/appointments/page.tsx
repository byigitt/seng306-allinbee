'use client';

import { DatePickerWithRange } from "@/app/_components/common/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppointmentStatus } from "@prisma/client";
import { Download, Filter, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

// Define RouterOutputs type
type RouterOutputs = inferRouterOutputs<AppRouter>;
type AppointmentWithRelations = RouterOutputs["appointments"]["adminListAllAppointments"]["appointments"][number];

// Helper function to get appointment type and details (adapted from my-appointments)
const getAppointmentTypeAndDetails = (appointment: AppointmentWithRelations) => {
	if (appointment.bookBorrowRecords && appointment.bookBorrowRecords.length > 0) {
		const books = appointment.bookBorrowRecords
			.map((bbr: AppointmentWithRelations["bookBorrowRecords"][number]) => `${bbr.book.title} (x${bbr.borrowQuantity})`)
			.join(", ");
		return { type: "Book Reservation", details: books, serviceName: books || "Library Books" };
	}
	if (appointment.sportAppointment) {
		return {
			type: "Sport Booking",
			details: `Sport: ${appointment.sportAppointment.sportType}`,
			serviceName: `Sport: ${appointment.sportAppointment.sportType}`,
		};
	}
	if (appointment.healthAppointment) {
		return {
			type: "Health Consultation",
			details: `Type: ${appointment.healthAppointment.healthType}`,
			serviceName: `Health: ${appointment.healthAppointment.healthType}`,
		};
	}
	return { type: "General", details: "N/A", serviceName: "General Appointment" };
};


const ITEMS_PER_PAGE = 10;

export default function ViewAppointmentsAdminPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
		"all"
	);
	const [currentDateRange, setCurrentDateRange] = useState<DateRange | undefined>(undefined);
	const [currentPage, setCurrentPage] = useState(1);

	const queryInput = useMemo(() => ({
		status: statusFilter === "all" ? undefined : statusFilter,
		dateFrom: currentDateRange?.from?.toISOString(),
		dateTo: currentDateRange?.to?.toISOString(),
		take: ITEMS_PER_PAGE,
		skip: (currentPage - 1) * ITEMS_PER_PAGE,
	}), [statusFilter, currentDateRange, currentPage]);

	const {
		data: appointmentsData,
		isLoading,
		isError,
		error,
		refetch,
	} = api.appointments.adminListAllAppointments.useQuery(queryInput, {
		placeholderData: (previousData) => previousData,
	});

	useEffect(() => {
		if (isError && error) {
			toast.error(`Failed to load appointments: ${error.message}`);
		}
	}, [isError, error]);

	const [cancellingId, setCancellingId] = useState<string | null>(null);

	const cancelAppointmentMutation = api.appointments.cancelAppointment.useMutation({
		onMutate: (variables) => {
			setCancellingId(variables.appointmentId);
		},
		onSuccess: (data, variables) => {
			toast.success(
				`Appointment ID ${variables.appointmentId} cancelled successfully.`
			);
			refetch();
		},
		onError: (err, variables) => {
			toast.error(
				`Failed to cancel appointment ID ${variables.appointmentId}: ${err.message}`
			);
		},
		onSettled: () => {
			setCancellingId(null);
		}
	});

	const handleCancelAppointment = (appointmentId: string) => {
		if (
			window.confirm("Are you sure you want to cancel this appointment?")
		) {
			cancelAppointmentMutation.mutate({ appointmentId });
		}
	};

	const filteredAppointments = useMemo(() => {
		if (!appointmentsData?.appointments) return [];
		if (!searchTerm) return appointmentsData.appointments;

		return appointmentsData.appointments.filter((appt) => {
			const studentName = `${appt.takenByStudent?.user?.fName ?? ""} ${appt.takenByStudent?.user?.lName ?? ""}`.toLowerCase();
			const studentEmail = appt.takenByStudent?.user?.email?.toLowerCase() ?? "";
			const serviceInfo = getAppointmentTypeAndDetails(appt).serviceName.toLowerCase();
			
			const searchLower = searchTerm.toLowerCase();
			return studentName.includes(searchLower) || studentEmail.includes(searchLower) || serviceInfo.includes(searchLower);
		});
	}, [appointmentsData, searchTerm]);
	

	const totalAppointments = appointmentsData?.totalCount ?? 0;
	const totalPages = Math.ceil(totalAppointments / ITEMS_PER_PAGE);

	const handleApplyFilters = () => {
		setCurrentPage(1);
		refetch();
	};

	const appointmentStatuses: AppointmentStatus[] = [
		"Scheduled",
		"Completed",
		"Cancelled",
		"NoShow",
	];

	return (
		<div className="space-y-6 p-2 sm:p-0">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/admin/appointment-management">
						<ArrowLeft className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="font-semibold text-xl md:text-2xl">
						View All Appointments
					</h1>
					<p className="text-muted-foreground">
						Review and manage all user appointments.
					</p>
				</div>
			</div>

			<Card className="w-full">
				<CardHeader className="p-4">
					<CardTitle>Filter & Export</CardTitle>
					<div className="flex flex-col gap-4 pt-2 md:flex-row md:flex-wrap md:items-end md:justify-between">
						<div className="flex flex-col flex-wrap gap-3 md:flex-row md:items-center md:gap-2">
							<div className="relative w-full md:max-w-xs">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
									type="search"
								placeholder="Search by user or service..."
									className="w-full rounded-lg bg-background pl-8"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
							<DatePickerWithRange
								date={currentDateRange}
								onDateChange={setCurrentDateRange}
								className="w-full md:w-auto"
							/>
							<Select
								value={statusFilter}
								onValueChange={(value) =>
									setStatusFilter(value as AppointmentStatus | "all")
								}
							>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
									{appointmentStatuses.map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
                        </SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2 md:shrink-0 md:flex-row md:gap-2">
							<Button
								variant="outline"
								className="w-full md:w-auto"
								onClick={handleApplyFilters}
								disabled={isLoading}
							>
								<Filter className="mr-2 h-4 w-4" /> Apply Filters
							</Button>
							<Button variant="outline" className="w-full md:w-auto" disabled>
								<Download className="mr-2 h-4 w-4" /> Export Data
							</Button>
						</div>
					</div>
				</CardHeader>
			</Card>

			<Card className="mb-[80px] w-full">
				<CardHeader className="p-4">
					<CardTitle>Scheduled Appointments ({isLoading ? '...' : totalAppointments})</CardTitle>
				</CardHeader>
				<CardContent className="p-0 md:p-4">
					{isLoading && <p className="p-4 text-center">Loading appointments...</p>}
					{!isLoading && filteredAppointments.length === 0 && (
						<p className="p-4 text-center text-muted-foreground">
							No appointments found matching your criteria.
						</p>
					)}
					{!isLoading && filteredAppointments.length > 0 && (
						<>
							{/* Desktop Table */}
					<div className="hidden overflow-x-auto md:block">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Service</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Time</TableHead>
									<TableHead>Status</TableHead>
											<TableHead>Staff</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
										{filteredAppointments.map((appt) => {
											const { serviceName } = getAppointmentTypeAndDetails(appt);
											const appointmentTime = appt.sportAppointment?.startTime ?? appt.healthAppointment?.startTime;
											const displayTime = appointmentTime 
												? new Date(appointmentTime).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })
												: 'N/A';

											return (
												<TableRow key={appt.appointmentId}>
													<TableCell>
														{appt.takenByStudent?.user?.name ?? "N/A"}
														<br />
														<span className="text-xs text-muted-foreground">
															{appt.takenByStudent?.user?.email ?? ''}
														</span>
													</TableCell>
													<TableCell>{serviceName}</TableCell>
										<TableCell>
														{new Date(
															appt.appointmentDate
														).toLocaleDateString("en-CA")}
										</TableCell>
													<TableCell>{displayTime}</TableCell>
										<TableCell>
											<Badge
												variant={
																appt.appointmentStatus === "Scheduled"
																	? "default"
																	: appt.appointmentStatus === "Completed"
														? "default"
																		: appt.appointmentStatus === "Cancelled" || appt.appointmentStatus === "NoShow"
															? "destructive"
															: "secondary"
												}
											>
															{appt.appointmentStatus}
											</Badge>
										</TableCell>
													<TableCell>{appt.managedByStaff?.user?.name ?? "N/A"}</TableCell>
										<TableCell>
											<Button
												variant="outline"
												size="sm"
															disabled={
																appt.appointmentStatus !== "Scheduled" || cancelAppointmentMutation.isPending
															}
															onClick={() =>
																handleCancelAppointment(appt.appointmentId)
															}
											>
															{cancellingId === appt.appointmentId ? "Cancelling..." : "Cancel"}
											</Button>
										</TableCell>
									</TableRow>
											);
										})}
							</TableBody>
						</Table>
					</div>

							{/* Mobile Card List */}
					<div className="block space-y-4 p-2 sm:p-4 md:hidden ">
								{filteredAppointments.map((appt) => {
									const { serviceName } = getAppointmentTypeAndDetails(appt);
									const appointmentTime = appt.sportAppointment?.startTime ?? appt.healthAppointment?.startTime;
									const displayTime = appointmentTime 
										? new Date(appointmentTime).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })
										: 'N/A';
									return (
							<Card
											key={`${appt.appointmentId}-mobile`}
											className="w-full overflow-hidden rounded-lg border shadow-md"
							>
											<CardHeader className="bg-muted/30 p-3">
												<div className="flex items-start justify-between gap-2">
										<CardTitle className="flex-1 break-words font-semibold text-md leading-snug">
														{serviceName}
										</CardTitle>
										<Badge
											variant={
															appt.appointmentStatus === "Scheduled"
																? "default"
																: appt.appointmentStatus === "Completed"
													? "default"
																	: appt.appointmentStatus === "Cancelled" || appt.appointmentStatus === "NoShow"
														? "destructive"
														: "secondary"
											}
											className="ml-2 shrink-0 whitespace-nowrap px-2 py-1 text-xs"
										>
														{appt.appointmentStatus}
										</Badge>
									</div>
								</CardHeader>
											<CardContent className="space-y-2 p-3 text-sm">
									<div className="flex items-center">
													<span className="w-20 font-medium text-muted-foreground text-xs">
											User:
										</span>
										<span className="flex-1 break-words text-foreground">
														{appt.takenByStudent?.user?.name ?? "N/A"} ({appt.takenByStudent?.user?.email ?? ''})
										</span>
									</div>
									<div className="flex items-center">
													<span className="w-20 font-medium text-muted-foreground text-xs">
											Date:
										</span>
										<span className="text-foreground">
														{new Date(
															appt.appointmentDate
														).toLocaleDateString("en-CA")}
										</span>
									</div>
									<div className="flex items-center">
													<span className="w-20 font-medium text-muted-foreground text-xs">
											Time:
										</span>
													<span className="text-foreground">{displayTime}</span>
												</div>
												<div className="flex items-center">
													<span className="w-20 font-medium text-muted-foreground text-xs">
														Staff:
													</span>
													<span className="text-foreground">{appt.managedByStaff?.user?.name ?? "N/A"}</span>
									</div>
												{appt.appointmentStatus === "Scheduled" && (
										<Button
											variant="outline"
											size="sm"
														className="mt-3 w-full border-destructive text-destructive hover:bg-destructive/5 hover:text-destructive"
														disabled={cancelAppointmentMutation.isPending}
														onClick={() =>
															handleCancelAppointment(appt.appointmentId)
														}
													>
														{cancellingId === appt.appointmentId ? "Cancelling..." : "Cancel Appointment"}
										</Button>
									)}
								</CardContent>
							</Card>
									);
								})}
					</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Pagination Controls */}
			{!isLoading && totalPages > 1 && (
				<div className="flex items-center justify-center space-x-2 py-4">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
						disabled={currentPage === 1 || isLoading}
					>
						Previous
					</Button>
					<span>
						Page {currentPage} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							setCurrentPage((prev) => Math.min(prev + 1, totalPages))
						}
						disabled={currentPage === totalPages || isLoading}
					>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}
