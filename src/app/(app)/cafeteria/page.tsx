import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; // Assuming you have this for date picking
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// Mock data - replace with API call
const mockMenu = {
	date: new Date(),
	items: [
		{
			id: "1",
			name: "Chicken Curry",
			price: "15.00 TL",
			calories: "550 kcal",
			category: "Main Course",
		},
		{
			id: "2",
			name: "Lentil Soup",
			price: "8.00 TL",
			calories: "230 kcal",
			category: "Soup",
		},
		{
			id: "3",
			name: "Rice Pilaf",
			price: "7.00 TL",
			calories: "300 kcal",
			category: "Side Dish",
		},
		{
			id: "4",
			name: "Shepherd's Salad",
			price: "10.00 TL",
			calories: "180 kcal",
			category: "Salad",
		},
		{
			id: "5",
			name: "Baklava",
			price: "12.00 TL",
			calories: "400 kcal",
			category: "Dessert",
		},
	],
};

export default function CafeteriaMenuPage() {
	// TODO: Implement date selection and API call to fetch menu for selected date
	const selectedDate = new Date();

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-semibold text-2xl">Daily Cafeteria Menu</h1>
					<p className="text-muted-foreground">
						Showing menu for{" "}
						{selectedDate.toLocaleDateString("en-US", { dateStyle: "long" })}
					</p>
				</div>
				{/* <Calendar mode="single" selected={selectedDate} onSelect={() => {}} className="rounded-md border" /> */}
				{/* Calendar can be added here later for date selection */}
				<Button asChild>
					<Link href="/cafeteria/qr-payment">Go to Payment QR</Link>
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{mockMenu.items.map((item) => (
					<Card key={item.id}>
						<CardHeader>
							<CardTitle className="text-lg">{item.name}</CardTitle>
							<Badge variant="secondary" className="w-fit">
								{item.category}
							</Badge>
						</CardHeader>
						<CardContent>
							<p className="font-semibold text-xl">{item.price}</p>
							<p className="text-muted-foreground text-sm">{item.calories}</p>
						</CardContent>
						{/* Add to cart/selection button can be added here */}
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
