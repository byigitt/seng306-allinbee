import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Bus, CalendarDays, Cog, Utensils } from "lucide-react";
import Link from "next/link";

const features = [
	{
		title: "Cafeteria Menu",
		description: "View daily menus and manage your digital wallet.",
		href: "/cafeteria",
		icon: Utensils,
	},
	{
		title: "Ring Bus Tracking",
		description: "Track ring buses in real-time and check ETAs.",
		href: "/ring-tracking",
		icon: Bus,
	},
	{
		title: "Appointments",
		description: "Book appointments for various university services.",
		href: "/appointments",
		icon: CalendarDays,
	},
];

export default function AppPage() {
	return (
		<div className="container mx-auto py-8">
			<div className="mb-8 text-center">
				<h1 className="font-bold text-3xl tracking-tight">
					Welcome to AllInBee!
				</h1>
				<p className="text-muted-foreground">
					Your central hub for Çankaya University services.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{features.map((feature) => (
					<Card key={feature.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-lg">
								{feature.title}
							</CardTitle>
							<feature.icon className="h-6 w-6 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground text-sm">
								{feature.description}
							</p>
						</CardContent>
						<CardFooter>
							<Button asChild className="w-full">
								<Link href={feature.href}>Go to {feature.title}</Link>
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>

			{/* Placeholder for Admin link - adjust based on actual auth roles later */}
			<div className="mt-12 mb-12 text-center">
				<p className="mb-2 text-muted-foreground text-sm">
					Are you an administrator?
				</p>
				<Button asChild variant="outline">
					<Link href="/admin">
						Go to Admin Panel <Cog className="ml-2 h-4 w-4" />
					</Link>
				</Button>
			</div>
		</div>
	);
}
