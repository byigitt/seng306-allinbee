"use client";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Star, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// No longer need mock data or FavoriteRoute interface here if using tRPC types directly
// interface FavoriteRoute {
// 	id: string;
// 	name: string;
// 	customName?: string; 
// }

export default function FavoriteRoutesPage() {
	const utils = api.useUtils();

	const { 
		data: allRoutesData, 
		isLoading: isLoadingAllRoutes, 
		error: errorAllRoutes,
		isError: isErrorAllRoutes,
	} = api.ringTracking.listRoutes.useQuery({}); // Fetch all routes, default pagination

	const { 
		data: favoriteRoutesData, 
		isLoading: isLoadingFavorites, 
		error: errorFavorites,
		isError: isErrorFavorites,
	} = api.ringTracking.listFavoriteRoutes.useQuery();

	const [selectedRouteToAdd, setSelectedRouteToAdd] = useState<string>("");

	useEffect(() => {
		if (isErrorAllRoutes && errorAllRoutes) {
			toast.error("Error Loading All Routes", {
				description: errorAllRoutes.message || "Could not fetch the list of all bus routes.",
			});
		}
	}, [isErrorAllRoutes, errorAllRoutes]);

	useEffect(() => {
		if (isErrorFavorites && errorFavorites) {
			toast.error("Error Loading Favorite Routes", {
				description: errorFavorites.message || "Could not fetch your list of favorite routes.",
			});
		}
	}, [isErrorFavorites, errorFavorites]);

	const addFavoriteMutation = api.ringTracking.addFavoriteRoute.useMutation({
		onSuccess: (data) => {
			toast.success(`Route "${data.route.routeName}" added to favorites!`);
			utils.ringTracking.listFavoriteRoutes.invalidate();
			setSelectedRouteToAdd("");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to add favorite route.");
		},
	});

	const removeFavoriteMutation = api.ringTracking.removeFavoriteRoute.useMutation({
		onSuccess: (data, variables) => {
      // The backend might return a success message or the deleted object.
      // We need the route name for the toast. We can try to find it from `favoriteRoutesData`
      // or adjust the backend to return more info. For now, a generic message.
      // Or, if backend returns the deleted UserFavoriteRoute, it includes the route details.
      const routeName = favoriteRoutesData?.find(fr => fr.routeId === variables.routeId)?.route.routeName;
			toast.success(routeName ? `Route "${routeName}" removed from favorites.` : "Favorite route removed.");
			utils.ringTracking.listFavoriteRoutes.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to remove favorite route.");
		},
	});

	const handleAddFavorite = () => {
		if (selectedRouteToAdd) {
			addFavoriteMutation.mutate({ routeId: selectedRouteToAdd });
		}
	};

	const handleRemoveFavorite = (routeId: string) => {
		removeFavoriteMutation.mutate({ routeId });
	};

	const availableRoutesToAdd = allRoutesData?.routes.filter(
        (r) => !favoriteRoutesData?.some((fr) => fr.routeId === r.routeId)
    ) ?? [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl">Favorite Bus Routes</h1>
				<p className="text-muted-foreground">
					Manage your preferred ring bus routes for quick access.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Add New Favorite Route</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
					<div className="grid flex-1 gap-2">
						<Label htmlFor="route-select">Select Route</Label>
						{isLoadingAllRoutes && <Skeleton className="h-10 w-full" />}
						{errorAllRoutes && <p className="text-sm text-destructive">Failed to load routes.</p>}
						{!isLoadingAllRoutes && !errorAllRoutes && (
							<Select
								value={selectedRouteToAdd}
								onValueChange={setSelectedRouteToAdd}
								disabled={addFavoriteMutation.isPending}
							>
								<SelectTrigger id="route-select">
									<SelectValue placeholder="Choose a route to add" />
								</SelectTrigger>
								<SelectContent>
									{availableRoutesToAdd.map((route) => (
										<SelectItem key={route.routeId} value={route.routeId}>
											{route.routeName}
										</SelectItem>
									))}
									{availableRoutesToAdd.length === 0 && !isLoadingAllRoutes && (
										<p className="p-2 text-muted-foreground text-sm">
											All routes added or none available.
										</p>
									)}
								</SelectContent>
							</Select>
						)}
					</div>
					<Button onClick={handleAddFavorite} disabled={!selectedRouteToAdd || addFavoriteMutation.isPending || isLoadingAllRoutes}>
						{addFavoriteMutation.isPending ? "Adding..." : <><PlusCircle className="mr-2 h-4 w-4" /> Add to Favorites</>}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Your Favorite Routes</CardTitle>
					{isLoadingFavorites && !favoriteRoutesData && (
						<CardDescription>Loading your favorites...</CardDescription>
					)}
					{errorFavorites && (
						<CardDescription className="text-destructive">Error loading favorites: {errorFavorites.message}</CardDescription>
					)}
					{!isLoadingFavorites && !errorFavorites && favoriteRoutesData?.length === 0 && (
						<CardDescription>
							You haven&apos;t added any favorite routes yet.
						</CardDescription>
					)}
				</CardHeader>
				<CardContent className="space-y-3">
					{isLoadingFavorites && (
						<>
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</>
					)}
					{!isLoadingFavorites && favoriteRoutesData?.map((favRoute) => (
						<div
							key={favRoute.routeId}
							className="flex items-center justify-between rounded-lg border p-3"
						>
							<div>
								<p className="flex items-center font-medium">
									<Star className="mr-2 h-5 w-5 fill-yellow-400 text-yellow-400" />
									{favRoute.route.routeName} {/* Assuming customName is not part of UserFavoriteRoute model for now */}
								</p>
								{/* If customName was stored, display it here */}
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => handleRemoveFavorite(favRoute.routeId)}
								disabled={removeFavoriteMutation.isPending && removeFavoriteMutation.variables?.routeId === favRoute.routeId}
							>
								{removeFavoriteMutation.isPending && removeFavoriteMutation.variables?.routeId === favRoute.routeId 
									? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> 
									: <Trash2 className="h-5 w-5 text-destructive" />} 
								<span className="sr-only">Remove {favRoute.route.routeName}</span>
							</Button>
						</div>
					))}
				</CardContent>
			</Card>

			<Button variant="link" asChild className="mt-4">
				<Link href="/ring-tracking">Back to Live Map</Link>
			</Button>
		</div>
	);
}
