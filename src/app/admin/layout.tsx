"use client";

import { Bus, CalendarCheck, Home, Package2, Utensils } from "lucide-react"; // Simplified imports, MenuIcon is in AdminPageHeader
import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import React from "react";

// Import the new AdminPageHeader component
import AdminPageHeader from "@/app/_components/common/admin-page-header";

// Keep AdminNavItems definition here as it's used by AdminPageHeader and desktop sidebar
const adminNavItems = [
	{ href: "/admin", label: "Dashboard", icon: Home },
	{
		href: "/admin/cafeteria-management",
		label: "Cafeteria Mgmt",
		icon: Utensils,
		subMenu: [
			{ href: "/admin/cafeteria-management/dishes", label: "Manage Dishes" },
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

const adminBottomNavItems = [
	{ href: "/admin", label: "Dashboard", icon: Home },
	{ href: "/admin/cafeteria-management", label: "Cafeteria", icon: Utensils },
	{ href: "/admin/ring-tracking-management", label: "Ring Bus", icon: Bus },
	{
		href: "/admin/appointment-management",
		label: "Bookings",
		icon: CalendarCheck,
	},
];

export default function AdminLayout({
	children,
}: { children: React.ReactNode }) {
	const pathname = usePathname();
	// TODO: Implement a way to get the current page's title dynamically for AdminPageHeader
	const currentPageTitle = "Admin Panel"; // Placeholder

	return (
		<div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
			{/* Desktop Sidebar - remains the same */}
			<div className="hidden border-r bg-muted/40 md:block">
				<div className="flex h-full max-h-screen flex-col gap-2">
					<div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
						<Link
							href="/admin"
							className="flex items-center gap-2 font-semibold"
						>
							<Image src="/logo.png" alt="Logo" width={32} height={32} className="h-8 w-8 object-contain" />
							<span className="">AllInBee Admin</span>
						</Link>
					</div>
					<div className="flex-1">
						<nav className="grid items-start px-2 font-medium text-sm lg:px-4">
							{adminNavItems.map((item) => (
								<React.Fragment key={`${item.href}-desktop`}>
									<Link
										href={item.href}
										className={cn(
											"flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
											item.subMenu ? "font-semibold" : "",
											pathname === item.href ||
												(item.href !== "/admin" &&
													pathname.startsWith(item.href))
												? "bg-muted text-primary"
												: "",
										)}
									>
										<item.icon className="h-4 w-4" />
										{item.label}
									</Link>
									{item.subMenu && (
										<div className="ml-7 grid gap-1">
											{item.subMenu.map((subItem) => (
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
				{/* Use the new AdminPageHeader for mobile header */}
				<AdminPageHeader title={currentPageTitle} navItems={adminNavItems} />

				{/* Desktop Header (Title part) - This div ensures the title is shown on desktop 
             and does not interfere with the mobile header which is handled by AdminPageHeader.
             The AdminPageHeader itself is hidden on md+ screens via its own Tailwind classes.
        */}
				<header className="hidden h-14 items-center gap-4 border-b bg-muted/40 px-4 md:flex lg:h-[60px] lg:px-6">
					<div className="w-full flex-1">
						{/* This title should ideally be dynamic based on the content of {children} */}
						<h1 className="font-semibold text-lg">{currentPageTitle}</h1>
					</div>
					{/* Potential place for desktop-specific header actions if any */}
				</header>

				<main className="flex flex-1 flex-col gap-4 bg-background p-4 lg:gap-6 lg:p-6">
					{children}
				</main>

				{/* Admin Bottom Navigation - remains the same */}
				<nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
					<div className="flex h-16 items-center justify-around">
						{adminBottomNavItems.map((item) => {
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
									<Icon className="h-5 w-5" />
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
