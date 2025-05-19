import { DatePickerWithRange } from "@/app/_components/common/date-range-picker"; // Assuming this component exists or will be created
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import React from "react";

// Mock Data
const mockSalesData = [
	{
		id: "s1",
		date: "2023-10-26",
		dishName: "Chicken Curry",
		quantity: 50,
		totalAmount: "750.00 TL",
	},
	{
		id: "s2",
		date: "2023-10-26",
		dishName: "Lentil Soup",
		quantity: 80,
		totalAmount: "640.00 TL",
	},
	{
		id: "s3",
		date: "2023-10-25",
		dishName: "Beef Stew",
		quantity: 40,
		totalAmount: "800.00 TL",
	},
	{
		id: "s4",
		date: "2023-10-25",
		dishName: "Rice Pilaf",
		quantity: 100,
		totalAmount: "700.00 TL",
	},
];

const mockSummaryStats = {
	totalSales: "3250.00 TL",
	totalItemsSold: 270,
	topSellingItem: "Rice Pilaf (100 units)",
};

export default function SalesReportPage() {
	// TODO: Implement date range filtering and actual data fetching
	return (
		<div className="space-y-6 p-2 sm:p-0">
			<div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-semibold text-xl md:text-2xl">Sales Reports</h1>
					<p className="text-muted-foreground">
						View sales data and filter by date range.
					</p>
				</div>
				<div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row">
					<DatePickerWithRange className="w-full sm:w-auto" />
					<Button variant="outline" className="w-full sm:w-auto">
						<Download className="mr-2 h-4 w-4" /> Export CSV
					</Button>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
				<Card className="w-full">
					<CardHeader>
						<CardTitle>Total Sales</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="font-bold text-2xl">{mockSummaryStats.totalSales}</p>
					</CardContent>
				</Card>
				<Card className="w-full">
					<CardHeader>
						<CardTitle>Items Sold</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="font-bold text-2xl">
							{mockSummaryStats.totalItemsSold}
						</p>
					</CardContent>
				</Card>
				<Card className="w-full">
					<CardHeader>
						<CardTitle>Top Seller</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="font-semibold text-lg">
							{mockSummaryStats.topSellingItem}
						</p>
					</CardContent>
				</Card>
			</div>

			<Card className="mb-[80px] w-full">
				<CardHeader className="-mb-4 p-4">
					<CardTitle>Detailed Sales Data</CardTitle>
				</CardHeader>
				<CardContent className="p-0 md:p-4">
					{/* Desktop Table - Hidden on sm and below */}
					<div className="hidden overflow-x-auto md:block">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Dish Name</TableHead>
									<TableHead className="text-right">Quantity Sold</TableHead>
									<TableHead className="text-right">Total Amount</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{mockSalesData.map((sale) => (
									<TableRow key={sale.id}>
										<TableCell>
											{new Date(sale.date).toLocaleDateString("en-CA")}
										</TableCell>
										<TableCell>{sale.dishName}</TableCell>
										<TableCell className="text-right">
											{sale.quantity}
										</TableCell>
										<TableCell className="text-right font-medium">
											{sale.totalAmount}
										</TableCell>
									</TableRow>
								))}
								{mockSalesData.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={4}
											className="h-24 text-center text-muted-foreground"
										>
											No sales data found for the selected period.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					{/* Mobile Card List - Visible on sm and below, hidden on md and up */}
					<div className="block space-y-2 p-2 md:hidden md:p-4">
						{mockSalesData.length === 0 && (
							<p className="py-8 text-center text-muted-foreground">
								No sales data found for the selected period.
							</p>
						)}
						{mockSalesData.map((sale) => (
							<Card
								key={`${sale.id}-mobile`}
								className="w-full rounded-lg border shadow-sm"
							>
								<CardContent className="space-y-1 px-4 text-sm">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-foreground">
											{sale.dishName}
										</span>
										<span className="text-muted-foreground text-xs">
											{new Date(sale.date).toLocaleDateString("en-CA")}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Quantity:</span>
										<span className="font-medium text-foreground">
											{sale.quantity}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Amount:</span>
										<span className="font-bold text-primary">
											{sale.totalAmount}
										</span>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
