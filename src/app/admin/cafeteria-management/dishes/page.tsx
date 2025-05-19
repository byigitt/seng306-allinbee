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
import { Edit, PlusCircle, Trash2 } from "lucide-react";

// Mock data - replace with API call
const mockDishes = [
	{
		id: "d1",
		name: "Chicken Curry",
		price: "15.00",
		category: "Main Course",
		available: true,
	},
	{
		id: "d2",
		name: "Lentil Soup",
		price: "8.00",
		category: "Soup",
		available: false,
	},
	{
		id: "d3",
		name: "Beef Burger",
		price: "22.50",
		category: "Fast Food",
		available: true,
	},
	{
		id: "d4",
		name: "Green Salad",
		price: "12.00",
		category: "Salad",
		available: true,
	},
];

export default function ManageDishesPage() {
	// TODO: Implement CRUD operations for dishes
	return (
		<div className="space-y-6 p-4 md:p-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-semibold text-2xl">Manage Dishes</h1>
					<p className="text-muted-foreground">
						Add, edit, or remove cafeteria dishes.
					</p>
				</div>
				<Button className="w-full md:w-auto">
					<PlusCircle className="mr-2 h-4 w-4" /> Add New Dish
				</Button>
			</div>

			{/* Placeholder for Add/Edit Dish Form/Modal - Consider making this a separate component/dialog */}
			{/* 
      <Card>
        <CardHeader><CardTitle>Add/Edit Dish</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2"><Label htmlFor="dish-name">Dish Name</Label><Input id="dish-name" /></div>
          <div className="grid gap-2"><Label htmlFor="dish-price">Price (TL)</Label><Input id="dish-price" type="number" /></div>
          <div className="grid gap-2"><Label htmlFor="dish-category">Category</Label><Input id="dish-category" /></div>
          <Button>Save Dish</Button>
        </CardContent>
      </Card> 
      */}

			<Card className="mb-[80px]">
				<CardHeader>
					<CardTitle>Existing Dishes</CardTitle>
					<CardDescription>
						View and manage all current dishes in the cafeteria.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{mockDishes.length > 0 ? (
						<div className="space-y-4">
							{/* Mobile View: List of Cards */}
							<div className="space-y-4 md:hidden">
								{mockDishes.map((dish) => (
									<Card key={`${dish.id}-mobile`} className="w-full">
										<CardHeader>
											<CardTitle className="text-lg">{dish.name}</CardTitle>
											<CardDescription>{dish.category}</CardDescription>
										</CardHeader>
										<CardContent className="space-y-3">
											<div className="flex justify-between">
												<span className="font-medium text-sm">Price:</span>
												<span className="text-primary text-sm">
													{dish.price} TL
												</span>
											</div>
											<div className="flex justify-between">
												<span className="font-medium text-sm">Status:</span>
												<span
													className={`font-semibold text-sm ${dish.available ? "text-green-600" : "text-red-600"}`}
												>
													{dish.available ? "Available" : "Unavailable"}
												</span>
											</div>
											<div className="flex flex-col gap-2 pt-3 sm:flex-row sm:justify-end">
												<Button
													variant="outline"
													size="sm"
													className="w-full sm:w-auto"
												>
													<Edit className="mr-2 h-4 w-4" /> Edit
												</Button>
												<Button
													variant="destructive"
													size="sm"
													className="w-full sm:w-auto"
												>
													<Trash2 className="mr-2 h-4 w-4" /> Delete
												</Button>
											</div>
										</CardContent>
									</Card>
								))}
							</div>

							{/* Desktop View: Table-like List */}
							<div className="hidden rounded-lg border md:block">
								{mockDishes.map((dish, index) => (
									<div
										key={`${dish.id}-desktop`}
										className={`flex items-center justify-between p-4 ${index < mockDishes.length - 1 ? "border-b" : ""}`}
									>
										<div className="flex-1">
											<p className="font-medium">{dish.name}</p>
											<p className="text-muted-foreground text-sm">
												{dish.category}
											</p>
										</div>
										<div className="w-24 text-right font-semibold text-primary">
											{dish.price} TL
										</div>
										<div
											className={`w-28 text-center font-semibold ${dish.available ? "text-green-600" : "text-red-600"}`}
										>
											{dish.available ? "Available" : "Unavailable"}
										</div>
										<div className="flex w-40 justify-end gap-2">
											<Button variant="outline" size="sm">
												<Edit className="mr-1 h-4 w-4" /> Edit
											</Button>
											<Button variant="destructive" size="sm">
												<Trash2 className="mr-1 h-4 w-4" /> Delete
											</Button>
										</div>
									</div>
								))}
							</div>
						</div>
					) : (
						<div className="py-10 text-center">
							<p className="font-medium text-lg text-muted-foreground">
								No dishes found.
							</p>
							<p className="text-muted-foreground text-sm">
								Start by adding a new dish to the menu.
							</p>
							<Button className="mt-4">
								<PlusCircle className="mr-2 h-4 w-4" /> Add New Dish
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
