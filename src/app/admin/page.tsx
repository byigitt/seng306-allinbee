"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { BarChart3, Bus, CalendarCheck, Users, Utensils, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";

const userManagementCard = {
	title: "User Management",
	description: "Manage student, staff, and admin accounts.",
	href: "/admin/user-management",
	icon: Users,
};

const staffAccessibleCards = [
	{
		title: "System Analytics",
		description: "View overall system usage and statistics.",
		href: "/admin/analytics",
		icon: BarChart3,
	},
	{
		title: "Cafeteria Management",
		description: "Manage daily menus, dishes, and view sales.",
		href: "/admin/cafeteria-management",
		icon: Utensils,
	},
	{
		title: "Ring Bus Management",
		description: "Manage bus routes and station information.",
		href: "/admin/ring-tracking-management",
		icon: Bus,
	},
	{
		title: "Appointment System",
		description: "Oversee appointments and manage bookable services.",
		href: "/admin/appointment-management",
		icon: CalendarCheck,
	},
];

export default function AdminDashboardPage() {
	const { data: currentUser, isLoading: isLoadingUser, error: userError } = api.user.me.useQuery();

	let dashboardTitle = "Dashboard";
	let dashboardDescription = "Access available management panels.";
	let cardsToShow = [];

	if (isLoadingUser) {
		return (
			<div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
				<Loader2 className="h-12 w-12 animate-spin text-primary" />
				<p className="mt-4 text-muted-foreground">Loading dashboard...</p>
			</div>
		);
	}

	if (userError || !currentUser) {
		return (
			<div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
				<ShieldAlert className="h-12 w-12 text-destructive" />
				<h2 className="mt-4 text-xl font-semibold text-destructive">Access Denied</h2>
				<p className="mt-2 text-muted-foreground">
					{userError?.message || "Could not load user information. Please try again."}
				</p>
				<Button asChild className="mt-6"><Link href="/">Go to Homepage</Link></Button>
			</div>
		);
	}

	if (currentUser.role === "admin") {
		dashboardTitle = "Admin Dashboard";
		dashboardDescription = "Access user account management.";
		cardsToShow = [userManagementCard];
	} else if (currentUser.role === "staff") {
		dashboardTitle = "Staff Dashboard";
		dashboardDescription = "Overview and quick access to management panels.";
		cardsToShow = staffAccessibleCards;
	} else {
		return (
			<div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
				<ShieldAlert className="h-12 w-12 text-destructive" />
				<h2 className="mt-4 text-xl font-semibold text-destructive">Unauthorized Access</h2>
				<p className="mt-2 text-muted-foreground">
					You do not have permission to view this page.
				</p>
				<Button asChild className="mt-6"><Link href="/">Go to Homepage</Link></Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-2xl md:text-3xl">{dashboardTitle}</h1>
					<p className="text-muted-foreground">
						{dashboardDescription}
					</p>
				</div>
			</div>

			<div className="mb-[80px] grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
				{cardsToShow.map((card) => (
					<Link
						href={card.href}
						key={card.title}
						className="block rounded-lg transition-shadow hover:shadow-lg"
					>
						<Card className="flex h-full flex-col">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-lg">
									{card.title}
								</CardTitle>
								<card.icon className="h-6 w-6 text-muted-foreground" />
							</CardHeader>
							<CardContent className="flex-grow">
								<p className="text-muted-foreground text-sm">
									{card.description}
								</p>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
