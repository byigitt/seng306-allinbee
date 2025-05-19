import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, BarChartBig, Edit, Utensils } from "lucide-react";
import Link from "next/link";

export default function AdminCafeteriaOverviewPage() {
	return (
		<div className="space-y-6 overflow-x-hidden">
			<div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/admin">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<div>
						<h1 className="font-semibold text-xl md:text-2xl">
							Cafeteria Management
						</h1>
						<p className="text-muted-foreground">
							Manage dishes, menus, and view sales reports.
						</p>
					</div>
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Utensils className="h-5 w-5" /> Manage Dishes
						</CardTitle>
						<CardDescription>
							Create, update, and delete cafeteria dishes.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className="w-full sm:w-auto">
							<Link href="/admin/cafeteria-management/dishes">
								Go to Dishes
							</Link>
						</Button>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Edit className="h-5 w-5" /> Manage Menus
						</CardTitle>
						<CardDescription>
							Create and publish daily or weekly menus.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className="w-full sm:w-auto">
							<Link href="/admin/cafeteria-management/menus">Go to Menus</Link>
						</Button>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BarChartBig className="h-5 w-5" /> View Sales
						</CardTitle>
						<CardDescription>
							Access sales reports and analytics.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className="w-full sm:w-auto">
							<Link href="/admin/cafeteria-management/sales">Go to Sales</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
