"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar"; // Calendar import commented out for now
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { api } from "@/trpc/react";
import { AlertTriangle, Loader2 } from "lucide-react";

// Mock data removed

export default function CafeteriaMenuPage() {
	const selectedDate = new Date(); // Placeholder for now, actual date filtering needs backend support

	const { data: menuData, isLoading, error } = api.cafeteria.listMenus.useQuery({
    // Add any default filters if needed, e.g., for "today's menus" if backend supported it
    // For now, fetching all menus with default pagination (take 10)
    // You might want to increase `take` for a "daily menu" page or implement proper pagination.
    limit: 50, // Example: fetch up to 50 menus for the daily view
  });

	if (isLoading) {
		return (
			<div className="flex h-full flex-col items-center justify-center space-y-4">
				<Loader2 className="h-12 w-12 animate-spin text-primary" />
				<p className="text-lg text-muted-foreground">Loading menus...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full flex-col items-center justify-center space-y-4 rounded-md border border-destructive/50 bg-destructive/10 p-8">
				<AlertTriangle className="h-12 w-12 text-destructive" />
				<p className="text-lg font-semibold text-destructive">Error loading menus</p>
				<p className="text-sm text-destructive/80">{error.message}</p>
				{/* You could add a refetch button here */}
			</div>
		);
	}

	const menus = menuData?.menus ?? [];

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-semibold text-2xl">Daily Cafeteria Menu</h1>
					<p className="text-muted-foreground">
						Showing available menus for{" "}
						{selectedDate.toLocaleDateString("en-US", { dateStyle: "long" })}
					</p>
				</div>
				<Button asChild>
					<Link href="/cafeteria/qr-payment">Go to Payment QR</Link>
				</Button>
			</div>

			{menus.length === 0 && !isLoading && (
				<Card className="text-center">
					<CardHeader>
						<CardTitle>No Menus Available</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">There are no menus to display for the selected date or criteria.</p>
					</CardContent>
				</Card>
			)}

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{menus.map((menu) => (
					<Card key={menu.menuId} className="flex flex-col">
						<CardHeader>
							<div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{menu.menuName}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    ID: {menu.menuId.substring(0, 6)}...
                  </CardDescription>
                </div>
								<Badge variant="default" className="whitespace-nowrap">
									{menu.price.toString()} TL
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="flex-grow space-y-3">
							<p className="font-semibold text-sm">Dishes included:</p>
							{menu.menuDishes.length > 0 ? (
								<ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
									{menu.menuDishes.map((menuDish) => (
										<li key={menuDish.dish.dishId}>
											{menuDish.dish.dishName}
											{menuDish.dish.calories && (
												<span className="ml-2 text-xs">({menuDish.dish.calories} kcal)</span>
											)}
										</li>
									))}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground">No dishes listed for this menu.</p>
							)}
						</CardContent>
						{/* Optional: Add a button to select/order the menu */}
					</Card>
				))}
			</div>

			<div className="mt-8 mb-[100px] flex flex-col items-center gap-4">
				<Button variant="outline" asChild>
					<Link href="/cafeteria/digital-wallet">My Digital Wallet</Link>
				</Button>
				<Button variant="link" asChild>
					<Link href="/">Back to Home</Link>
				</Button>
			</div>
		</div>
	);
}
