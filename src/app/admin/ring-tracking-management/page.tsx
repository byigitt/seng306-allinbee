import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { MapPin, Route } from "lucide-react";
import Link from "next/link";

export default function AdminRingTrackingOverviewPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-semibold text-xl md:text-2xl">
						Ring Bus Management
					</h1>
					<p className="text-muted-foreground">
						Manage bus routes and station details.
					</p>
				</div>
			</div>
			<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Route className="h-5 w-5" /> Manage Routes
						</CardTitle>
						<CardDescription>
							Define and update bus routes and their schedules.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<Link href="/admin/ring-tracking-management/routes">
								Go to Routes
							</Link>
						</Button>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<MapPin className="h-5 w-5" /> Manage Stations
						</CardTitle>
						<CardDescription>
							Add, edit, or remove bus stop locations.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<Link href="/admin/ring-tracking-management/stations">
								Go to Stations
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
