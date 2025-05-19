"use client";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";

// Mock data removed, will use tRPC types

export default function EtasPage() {
	const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(undefined);
	const [selectedStationId, setSelectedStationId] = useState<string | undefined>(undefined);
	const [shouldFetchEtas, setShouldFetchEtas] = useState<boolean>(false);
	const prevSelectedRouteIdRef = useRef<string | undefined>(undefined);

	const { 
		data: routesData, 
		isLoading: isLoadingRoutes, 
		error: errorRoutes,
		isError: isErrorRoutes,
	} = api.ringTracking.listRoutes.useQuery({});

	const { 
		data: selectedRouteDetails, 
		isLoading: isLoadingRouteDetails,
		error: errorRouteDetails,
		isError: isErrorRouteDetails,
	} = api.ringTracking.getRoute.useQuery(
		{ routeId: selectedRouteId ?? "" }, 
		{ enabled: !!selectedRouteId }
	);

	const stationsForSelectedRoute = selectedRouteDetails?.routeStations.map(rs => rs.station) ?? [];

	const { 
		data: etasData, 
		isLoading: isLoadingEtas, 
		error: errorEtas, 
		isError: isErrorEtas,
		refetch: refetchEtas 
	} = api.ringTracking.getStationETAs.useQuery(
		{ stationId: selectedStationId ?? "", routeId: selectedRouteId ?? "" }, 
		{ 
			enabled: shouldFetchEtas && !!selectedStationId && !!selectedRouteId
		}
	);

	useEffect(() => {
		if (isErrorRoutes && errorRoutes) {
			toast.error("Error Loading Routes", {
				description: errorRoutes.message || "Could not fetch bus routes.",
			});
		}
	}, [isErrorRoutes, errorRoutes]);

	useEffect(() => {
		if (isErrorRouteDetails && errorRouteDetails) {
			toast.error("Error Loading Route Details", {
				description: errorRouteDetails.message || "Could not fetch details for the selected route.",
			});
		}
	}, [isErrorRouteDetails, errorRouteDetails]);

	useEffect(() => {
		if (isErrorEtas && errorEtas) {
			toast.error("Error Loading ETAs", {
				description: errorEtas.message || "Could not fetch ETAs for the selected station/route.",
			});
		}
	}, [isErrorEtas, errorEtas]);

	useEffect(() => {
		// When route changes, reset station and ETA fetching trigger
		if (selectedRouteId !== prevSelectedRouteIdRef.current) {
			setSelectedStationId(undefined);
			setShouldFetchEtas(false);
		}
		prevSelectedRouteIdRef.current = selectedRouteId;
	}, [selectedRouteId]);

	useEffect(() => {
        // If inputs change after an initial fetch, allow refetching
        if (shouldFetchEtas && (selectedStationId || selectedRouteId)) {
            refetchEtas();
        }
    }, [selectedStationId, selectedRouteId, refetchEtas, shouldFetchEtas]);

	const handleShowEtas = () => {
		if (selectedRouteId && selectedStationId) {
			setShouldFetchEtas(true);
			// refetchEtas(); // useQuery will fetch when enabled or inputs change
		} else {
			setShouldFetchEtas(false); // Ensure ETAs are not fetched if inputs are incomplete
		}
	};

	const displayedEtas = shouldFetchEtas ? (etasData ?? []) : [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl">Bus ETAs</h1>
				<p className="text-muted-foreground">
					Check estimated arrival times for buses at selected stations.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Select Route and Station</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 md:gap-6">
						<div>
							<label htmlFor="route-select" className="font-medium text-sm mb-1 block">Route</label>
							{isLoadingRoutes && <Skeleton className="h-10 w-full" />}
							{errorRoutes && <p className="text-sm text-destructive">Failed to load routes.</p>}
							{!isLoadingRoutes && !errorRoutes && (
								<Select value={selectedRouteId} onValueChange={setSelectedRouteId} disabled={isLoadingRoutes}>
								<SelectTrigger id="route-select">
									<SelectValue placeholder="Select a bus route" />
								</SelectTrigger>
								<SelectContent>
										{routesData?.routes.map((route) => (
											<SelectItem key={route.routeId} value={route.routeId}>
												{route.routeName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							)}
						</div>
						<div>
							<label htmlFor="station-select" className="font-medium text-sm mb-1 block">Station</label>
							{(isLoadingRoutes || (selectedRouteId && isLoadingRouteDetails)) && <Skeleton className="h-10 w-full" />}
							{!selectedRouteId && !isLoadingRoutes && <p className="text-sm text-muted-foreground p-2 border rounded-md h-10 flex items-center">Select a route first</p>}
							{selectedRouteId && !isLoadingRouteDetails && stationsForSelectedRoute.length === 0 && <p className="text-sm text-muted-foreground p-2 border rounded-md h-10 flex items-center">No stations for this route.</p>}
							{selectedRouteId && !isLoadingRouteDetails && stationsForSelectedRoute.length > 0 && (
								<Select 
									value={selectedStationId} 
									onValueChange={(value) => {
										console.log("[ETAs Page] Station selected:", value);
										setSelectedStationId(value);
									}}
									disabled={!selectedRouteId || isLoadingRouteDetails}
								>
								<SelectTrigger id="station-select">
									<SelectValue placeholder="Select a station" />
								</SelectTrigger>
								<SelectContent>
										{stationsForSelectedRoute.map((station) => {
											console.log("[ETAs Page] Station in dropdown:", station);
											return (
												<SelectItem key={station.stationId} value={station.stationId}>
													{station.stationName}
												</SelectItem>
											);
										})}
								</SelectContent>
							</Select>
							)}
						</div>
					</div>
					<Button onClick={handleShowEtas} className="w-full md:w-auto" disabled={!selectedRouteId || !selectedStationId || isLoadingEtas}>
						{isLoadingEtas ? "Loading ETAs..." : "Show ETAs"}
					</Button>
				</CardContent>
			</Card>

			<Card className="rounded-xl border border-border shadow-lg">
				<CardHeader>
					<CardTitle className="font-bold text-lg">
						Estimated Arrival Times
					</CardTitle>
					{(selectedStationId && selectedRouteDetails) ? 
					<CardDescription className="text-sm">
							Showing ETAs for <strong>{stationsForSelectedRoute.find(s => s.stationId === selectedStationId)?.stationName}</strong> on route <strong>{selectedRouteDetails.routeName}</strong>.
					</CardDescription>
						: 
						<CardDescription className="text-sm">Select a route and station to view ETAs.</CardDescription>
					}
				</CardHeader>
				<CardContent>
					{isLoadingEtas && (
						<div className="flex justify-center items-center py-8">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
							<p className="ml-2">Loading ETAs...</p>
						</div>
					)}
					{errorEtas && (
						<div className="flex flex-col items-center justify-center space-y-2 py-8 text-destructive">
							<AlertTriangle className="h-10 w-10" />
							<p>Error loading ETAs: {errorEtas.message}</p>
						</div>
					)}
					{!isLoadingEtas && !errorEtas && shouldFetchEtas && displayedEtas.length === 0 && (
						<div className="py-8 text-center text-muted-foreground">
							<Info className="mx-auto h-10 w-10 mb-2" />
							No current ETAs available for the selected station/route.
						</div>
					)}
					{!isLoadingEtas && !errorEtas && displayedEtas.length > 0 && (
					<>
					{/* Desktop Table */}
					<div className="hidden overflow-x-auto md:block">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Route</TableHead>
										<TableHead>Bus ID</TableHead>
									<TableHead className="text-right">ETA</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
									{displayedEtas.map((eta) => (
									<TableRow
										key={eta.busId}
										className="transition-colors even:bg-muted/40 hover:bg-accent/40"
									>
										<TableCell className="font-medium">
												{eta.currentRouteName}
										</TableCell>
											<TableCell>{eta.busId}</TableCell>
										<TableCell className="text-right">
											<span className="inline-block rounded bg-green-600/80 px-2 py-1 font-bold text-white text-xs">
													{eta.etaMinutes} min
											</span>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					{/* Mobile List */}
					<div className="flex flex-col gap-3 md:hidden">
							{displayedEtas.map((eta) => (
							<div
								key={eta.busId}
								className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3 shadow-sm"
							>
								<div className="flex flex-col">
									<span className="font-semibold text-foreground text-sm">
											{eta.currentRouteName}
									</span>
									<span className="text-muted-foreground text-xs">
											Bus ID: {eta.busId}
									</span>
								</div>
								<span className="ml-4 inline-block rounded bg-green-600/80 px-3 py-1 font-bold text-sm text-white">
										{eta.etaMinutes} min
								</span>
							</div>
						))}
					</div>
					</>
					)}
				</CardContent>
			</Card>

			<Button variant="link" asChild className="mt-4 mb-[80px]">
				<Link href="/ring-tracking">Back to Live Map</Link>
			</Button>
		</div>
	);
}
