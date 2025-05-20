"use client";

import { Bus, CalendarCheck, Home, Package2, Utensils, Users, BarChart3, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/trpc/react"; // Import tRPC API

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import React from "react";
import AdminPageHeader from "@/app/_components/common/admin-page-header";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "AllInBee - Admin Portal",
	description: "AllInBee - Admin Portal",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

// Define AdminNavItem type explicitly
interface AdminNavItem {
	href: string;
	label: string;
	icon?: React.ElementType; // Make icon optional to match AdminPageHeader and allow sub-items without icons
	subMenu?: AdminNavItem[];
}

// Define base navigation structures with the explicit type
const baseAdminNavItems: AdminNavItem[] = [
	{ href: "/admin", label: "Dashboard", icon: Home },
	{
		href: "/admin/user-management",
		label: "User Management",
		icon: Users,
	},
];

const baseStaffNavItems: AdminNavItem[] = [
	{ href: "/admin", label: "Dashboard", icon: Home },
	{
		href: "/admin/analytics", 
		label: "Analytics", 
		icon: BarChart3 
	},
	{
		href: "/admin/cafeteria-management",
		label: "Cafeteria Mgmt",
		icon: Utensils,
		subMenu: [
			{ href: "/admin/cafeteria-management/dishes", label: "Manage Dishes" }, // Removed icons from sub-items as they are not rendered by AdminPageHeader's sub-item mapping
			{ href: "/admin/cafeteria-management/menus", label: "Manage Menus" },
			{ href: "/admin/cafeteria-management/sales", label: "View Sales" },
		],
	},
	{
		href: "/admin/ring-tracking-management",
		label: "Ring Bus Mgmt",
		icon: Bus,
		subMenu: [
			{
				href: "/admin/ring-tracking-management/routes",
				label: "Manage Routes",
			},
			{
				href: "/admin/ring-tracking-management/stations",
				label: "Manage Stations",
			},
		],
	},
	{
		href: "/admin/appointment-management",
		label: "Appointment Mgmt",
		icon: CalendarCheck,
		subMenu: [
			{
				href: "/admin/appointment-management/appointments",
				label: "View Appointments",
			},
			{ href: "/admin/appointment-management/books", label: "Manage Books" },
		],
	},
];

// Ensure bottom nav items also conform if they were to be used with logic expecting AdminNavItem type
const baseAdminBottomNavItems: AdminNavItem[] = [
	{ href: "/admin", label: "Dashboard", icon: Home },
	{ href: "/admin/user-management", label: "Users", icon: Users },
];

const baseStaffBottomNavItems: AdminNavItem[] = [
	{ href: "/admin", label: "Dashboard", icon: Home },
	{ href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
	{ href: "/admin/cafeteria-management", label: "Cafeteria", icon: Utensils },
	{ href: "/admin/ring-tracking-management", label: "Ring Bus", icon: Bus },
	{ href: "/admin/appointment-management", label: "Bookings", icon: CalendarCheck },
];


export default function AdminLayout({
	children,
}: { children: React.ReactNode }) {
	const pathname = usePathname();
	const { data: currentUser, isLoading: isLoadingUser, error: userError } = api.user.me.useQuery();

	let navItemsToDisplay = [];
	let bottomNavItemsToDisplay = [];
	let portalTitle = "Portal";
	let headerTitle = "User Portal"; // Default title for the header within AdminPageHeader and desktop

	if (isLoadingUser) {
		return (
			<div className="flex items-center justify-center min-h-screen w-full">
				<Loader2 className="h-12 w-12 animate-spin text-primary" />
			</div>
		);
	}

	if (userError || !currentUser) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen w-full text-center p-4">
				<ShieldAlert className="h-12 w-12 text-destructive" />
				<h2 className="mt-4 text-xl font-semibold text-destructive">Access Error</h2>
				<p className="mt-2 text-muted-foreground">
					{userError?.message || "Could not load user information. Unable to determine portal access."}
				</p>
				<Button asChild className="mt-6"><Link href="/">Go to Homepage</Link></Button>
			</div>
		);
	}

	if (currentUser.role === "admin") {
		navItemsToDisplay = baseAdminNavItems;
		bottomNavItemsToDisplay = baseAdminBottomNavItems;
		portalTitle = "Admin Portal";
		headerTitle = "Admin Dashboard";
	} else if (currentUser.role === "staff") {
		navItemsToDisplay = baseStaffNavItems;
		bottomNavItemsToDisplay = baseStaffBottomNavItems;
		portalTitle = "Staff Portal";
		headerTitle = "Staff Dashboard";
	} else {
		// Redirect or show an unauthorized message if not admin or staff but somehow in this layout
		return (
			<div className="flex flex-col items-center justify-center min-h-screen w-full text-center p-4">
				<ShieldAlert className="h-12 w-12 text-destructive" />
				<h2 className="mt-4 text-xl font-semibold text-destructive">Unauthorized</h2>
				<p className="mt-2 text-muted-foreground">
					You do not have the necessary permissions to access this area.
				</p>
				<Button asChild className="mt-6"><Link href="/">Go to Homepage</Link></Button>
			</div>
		);
	}

	return (
		<div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
			<div className="hidden border-r bg-muted/40 md:block">
				<div className="flex h-full max-h-screen flex-col gap-2">
					<div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
						<Link
							href="/admin" // This link goes to the dynamic dashboard page
							className="flex items-center gap-2 font-semibold"
						>
							<Image src="/logo.png" alt="Logo" width={32} height={32} className="h-8 w-8 object-contain" />
							<span className="">{portalTitle}</span> 
						</Link>
					</div>
					<div className="flex-1">
						<nav className="grid items-start px-2 font-medium text-sm lg:px-4">
							{navItemsToDisplay.map((item: AdminNavItem) => (
								<React.Fragment key={`${item.href}-desktop`}>
									<Link
										href={item.href}
										className={cn(
											"flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
											item.subMenu && item.subMenu.length > 0 ? "font-semibold" : "",
											pathname === item.href ||
												(item.href !== "/admin" &&
													pathname.startsWith(item.href))
												? "bg-muted text-primary"
												: "",
										)}
									>
										{item.icon && <item.icon className="h-4 w-4" />} {/* Safely render icon */}
										{item.label}
									</Link>
									{item.subMenu && item.subMenu.length > 0 && (
										<div className="ml-7 grid gap-1">
											{item.subMenu.map((subItem: AdminNavItem) => (
												<Link
													key={`${subItem.href}-desktop`}
													href={subItem.href}
													className={cn(
														"flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground text-xs transition-all hover:text-primary",
														pathname === subItem.href
															? "bg-muted text-primary"
															: "",
													)}
												>
													{subItem.label}
												</Link>
											))}
										</div>
									)}
								</React.Fragment>
							))}
						</nav>
					</div>
					{/* Back to Main Menu button moved to the bottom */}
					<div className="px-4 py-2 border-t bg-muted/30 mt-auto">
						<Link
							href="/"
							className="inline-block w-full rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
						>
							← Back to Main Menu
						</Link>
					</div>
				</div>
			</div>

			<div className="flex flex-col">
				<AdminPageHeader title={headerTitle} navItems={navItemsToDisplay} portalHeaderTitle={portalTitle} />

				<header className="hidden h-14 items-center gap-4 border-b bg-muted/40 px-4 md:flex lg:h-[60px] lg:px-6">
					<div className="w-full flex-1">
						<h1 className="font-semibold text-lg">{headerTitle}</h1>
					</div>
				</header>

				<main className="flex flex-1 flex-col gap-4 bg-background p-4 lg:gap-6 lg:p-6">
					{children}
				</main>

				<nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
					<div className="flex h-16 items-center justify-around">
						{bottomNavItemsToDisplay.map((item: AdminNavItem) => {
							const Icon = item.icon;
							const isActive =
								(item.href === "/admin" && pathname === "/admin") ||
								(item.href !== "/admin" && pathname.startsWith(item.href));
							return (
								<Link
									key={`${item.href}-bottom`}
									href={item.href}
									className={cn(
										"flex flex-col items-center justify-center gap-1 p-2 font-medium text-xs",
										isActive
											? "text-primary"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									{Icon && <Icon className="h-5 w-5" />} {/* Safely render Icon */}
									<span>{item.label}</span>
								</Link>
							);
						})}
					</div>
				</nav>
			</div>
		</div>
	);
}
