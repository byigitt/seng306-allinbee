"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, PlusCircle, Route as RouteIcon, Trash2, Save, AlertTriangle, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";

// Type definitions from tRPC
type RouterOutputs = inferRouterOutputs<AppRouter>;
type RouteFromServer = RouterOutputs["ringTracking"]["listRoutes"]["routes"][number];
type StationFromServer = RouterOutputs["ringTracking"]["listStations"]["stations"][number];

// Zod schema for basic route details
const routeFormSchema = z.object({
	routeName: z.string().min(1, "Route name is required."),
	departureTimesRaw: z.string().optional(), // Raw comma-separated HH:MM strings
});
type RouteFormValues = z.infer<typeof routeFormSchema>;

// Zod schema for a single station entry in the form
const routeStationFormSchema = z.object({
	stationId: z.string().uuid(),
	stationName: z.string(), // For display
	stopOrder: z.coerce.number().int().min(1, "Stop order must be 1 or greater."),
	isSelected: z.boolean(),
});
type RouteStationFormValues = z.infer<typeof routeStationFormSchema>;

// Zod schema for the station management part of the form
const stationManagementFormSchema = z.object({
	stations: z.array(routeStationFormSchema),
});
type StationManagementFormValues = z.infer<typeof stationManagementFormSchema>;


export default function ManageBusRoutesPage() {
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	
	const [selectedRouteForEdit, setSelectedRouteForEdit] = useState<RouteFromServer | null>(null);
	const [selectedRouteForDelete, setSelectedRouteForDelete] = useState<RouteFromServer | null>(null);

	const utils = api.useUtils();

	const routesQuery = api.ringTracking.listRoutes.useQuery(
		{ take: 100 }, // Fetch more routes for admin view
		{ placeholderData: (prev) => prev }
	);
	const allStationsQuery = api.ringTracking.listStations.useQuery(
		{ take: 1000 }, // Fetch all stations for selection
		{ placeholderData: (prev) => prev }
	);

	// Add Route Form
	const addRouteForm = useForm<RouteFormValues>({
		resolver: zodResolver(routeFormSchema),
		defaultValues: { routeName: "", departureTimesRaw: "" },
	});

	// Edit Route Form (basic details)
	const editRouteForm = useForm<RouteFormValues>({
		resolver: zodResolver(routeFormSchema),
	});
	
	// Station Management Form (within Edit Dialog)
	const stationManagementForm = useForm<StationManagementFormValues>({
		resolver: zodResolver(stationManagementFormSchema),
		defaultValues: { stations: [] },
	});
	const { fields: stationFields, replace: replaceStations } = useFieldArray({
		control: stationManagementForm.control,
		name: "stations",
	});


	useEffect(() => {
		if (selectedRouteForEdit && allStationsQuery.data) {
			editRouteForm.reset({
				routeName: selectedRouteForEdit.routeName,
				departureTimesRaw: selectedRouteForEdit.departureTimes
					.map(dt => `${new Date(dt.departureTime).getUTCHours().toString().padStart(2, '0')}:${new Date(dt.departureTime).getUTCMinutes().toString().padStart(2, '0')}`)
					.join(", "),
			});

			// Initialize station management form
			const routeStationIds = new Set(selectedRouteForEdit.routeStations.map(rs => rs.stationId));
			const initialStationsForForm = allStationsQuery.data.stations.map(station => {
				const existingRouteStation = selectedRouteForEdit.routeStations.find(rs => rs.stationId === station.stationId);
				return {
					stationId: station.stationId,
					stationName: station.stationName,
					isSelected: routeStationIds.has(station.stationId),
					stopOrder: existingRouteStation?.stopOrder ?? 1, // Default or existing
				};
			});
			replaceStations(initialStationsForForm);

		} else if (!selectedRouteForEdit) {
			editRouteForm.reset({ routeName: "", departureTimesRaw: "" });
			replaceStations([]);
		}
	}, [selectedRouteForEdit, allStationsQuery.data, editRouteForm, replaceStations]);


	const createRouteMutation = api.ringTracking.createRoute.useMutation({
		onSuccess: (data) => {
			toast.success(`Route "${data.routeName}" created!`);
			utils.ringTracking.listRoutes.invalidate();
			setIsAddDialogOpen(false);
			addRouteForm.reset();
		},
		onError: (error) => toast.error(`Failed to create route: ${error.message}`),
	});

	const updateRouteMutation = api.ringTracking.updateRoute.useMutation({
		// onSuccess will be handled within the dialog submit to chain with station updates
		onError: (error) => toast.error(`Failed to update route details: ${error.message}`),
	});

	const updateRouteStationsMutation = api.ringTracking.updateRouteStations.useMutation({
		onSuccess: (data) => {
			toast.success(`Stations for route "${data.routeName}" updated!`);
			utils.ringTracking.listRoutes.invalidate();
			// Potentially refetch getRoute if displaying single route details elsewhere
		},
		onError: (error) => toast.error(`Failed to update route stations: ${error.message}`),
	});
	
	const deleteRouteMutation = api.ringTracking.deleteRoute.useMutation({
		onSuccess: (_, variables) => {
			const routeName = selectedRouteForDelete?.routeName ?? `Route ID ${variables.routeId.substring(0,6)}`;
			toast.success(`Route "${routeName}" deleted.`);
			utils.ringTracking.listRoutes.invalidate();
			setIsDeleteDialogOpen(false);
			setSelectedRouteForDelete(null);
		},
		onError: (error) => toast.error(`Failed to delete route: ${error.message}`),
	});


	const handleAddRouteSubmit = (values: RouteFormValues) => {
		const departureTimes = values.departureTimesRaw
			?.split(',')
			.map(t => t.trim())
			.filter(t => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(t)); // Basic HH:MM validation

		createRouteMutation.mutate({
			routeName: values.routeName,
			departureTimes: departureTimes,
		});
	};

	const handleEditRouteSubmit = async (routeDetailsValues: RouteFormValues) => {
		if (!selectedRouteForEdit) return;

		const stationManagementValues = stationManagementForm.getValues();
		const selectedStationsForUpdate = stationManagementValues.stations
			.filter(s => s.isSelected)
			.map(s => ({ stationId: s.stationId, stopOrder: s.stopOrder }));
		
		// Validate unique stop orders among selected stations
		const stopOrders = selectedStationsForUpdate.map(s => s.stopOrder);
		if (new Set(stopOrders).size !== stopOrders.length && stopOrders.length > 0) {
			stationManagementForm.setError("stations", { type: "manual", message: "Stop orders for selected stations must be unique." });
			toast.error("Error: Stop orders for selected stations must be unique.");
			return;
		}

		const departureTimes = routeDetailsValues.departureTimesRaw
			?.split(',')
			.map(t => t.trim())
			.filter(t => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(t));

		try {
			// 1. Update route name and departure times
			await updateRouteMutation.mutateAsync({
				routeId: selectedRouteForEdit.routeId,
				routeName: routeDetailsValues.routeName,
				departureTimes: departureTimes,
			});
			toast.success(`Route "${routeDetailsValues.routeName}" details updated!`);

			// 2. Update route stations
			await updateRouteStationsMutation.mutateAsync({
				routeId: selectedRouteForEdit.routeId,
				stations: selectedStationsForUpdate,
			});
			// Success toast for stations is handled by its own onSuccess

			utils.ringTracking.listRoutes.invalidate(); // Invalidate once after both succeed
			setIsEditDialogOpen(false);
			setSelectedRouteForEdit(null);

		} catch (error) {
			// Errors are handled by individual mutation onError, but good to have a catch-all
			console.error("Error during route update process:", error);
			// No toast here, individual mutations should show it
		}
	};

	const openEditDialog = (route: RouteFromServer) => {
		setSelectedRouteForEdit(route);
		setIsEditDialogOpen(true);
	};
	
	const openDeleteDialog = (route: RouteFromServer) => {
		setSelectedRouteForDelete(route);
		setIsDeleteDialogOpen(true);
	};

	const confirmDeleteRoute = () => {
		if (!selectedRouteForDelete) return;
		deleteRouteMutation.mutate({ routeId: selectedRouteForDelete.routeId });
	};

	if (routesQuery.isLoading || allStationsQuery.isLoading) {
		return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading route data...</span></div>;
	}

	if (routesQuery.isError || allStationsQuery.isError) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-destructive">
				<AlertTriangle className="h-12 w-12 mb-2" />
				<p className="text-lg font-semibold">Error loading data</p>
				<p>{routesQuery.error?.message ?? allStationsQuery.error?.message}</p>
				<Button onClick={() => { routesQuery.refetch(); allStationsQuery.refetch(); }} className="mt-4">Retry</Button>
			</div>
		);
	}
	
	const { routes = [], totalCount = 0 } = routesQuery.data ?? {};

	return (
		<div className="space-y-6 p-1 md:p-0">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-xl md:text-2xl">Manage Bus Routes</h1>
					<p className="text-muted-foreground">
						Add, edit, or remove ring bus routes and their stations.
					</p>
				</div>
				<Button onClick={() => setIsAddDialogOpen(true)}>
					<PlusCircle className="mr-2 h-4 w-4" /> Add New Route
				</Button>
			</div>

			{/* Add Route Dialog */}
			<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add New Bus Route</DialogTitle>
						<DialogDescription>
							Enter the details for the new bus route. Stations and detailed departure times can be added after creation via "Edit".
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={addRouteForm.handleSubmit(handleAddRouteSubmit)} className="space-y-4">
						<div>
							<Label htmlFor="add-routeName">Route Name</Label>
							<Input id="add-routeName" {...addRouteForm.register("routeName")} />
							{addRouteForm.formState.errors.routeName && <p className="text-red-500 text-xs mt-1">{addRouteForm.formState.errors.routeName.message}</p>}
						</div>
						<div>
							<Label htmlFor="add-departureTimesRaw">Departure Times (HH:MM, comma-separated)</Label>
							<Input id="add-departureTimesRaw" {...addRouteForm.register("departureTimesRaw")} placeholder="e.g., 09:00, 10:30, 14:15" />
							{/* Basic validation is in handler, zod schema doesn't strictly enforce regex array here for simplicity */}
						</div>
						<DialogFooter>
							<DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
							<Button type="submit" disabled={createRouteMutation.isPending}>
								{createRouteMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : "Add Route"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit Route Dialog */}
			{selectedRouteForEdit && (
				<Dialog open={isEditDialogOpen} onOpenChange={(open) => { if(!open) setSelectedRouteForEdit(null); setIsEditDialogOpen(open); }}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Edit Route: {selectedRouteForEdit.routeName}</DialogTitle>
							<DialogDescription>
								Update route details, departure times, and manage assigned stations.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={editRouteForm.handleSubmit(handleEditRouteSubmit)} className="space-y-6">
							{/* Route Details Form Part */}
							<div>
								<Label htmlFor="edit-routeName">Route Name</Label>
								<Input id="edit-routeName" {...editRouteForm.register("routeName")} />
								{editRouteForm.formState.errors.routeName && <p className="text-red-500 text-xs mt-1">{editRouteForm.formState.errors.routeName.message}</p>}
							</div>
							<div>
								<Label htmlFor="edit-departureTimesRaw">Departure Times (HH:MM, comma-separated)</Label>
								<Input id="edit-departureTimesRaw" {...editRouteForm.register("departureTimesRaw")} placeholder="e.g., 09:00, 10:30, 14:15" />
							</div>

							{/* Station Management Form Part */}
      <Card>
								<CardHeader><CardTitle className="text-lg">Manage Stations</CardTitle></CardHeader>
								<CardContent>
									{stationManagementForm.formState.errors.stations && (
										<p className="text-red-500 text-sm mb-2">{stationManagementForm.formState.errors.stations.message || stationManagementForm.formState.errors.stations.root?.message}</p>
									)}
									<ScrollArea className="h-64 border rounded-md p-2">
										{stationFields.map((field, index) => (
											<div key={field.id} className="flex items-center justify-between p-2 border-b last:border-b-0 hover:bg-muted/50">
												<div className="flex items-center gap-2">
													<Controller
														name={`stations.${index}.isSelected`}
														control={stationManagementForm.control}
														render={({ field: checkboxField }) => (
															<Checkbox
																id={`station-${field.stationId}`}
																checked={checkboxField.value}
																onCheckedChange={checkboxField.onChange}
															/>
														)}
													/>
													<Label htmlFor={`station-${field.stationId}`} className="font-normal cursor-pointer">
														{stationManagementForm.getValues(`stations.${index}.stationName`)}
													</Label>
												</div>
												{stationManagementForm.watch(`stations.${index}.isSelected`) && (
													<div className="flex items-center gap-2">
														<Label htmlFor={`stopOrder-${field.stationId}`} className="text-xs">Order:</Label>
														<Controller
															name={`stations.${index}.stopOrder`}
															control={stationManagementForm.control}
															render={({ field: orderField }) => (
																<Input
																	id={`stopOrder-${field.stationId}`}
																	type="number"
																	min="1"
																	{...orderField}
																	className="h-8 w-16 text-sm"
																/>
															)}
														/>
													</div>
												)}
											</div>
										))}
										{allStationsQuery.data?.stations.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No stations available to assign.</p>}
									</ScrollArea>
        </CardContent>
      </Card> 
							
							<DialogFooter>
								<DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
								<Button type="submit" disabled={updateRouteMutation.isPending || updateRouteStationsMutation.isPending}>
									{(updateRouteMutation.isPending || updateRouteStationsMutation.isPending) ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			)}

			{/* Delete Route Dialog */}
			{selectedRouteForDelete && (
				<Dialog open={isDeleteDialogOpen} onOpenChange={(open) => { if(!open) setSelectedRouteForDelete(null); setIsDeleteDialogOpen(open);}}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete Route: {selectedRouteForDelete.routeName}?</DialogTitle>
							<DialogDescription className="py-2">
								Are you sure you want to delete this route? This action will also remove all associated departure times and station assignments. This cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
							<Button variant="destructive" onClick={confirmDeleteRoute} disabled={deleteRouteMutation.isPending}>
								{deleteRouteMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : <><Trash2 className="mr-2 h-4 w-4" /> Delete Route</>}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			<Card className="mb-[80px]">
				<CardHeader>
					<CardTitle>Existing Bus Routes ({totalCount})</CardTitle>
				</CardHeader>
				<CardContent>
					{routes.length > 0 ? (
						<div className="divide-y divide-border">
							{routes.map((route) => (
								<div key={route.routeId} className="p-3 hover:bg-muted/50">
									<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
										<div>
											<h3 className="flex items-center font-medium text-base">
												<RouteIcon className="mr-2 h-5 w-5 text-primary" />
												{route.routeName}
											</h3>
											<div className="text-muted-foreground text-xs mt-1 space-x-2">
												<span>ID: {route.routeId.substring(0,8)}...</span>
												<span>Stations: {route.routeStations.length}</span>
												<span>Departures: {route.departureTimes.length}</span>
											</div>
										</div>
										<div className="mt-2 flex shrink-0 gap-2 sm:mt-0">
											<Button variant="outline" size="sm" onClick={() => openEditDialog(route)}>
												<Edit className="mr-1 h-3 w-3" /> Edit
											</Button>
											<Button variant="destructive" size="sm" onClick={() => openDeleteDialog(route)}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
									{route.routeStations.length > 0 && (
										<div className="mt-2 pl-7">
											<p className="text-xs font-medium text-muted-foreground">Stations (Order):</p>
											<ol className="list-decimal list-inside text-xs text-muted-foreground">
												{route.routeStations.slice(0,5).map(rs => <li key={rs.stationId}>{rs.station.stationName} ({rs.stopOrder})</li>)}
												{route.routeStations.length > 5 && <li className="text-xs italic">...and {route.routeStations.length - 5} more.</li>}
											</ol>
										</div>
									)}
								</div>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-center py-8">
							No bus routes found. Add some to get started.
						</p>
					)}
				</CardContent>
				{/* TODO: Pagination if totalCount > routes.length */}
			</Card>
			
			<Button variant="link" asChild className="mt-4 mb-[80px]">
				<Link href="/admin/ring-tracking-management">
					Back to Ring Tracking Overview
				</Link>
			</Button>
		</div>
	);
}
