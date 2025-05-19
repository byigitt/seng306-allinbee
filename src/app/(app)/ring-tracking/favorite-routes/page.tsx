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
import { PlusCircle, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

// Mock Data
const allMockRoutes = [
	{ id: "R1", name: "Main Campus Ring" },
	{ id: "R2", name: "East Dorms - Library" },
	{ id: "R3", name: "West Gate - Sports Complex" },
	{ id: "R4", name: "City Center Express" },
	{ id: "R5", name: "Tech Park Shuttle" },
];

interface FavoriteRoute {
	id: string;
	name: string;
	customName?: string; // User-defined nickname for the route
}

const initialFavoriteRoutes: FavoriteRoute[] = [
	{ id: "R1", name: "Main Campus Ring", customName: "My Usual Route" },
	{ id: "R3", name: "West Gate - Sports Complex" },
];

export default function FavoriteRoutesPage() {
	const [favoriteRoutes, setFavoriteRoutes] = useState<FavoriteRoute[]>(
		initialFavoriteRoutes,
	);
	const [selectedRouteToAdd, setSelectedRouteToAdd] = useState<string>("");

	const addFavoriteRoute = () => {
		if (
			selectedRouteToAdd &&
			!favoriteRoutes.find((fr) => fr.id === selectedRouteToAdd)
		) {
			const routeToAdd = allMockRoutes.find((r) => r.id === selectedRouteToAdd);
			if (routeToAdd) {
				setFavoriteRoutes([
					...favoriteRoutes,
					{ id: routeToAdd.id, name: routeToAdd.name },
				]);
				setSelectedRouteToAdd("");
			}
		}
	};

	const removeFavoriteRoute = (routeId: string) => {
		setFavoriteRoutes(favoriteRoutes.filter((fr) => fr.id !== routeId));
	};

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
						<Select
							value={selectedRouteToAdd}
							onValueChange={setSelectedRouteToAdd}
						>
							<SelectTrigger id="route-select">
								<SelectValue placeholder="Choose a route to add" />
							</SelectTrigger>
							<SelectContent>
								{allMockRoutes
									.filter((r) => !favoriteRoutes.some((fr) => fr.id === r.id))
									.map((route) => (
										<SelectItem key={route.id} value={route.id}>
											{route.name}
										</SelectItem>
									))}
								{allMockRoutes.filter(
									(r) => !favoriteRoutes.some((fr) => fr.id === r.id),
								).length === 0 && (
									<p className="p-2 text-muted-foreground text-sm">
										All routes added.
									</p>
								)}
							</SelectContent>
						</Select>
					</div>
					<Button onClick={addFavoriteRoute} disabled={!selectedRouteToAdd}>
						<PlusCircle className="mr-2 h-4 w-4" /> Add to Favorites
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Your Favorite Routes</CardTitle>
					{favoriteRoutes.length === 0 && (
						<CardDescription>
							You haven&apos;t added any favorite routes yet.
						</CardDescription>
					)}
				</CardHeader>
				<CardContent className="space-y-3">
					{favoriteRoutes.map((route) => (
						<div
							key={route.id}
							className="flex items-center justify-between rounded-lg border p-3"
						>
							<div>
								<p className="flex items-center font-medium">
									<Star className="mr-2 h-5 w-5 fill-yellow-400 text-yellow-400" />
									{route.customName || route.name}
								</p>
								{route.customName && (
									<p className="text-muted-foreground text-sm">
										({route.name})
									</p>
								)}
							</div>
							{/* TODO: Add functionality to edit customName */}
							<Button
								variant="ghost"
								size="icon"
								onClick={() => removeFavoriteRoute(route.id)}
							>
								<Trash2 className="h-5 w-5 text-destructive" />
								<span className="sr-only">Remove {route.name}</span>
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
