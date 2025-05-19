"use client";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu as MenuIcon, Package2 } from "lucide-react"; // Using MenuIcon to avoid conflicts if Menu is used differently
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import Image from "next/image";

interface AdminNavItem {
	href: string;
	label: string;
	icon?: React.ElementType;
	subMenu?: AdminNavItem[];
}

interface AdminPageHeaderProps {
	title: string;
	navItems: AdminNavItem[];
}

export default function AdminPageHeader({
	title,
	navItems,
}: AdminPageHeaderProps) {
	const pathname = usePathname();

	return (
		<header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
			<Sheet>
				<SheetTrigger asChild>
					<Button size="icon" variant="outline" className="shrink-0">
						<MenuIcon className="h-5 w-5" />
						<span className="sr-only">Toggle Admin Menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="left" className="flex flex-col p-0 sm:max-w-xs">
					<SheetTitle className="sr-only">Admin Menu</SheetTitle>
					<div className="flex items-center justify-between border-b px-4 py-4">
						<Link
							href="/admin"
							className="flex items-center gap-2 rounded-full bg-primary px-3 py-2 font-bold text-lg text-primary-foreground shadow"
						>
							<Image src="/logo.png" alt="Logo" width={24} height={24} className="h-6 w-6 object-contain" />
							<span className="text-sm">AllInBee Admin</span>
						</Link>
						<SheetClose asChild>
							<Button size="icon" variant="ghost" className="rounded-full">
								<MenuIcon className="h-5 w-5" />
								<span className="sr-only">Close Admin Menu</span>
							</Button>
						</SheetClose>
					</div>
					<nav className="flex-grow space-y-1 overflow-y-auto px-4 py-6">
						{navItems.map((item) => (
							<React.Fragment key={`${item.href}-admin-mobile`}>
								<Link
									href={item.href}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-3 font-medium text-base text-foreground transition hover:bg-accent hover:text-accent-foreground",
										item.subMenu ? "font-semibold" : "",
										pathname === item.href ||
											(item.href !== "/admin" && pathname.startsWith(item.href))
											? "bg-accent text-accent-foreground"
											: "",
									)}
								>
									{item.icon && <item.icon className="h-5 w-5 text-primary" />}
									{item.label}
								</Link>
								{item.subMenu && (
									<div className="ml-8 space-y-1 py-1">
										{item.subMenu.map((subItem) => (
											<Link
												key={`${subItem.href}-admin-mobile-sub`}
												href={subItem.href}
												className={cn(
													"flex items-center gap-3 rounded-md px-3 py-2 font-medium text-muted-foreground text-sm transition hover:bg-accent hover:text-accent-foreground",
													pathname === subItem.href
														? "bg-accent text-accent-foreground"
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
					<div className="px-4 py-2 border-t bg-muted/30">
						<Link
							href="/"
							className="inline-block w-full rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
						>
							← Back to Main Menu
						</Link>
					</div>
				</SheetContent>
			</Sheet>
			<div className="flex items-center gap-2 flex-1">
				<Image src="/logo.png" alt="Logo" width={24} height={24} className="h-6 w-6 object-contain" />
				<h1 className="whitespace-nowrap font-semibold text-lg">{title}</h1>
			</div>
			{/* Optional: Add admin-specific header actions here, like a global search or quick actions */}
		</header>
	);
}
