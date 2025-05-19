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
import { Edit, PlusCircle, Route as RouteIcon, Trash2 } from "lucide-react";
import Link from "next/link";

// Mock data - replace with API call
const mockBusRoutes = [
	{
		id: "R1",
		name: "Main Campus Ring",
		stops: 5,
		frequency: "15 min",
		status: "Active",
	},
	{
		id: "R2",
		name: "East Dorms - Library",
		stops: 3,
		frequency: "20 min",
		status: "Active",
	},
	{
		id: "R3",
		name: "West Gate - Sports Complex",
		stops: 4,
		frequency: "30 min",
		status: "Inactive",
	},
	{
		id: "R4",
		name: "City Center Express",
		stops: 2,
		frequency: "1 hour",
		status: "Active",
	},
];

export default function ManageBusRoutesPage() {
	// TODO: Implement CRUD operations for bus routes
	// TODO: Modal/dialog for adding/editing routes

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl">Manage Bus Routes</h1>
					<p className="text-muted-foreground">
						Add, edit, or remove ring bus routes.
					</p>
				</div>
				<Button>
					<PlusCircle className="mr-2 h-4 w-4" /> Add New Route
				</Button>
			</div>

			{/* Placeholder for Add/Edit Route Form/Modal, could be a separate component or Shadcn Dialog */}
			{/* 
      <Card>
        <CardHeader><CardTitle>Add/Edit Route</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2"><Label htmlFor="route-name">Route Name</Label><Input id="route-name" /></div>
          <div className="grid gap-2"><Label htmlFor="route-stops">Number of Stops</Label><Input id="route-stops" type="number" /></div>
          <div className="grid gap-2"><Label htmlFor="route-frequency">Frequency</Label><Input id="route-frequency" /></div>
          <Button>Save Route</Button>
        </CardContent>
      </Card> 
      */}

			<Card>
				<CardHeader>
					<CardTitle>Existing Bus Routes</CardTitle>
				</CardHeader>
				<CardContent>
					{mockBusRoutes.length > 0 ? (
						<ul className="space-y-4">
							{mockBusRoutes.map((route) => (
								<li key={route.id} className="rounded-lg border p-4">
									<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
										<div>
											<h3 className="flex items-center font-medium text-lg">
												<RouteIcon
													className={`mr-2 h-5 w-5 ${route.status === "Active" ? "text-green-500" : "text-red-500"}`}
												/>
												{route.name}
											</h3>
											<p className="text-muted-foreground text-sm">
												Stops: {route.stops} | Frequency: {route.frequency} |
												Status:{" "}
												<span
													className={
														route.status === "Active"
															? "text-green-600"
															: "text-red-600"
													}
												>
													{route.status}
												</span>
											</p>
										</div>
										<div className="mt-2 flex shrink-0 gap-2 sm:mt-0">
											<Button variant="outline" size="sm">
												<Edit className="mr-1 h-3 w-3" /> Edit
											</Button>
											<Button variant="destructive" size="sm">
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
									{/* Placeholder for listing stops or a map preview */}
								</li>
							))}
						</ul>
					) : (
						<p className="text-muted-foreground">
							No bus routes found. Add some to get started.
						</p>
					)}
				</CardContent>
			</Card>
			<Button variant="link" asChild className="mt-4 mb-[80px]">
				<Link href="/admin/ring-tracking-management">
					Back to Ring Tracking Overview
				</Link>
			</Button>
		</div>
	);
}
