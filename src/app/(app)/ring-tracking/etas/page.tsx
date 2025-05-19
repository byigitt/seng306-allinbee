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

// Mock Data
const mockRoutes = [
	{ id: "R1", name: "Main Campus Ring" },
	{ id: "R2", name: "East Dorms - Library" },
	{ id: "R3", name: "West Gate - Sports Complex" },
];

const mockStations = [
	{ id: "S1", name: "Rectorate Building", routeId: "R1" },
	{ id: "S2", name: "Library", routeId: "R1" },
	{ id: "S3", name: "Engineering Faculty", routeId: "R1" },
	{ id: "S4", name: "East Dormitory A", routeId: "R2" },
	{ id: "S5", name: "Sports Hall", routeId: "R3" },
];

const mockEtas = [
	{
		busId: "Bus-101",
		stationName: "Library",
		routeName: "Main Campus Ring",
		eta: "5 min",
	},
	{
		busId: "Bus-102",
		stationName: "Engineering Faculty",
		routeName: "Main Campus Ring",
		eta: "12 min",
	},
	{
		busId: "Bus-201",
		stationName: "East Dormitory A",
		routeName: "East Dorms - Library",
		eta: "8 min",
	},
];

export default function EtasPage() {
	// TODO: Implement logic to filter stations based on selected route and fetch ETAs
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
					<div className="grid gap-2 md:grid-cols-2">
						<div>
							<label htmlFor="route-select" className="font-medium text-sm">
								Route
							</label>
							<Select>
								<SelectTrigger id="route-select">
									<SelectValue placeholder="Select a bus route" />
								</SelectTrigger>
								<SelectContent>
									{mockRoutes.map((route) => (
										<SelectItem key={route.id} value={route.id}>
											{route.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<label htmlFor="station-select" className="font-medium text-sm">
								Station
							</label>
							<Select>
								<SelectTrigger id="station-select">
									<SelectValue placeholder="Select a station" />
								</SelectTrigger>
								<SelectContent>
									{/* This should be dynamically populated based on selected route */}
									{mockStations.map((station) => (
										<SelectItem key={station.id} value={station.id}>
											{station.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<Button className="w-full md:w-auto">Show ETAs</Button>
				</CardContent>
			</Card>

			<Card className="rounded-xl border border-border shadow-lg">
				<CardHeader>
					<CardTitle className="font-bold text-lg">
						Estimated Arrival Times
					</CardTitle>
					<CardDescription className="text-sm">
						ETAs for selected station (mock data).
					</CardDescription>
				</CardHeader>
				<CardContent>
					{/* Desktop Table */}
					<div className="hidden overflow-x-auto md:block">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Route</TableHead>
									<TableHead>Destination Station</TableHead>
									<TableHead className="text-right">ETA</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{mockEtas.map((eta) => (
									<TableRow
										key={eta.busId}
										className="transition-colors even:bg-muted/40 hover:bg-accent/40"
									>
										<TableCell className="font-medium">
											{eta.routeName}
										</TableCell>
										<TableCell>{eta.stationName}</TableCell>
										<TableCell className="text-right">
											<span className="inline-block rounded bg-green-600/80 px-2 py-1 font-bold text-white text-xs">
												{eta.eta}
											</span>
										</TableCell>
									</TableRow>
								))}
								{mockEtas.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={3}
											className="text-center text-muted-foreground"
										>
											Select a route and station to see ETAs.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					{/* Mobile List */}
					<div className="flex flex-col gap-3 md:hidden">
						{mockEtas.length === 0 && (
							<div className="py-4 text-center text-muted-foreground">
								Select a route and station to see ETAs.
							</div>
						)}
						{mockEtas.map((eta) => (
							<div
								key={eta.busId}
								className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3 shadow-sm"
							>
								<div className="flex flex-col">
									<span className="font-semibold text-foreground text-sm">
										{eta.routeName}
									</span>
									<span className="text-muted-foreground text-xs">
										{eta.stationName}
									</span>
								</div>
								<span className="ml-4 inline-block rounded bg-green-600/80 px-3 py-1 font-bold text-sm text-white">
									{eta.eta}
								</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<Button variant="link" asChild className="mt-4 mb-[80px]">
				<Link href="/ring-tracking">Back to Live Map</Link>
			</Button>
		</div>
	);
}
