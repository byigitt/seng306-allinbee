"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, MapPin, PlusCircle, Trash2, Save, AlertTriangle, Loader2, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";
import type { Decimal } from "@prisma/client/runtime/library";

// Type definitions from tRPC
type RouterOutputs = inferRouterOutputs<AppRouter>;
type StationFromServer = RouterOutputs["ringTracking"]["listStations"]["stations"][number];

// Zod schema for station form
const stationFormSchema = z.object({
	stationName: z.string().min(1, "Station name is required."),
	stationLatitude: z.coerce
		.number({ invalid_type_error: "Latitude must be a number." })
		.min(-90, "Latitude must be between -90 and 90.")
		.max(90, "Latitude must be between -90 and 90."),
	stationLongitude: z.coerce
		.number({ invalid_type_error: "Longitude must be a number." })
		.min(-180, "Longitude must be between -180 and 180.")
		.max(180, "Longitude must be between -180 and 180."),
});
type StationFormValues = z.infer<typeof stationFormSchema>;

const ITEMS_PER_PAGE = 10;

export default function ManageBusStationsPage() {
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	
	const [selectedStationForEdit, setSelectedStationForEdit] = useState<StationFromServer | null>(null);
	const [selectedStationForDelete, setSelectedStationForDelete] = useState<StationFromServer | null>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	const utils = api.useUtils();

	const stationsQuery = api.ringTracking.listStations.useQuery(
		{ 
			filterByName: searchTerm || undefined, 
			take: ITEMS_PER_PAGE, 
			skip: (currentPage - 1) * ITEMS_PER_PAGE 
		},
		{ placeholderData: (previousData) => previousData }
	);

	const addStationForm = useForm<StationFormValues>({
		resolver: zodResolver(stationFormSchema),
		defaultValues: { stationName: "", stationLatitude: 0, stationLongitude: 0 },
	});

	const editStationForm = useForm<StationFormValues>({
		resolver: zodResolver(stationFormSchema),
	});

	useEffect(() => {
		if (selectedStationForEdit) {
			editStationForm.reset({
				stationName: selectedStationForEdit.stationName,
				stationLatitude: Number.parseFloat(selectedStationForEdit.stationLatitude as unknown as string), // Convert string to number
				stationLongitude: Number.parseFloat(selectedStationForEdit.stationLongitude as unknown as string), // Convert string to number
			});
		} else {
			editStationForm.reset({ stationName: "", stationLatitude: 0, stationLongitude: 0 });
		}
	}, [selectedStationForEdit, editStationForm]);

	const createStationMutation = api.ringTracking.createStation.useMutation({
		onSuccess: (data) => {
			toast.success(`Station "${data.stationName}" created!`);
			utils.ringTracking.listStations.invalidate();
			setIsAddDialogOpen(false);
			addStationForm.reset();
		},
		onError: (error) => {
			toast.error(`Failed to create station: ${error.message}`);
			if (error.data?.zodError) {
				for (const fieldError of error.data.zodError.fieldErrors.stationLatitude ?? []) addStationForm.setError("stationLatitude", { message: fieldError });
				for (const fieldError of error.data.zodError.fieldErrors.stationLongitude ?? []) addStationForm.setError("stationLongitude", { message: fieldError });
				for (const fieldError of error.data.zodError.fieldErrors.stationName ?? []) addStationForm.setError("stationName", { message: fieldError });
			}
		},
	});

	const updateStationMutation = api.ringTracking.updateStation.useMutation({
		onSuccess: (data) => {
			toast.success(`Station "${data.stationName}" updated!`);
			utils.ringTracking.listStations.invalidate();
			setIsEditDialogOpen(false);
			setSelectedStationForEdit(null);
		},
		onError: (error) => {
			toast.error(`Failed to update station: ${error.message}`);
			if (error.data?.zodError) {
				for (const fieldError of error.data.zodError.fieldErrors.stationLatitude ?? []) editStationForm.setError("stationLatitude", { message: fieldError });
				for (const fieldError of error.data.zodError.fieldErrors.stationLongitude ?? []) editStationForm.setError("stationLongitude", { message: fieldError });
				for (const fieldError of error.data.zodError.fieldErrors.stationName ?? []) editStationForm.setError("stationName", { message: fieldError });
			}
		},
	});
	
	const deleteStationMutation = api.ringTracking.deleteStation.useMutation({
		onSuccess: (_, variables) => {
			const stationName = selectedStationForDelete?.stationName ?? `Station ID ${variables.stationId.substring(0,6)}`;
			toast.success(`Station "${stationName}" deleted.`);
			utils.ringTracking.listStations.invalidate();
			setIsDeleteDialogOpen(false);
			setSelectedStationForDelete(null);
			// If on last page and it becomes empty, go to previous page
			if (stationsQuery.data?.stations.length === 1 && currentPage > 1) {
				setCurrentPage(currentPage - 1);
			}
		},
		onError: (error) => toast.error(`Failed to delete station: ${error.message}`),
	});

	const handleAddStationSubmit = (values: StationFormValues) => {
		createStationMutation.mutate(values);
	};

	const handleEditStationSubmit = (values: StationFormValues) => {
		if (!selectedStationForEdit) return;
		updateStationMutation.mutate({
			stationId: selectedStationForEdit.stationId,
			...values,
		});
	};
	
	const openEditDialog = (station: StationFromServer) => {
		setSelectedStationForEdit(station);
		setIsEditDialogOpen(true);
	};
	
	const openDeleteDialog = (station: StationFromServer) => {
		setSelectedStationForDelete(station);
		setIsDeleteDialogOpen(true);
	};

	const confirmDeleteStation = () => {
		if (!selectedStationForDelete) return;
		deleteStationMutation.mutate({ stationId: selectedStationForDelete.stationId });
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
		setCurrentPage(1); // Reset to first page on new search
	};

	if (stationsQuery.isLoading && !stationsQuery.isPlaceholderData) {
		return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading station data...</span></div>;
	}

	if (stationsQuery.isError) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-destructive">
				<AlertTriangle className="h-12 w-12 mb-2" />
				<p className="text-lg font-semibold">Error loading stations</p>
				<p>{stationsQuery.error?.message}</p>
				<Button onClick={() => stationsQuery.refetch()} className="mt-4">Retry</Button>
			</div>
		);
	}
	
	const { stations = [], totalCount = 0 } = stationsQuery.data ?? {};
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

	return (
		<div className="space-y-6 p-1 md:p-0">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-xl md:text-2xl">Manage Bus Stations</h1>
					<p className="text-muted-foreground">
						Add, edit, or remove ring bus stop locations.
					</p>
				</div>
				<Button onClick={() => { addStationForm.reset(); setIsAddDialogOpen(true); }}>
					<PlusCircle className="mr-2 h-4 w-4" /> Add New Station
				</Button>
			</div>

			{/* Search Input */}
			<div className="flex items-center">
				<Input
					placeholder="Search stations by name..."
					value={searchTerm}
					onChange={handleSearchChange}
					className="max-w-sm"
				/>
				{searchTerm && (
					<Button variant="ghost" size="icon" onClick={() => setSearchTerm("")} className="ml-2">
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>


			{/* Add Station Dialog */}
			<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add New Bus Station</DialogTitle>
						<DialogDescription>
							Enter the details for the new bus station.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={addStationForm.handleSubmit(handleAddStationSubmit)} className="space-y-4">
						<div>
							<Label htmlFor="add-stationName">Station Name</Label>
							<Input id="add-stationName" {...addStationForm.register("stationName")} />
							{addStationForm.formState.errors.stationName && <p className="text-red-500 text-xs mt-1">{addStationForm.formState.errors.stationName.message}</p>}
						</div>
						<div>
							<Label htmlFor="add-stationLatitude">Latitude</Label>
							<Input id="add-stationLatitude" type="number" step="any" {...addStationForm.register("stationLatitude")} />
							{addStationForm.formState.errors.stationLatitude && <p className="text-red-500 text-xs mt-1">{addStationForm.formState.errors.stationLatitude.message}</p>}
						</div>
						<div>
							<Label htmlFor="add-stationLongitude">Longitude</Label>
							<Input id="add-stationLongitude" type="number" step="any" {...addStationForm.register("stationLongitude")} />
							{addStationForm.formState.errors.stationLongitude && <p className="text-red-500 text-xs mt-1">{addStationForm.formState.errors.stationLongitude.message}</p>}
						</div>
						<DialogFooter>
							<DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
							<Button type="submit" disabled={createStationMutation.isPending}>
								{createStationMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : "Add Station"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit Station Dialog */}
			{selectedStationForEdit && (
				<Dialog open={isEditDialogOpen} onOpenChange={(open) => { if(!open) setSelectedStationForEdit(null); setIsEditDialogOpen(open); }}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Station: {selectedStationForEdit.stationName}</DialogTitle>
							<DialogDescription>
								Update station details.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={editStationForm.handleSubmit(handleEditStationSubmit)} className="space-y-4">
							<div>
								<Label htmlFor="edit-stationName">Station Name</Label>
								<Input id="edit-stationName" {...editStationForm.register("stationName")} />
								{editStationForm.formState.errors.stationName && <p className="text-red-500 text-xs mt-1">{editStationForm.formState.errors.stationName.message}</p>}
							</div>
							<div>
								<Label htmlFor="edit-stationLatitude">Latitude</Label>
								<Input id="edit-stationLatitude" type="number" step="any" {...editStationForm.register("stationLatitude")} />
								{editStationForm.formState.errors.stationLatitude && <p className="text-red-500 text-xs mt-1">{editStationForm.formState.errors.stationLatitude.message}</p>}
							</div>
							<div>
								<Label htmlFor="edit-stationLongitude">Longitude</Label>
								<Input id="edit-stationLongitude" type="number" step="any" {...editStationForm.register("stationLongitude")} />
								{editStationForm.formState.errors.stationLongitude && <p className="text-red-500 text-xs mt-1">{editStationForm.formState.errors.stationLongitude.message}</p>}
							</div>
							<DialogFooter>
								<DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
								<Button type="submit" disabled={updateStationMutation.isPending}>
									{updateStationMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			)}

			{/* Delete Station Dialog */}
			{selectedStationForDelete && (
				<Dialog open={isDeleteDialogOpen} onOpenChange={(open) => { if(!open) setSelectedStationForDelete(null); setIsDeleteDialogOpen(open);}}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete Station: {selectedStationForDelete.stationName}?</DialogTitle>
							<DialogDescription className="py-2">
								Are you sure you want to delete this station? This action cannot be undone.
								If this station is part of any routes, deletion might be restricted.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
							<Button variant="destructive" onClick={confirmDeleteStation} disabled={deleteStationMutation.isPending}>
								{deleteStationMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : <><Trash2 className="mr-2 h-4 w-4" /> Delete Station</>}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			<Card className="mb-[80px]">
				<CardHeader>
					<CardTitle>
						Existing Bus Stations ({stationsQuery.isFetching ? <Loader2 className="inline-block h-5 w-5 animate-spin" /> : totalCount})
					</CardTitle>
				</CardHeader>
				<CardContent>
					{stationsQuery.isLoading && stationsQuery.isPlaceholderData && (
						<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
					)}
					{!stationsQuery.isLoading && !stationsQuery.isPlaceholderData && stations.length === 0 && (
						<p className="text-muted-foreground text-center py-8">
							{searchTerm ? `No stations found matching "${searchTerm}".` : "No bus stations found. Add some to get started."}
						</p>
					)}
					{stations.length > 0 && (
						<div className="divide-y divide-border">
							{stations.map((station) => (
								<div key={station.stationId} className="p-3 hover:bg-muted/50">
									<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
										<div>
											<h3 className="flex items-center font-medium text-base">
												<MapPin className="mr-2 h-5 w-5 text-primary" />
												{station.stationName}
											</h3>
											<div className="text-muted-foreground text-xs mt-1 space-x-2">
												<span>ID: {station.stationId.substring(0,8)}...</span>
												<span>Lat: {Number.parseFloat(station.stationLatitude as unknown as string).toFixed(4)}</span>
												<span>Lon: {Number.parseFloat(station.stationLongitude as unknown as string).toFixed(4)}</span>
												{/* TODO: Display number of routes serving this station if available from API */}
											</div>
										</div>
										<div className="mt-2 flex shrink-0 gap-2 sm:mt-0">
											<Button variant="outline" size="sm" onClick={() => openEditDialog(station)}>
												<Edit className="mr-1 h-3 w-3" /> Edit
											</Button>
											<Button variant="destructive" size="sm" onClick={() => openDeleteDialog(station)}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
			
			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center space-x-2 py-4">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
						disabled={currentPage === 1 || stationsQuery.isFetching}
					>
						<ChevronLeft className="h-4 w-4 mr-1" />
						Previous
					</Button>
					<span className="text-sm text-muted-foreground">
						Page {currentPage} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
						disabled={currentPage === totalPages || stationsQuery.isFetching}
					>
						Next
						<ChevronRight className="h-4 w-4 ml-1" />
					</Button>
				</div>
			)}

			<Button variant="link" asChild className="mt-4 mb-[80px]">
				<Link href="/admin/ring-tracking-management">
					Back to Ring Tracking Overview
				</Link>
			</Button>
		</div>
	);
}
