"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Activity,
	ArrowLeft,
	CalendarDays,
	DollarSign,
	ShoppingCart,
	Users,
	Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api } from "@/trpc/react";
import { useMemo } from "react";
import {
	LineChart,
	Line,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

// Helper functions for date ranges
function getMonthDateRange(refDate: Date, monthOffset = 0) {
	const date = new Date(refDate.getFullYear(), refDate.getMonth() + monthOffset, 1);
	const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
	firstDay.setHours(0, 0, 0, 0);
	const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
	lastDay.setHours(23, 59, 59, 999);
	return { startDate: firstDay, endDate: lastDay };
}

function getWeekDateRange(refDate: Date, weekOffset = 0) {
	const date = new Date(refDate);
	date.setDate(date.getDate() + weekOffset * 7); // Apply week offset
	const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)
	// Adjust to get Monday of the target week
	const diffToMonday = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
	const monday = new Date(date.getFullYear(), date.getMonth(), diffToMonday);
	monday.setHours(0, 0, 0, 0);

	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	sunday.setHours(23, 59, 59, 999);
	return { startDate: monday, endDate: sunday };
}

// Placeholder for a chart component - in a real app, you'd use a library like Recharts or Chart.js
const PlaceholderChart = ({ title }: { title: string }) => (
	<div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed">
		<p className="text-muted-foreground">{title} - Chart Placeholder</p>
	</div>
);

// Chart for Monthly User Sign-ups
const MonthlySignupsChart = () => {
	const { data, isLoading, error } = api.user.getMonthlySignups.useQuery(
		{ months: 12 },
		{ refetchOnWindowFocus: false }
	);

	if (isLoading) return <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed"><p className="text-muted-foreground">Loading Sign-ups Chart...</p></div>;
	if (error) return <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed"><p className="text-destructive">Error loading sign-ups: {error.message}</p></div>;
	if (!data || data.length === 0) return <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed"><p className="text-muted-foreground">No sign-up data available.</p></div>;

	return (
		<ResponsiveContainer width="100%" height={300}>
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="month" />
				<YAxis allowDecimals={false} />
				<Tooltip />
				<Legend />
				<Bar dataKey="count" fill="#8884d8" name="New Users" />
			</BarChart>
		</ResponsiveContainer>
	);
};

// Chart for Daily Cafeteria Revenue
const DailyRevenueChart = () => {
	const { data, isLoading, error } = api.cafeteria.getDailyRevenue.useQuery(
		{ days: 30 },
		{ refetchOnWindowFocus: false }
	);

	if (isLoading) return <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed"><p className="text-muted-foreground">Loading Revenue Chart...</p></div>;
	if (error) return <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed"><p className="text-destructive">Error loading revenue: {error.message}</p></div>;
	if (!data || data.length === 0) return <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed"><p className="text-muted-foreground">No revenue data available.</p></div>;
	
	return (
		<ResponsiveContainer width="100%" height={300}>
			<LineChart data={data}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="date" />
				<YAxis tickFormatter={(value) => `$${value}`} />
				<Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]} />
				<Legend />
				<Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Daily Revenue" />
			</LineChart>
		</ResponsiveContainer>
	);
};

// Chart for Feature Usage
const FeatureUsageChart = () => {
	const { data, isLoading, error } = api.user.getFeatureUsageStats.useQuery(
		undefined, // No input params for this one
		{ refetchOnWindowFocus: false }
	);

	if (isLoading) return <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed"><p className="text-muted-foreground">Loading Feature Usage...</p></div>;
	if (error) return <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed"><p className="text-destructive">Error loading feature usage: {error.message}</p></div>;
	if (!data) return <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed"><p className="text-muted-foreground">No feature usage data available.</p></div>;

	const chartData = [
		{ name: "Appointments", count: data.appointments },
		{ name: "Cafeteria Sales", count: data.cafeteriaSales }, // Based on Sale records (days with sales)
		{ name: "Ring Tracking (Favs)", count: data.ringTrackingFavorites },
	];

	return (
		<ResponsiveContainer width="100%" height={300}>
			<BarChart data={chartData}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="name" />
				<YAxis allowDecimals={false} />
				<Tooltip />
				<Legend />
				<Bar dataKey="count" fill="#ffc658" name="Usage Count" />
			</BarChart>
		</ResponsiveContainer>
	);
};

// Chart for Buses Assigned Per Route
const BusesPerRouteChart = () => {
	const { data, isLoading, error } = api.ringTracking.getBusesAssignedPerRoute.useQuery(
		undefined,
		{ refetchOnWindowFocus: false }
	);

	if (isLoading) return <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed"><p className="text-muted-foreground">Loading Buses/Route Chart...</p></div>;
	if (error) return <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed"><p className="text-destructive">Error: {error.message}</p></div>;
	if (!data || data.length === 0) return <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed"><p className="text-muted-foreground">No bus assignment data.</p></div>;

	return (
		<ResponsiveContainer width="100%" height={300}>
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="routeName" angle={-30} textAnchor="end" height={70} interval={0} />
				<YAxis allowDecimals={false} />
				<Tooltip />
				<Legend />
				<Bar dataKey="busCount" fill="#82ca9d" name="Buses Assigned" />
			</BarChart>
		</ResponsiveContainer>
	);
};

export default function AdminAnalyticsPage() {
	const today = useMemo(() => new Date(), []);

	// 1. Total Users
	const { data: usersData, isLoading: isLoadingUsers } =
		api.user.adminListUsers.useQuery(
			{ take: 1 }, // We only need the count
			{ refetchOnWindowFocus: false }
		);

	// 2. Cafeteria Sales
	const currentMonthRange = useMemo(() => getMonthDateRange(today, 0), [today]);
	const previousMonthRange = useMemo(() => getMonthDateRange(today, -1), [today]);

	const { data: currentMonthSalesData, isLoading: isLoadingCurrentSales } =
		api.cafeteria.getSalesData.useQuery(
			{
				dateFrom: currentMonthRange.startDate.toISOString(),
				dateTo: currentMonthRange.endDate.toISOString(),
				take: 10000, // Fetch all sales for the month
			},
			{ refetchOnWindowFocus: false }
		);

	const { data: previousMonthSalesData, isLoading: isLoadingPreviousSales } =
		api.cafeteria.getSalesData.useQuery(
			{
				dateFrom: previousMonthRange.startDate.toISOString(),
				dateTo: previousMonthRange.endDate.toISOString(),
				take: 10000, // Fetch all sales for the month
			},
			{ refetchOnWindowFocus: false }
		);
	
	const cafeteriaSalesStats = useMemo(() => {
		let currentSalesTotal = 0;
		if (currentMonthSalesData?.sales) {
			for (const sale of currentMonthSalesData.sales) {
				currentSalesTotal += sale.numSold * Number(sale.menu.price);
			}
		}

		let previousSalesTotal = 0;
		if (previousMonthSalesData?.sales) {
			for (const sale of previousMonthSalesData.sales) {
				previousSalesTotal += sale.numSold * Number(sale.menu.price);
			}
		}
		
		let percentageChange = 0;
		if (previousSalesTotal > 0) {
			percentageChange = ((currentSalesTotal - previousSalesTotal) / previousSalesTotal) * 100;
		} else if (currentSalesTotal > 0) {
			percentageChange = 100; // Infinite growth if previous was 0
		}
		return {
			total: currentSalesTotal,
			percentageChange: percentageChange,
		};
	}, [currentMonthSalesData, previousMonthSalesData]);

	// 3. Appointments Booked
	const currentWeekRange = useMemo(() => getWeekDateRange(today, 0), [today]);
	const previousWeekRange = useMemo(() => getWeekDateRange(today, -1), [today]);
	
	const { data: currentWeekAppointments, isLoading: isLoadingCurrentAppointments } = 
		api.appointments.adminListAllAppointments.useQuery(
			{ 
				dateFrom: currentWeekRange.startDate.toISOString(),
				dateTo: currentWeekRange.endDate.toISOString(),
				take: 1 // We only need totalCount
			},
			{ refetchOnWindowFocus: false }
		);

	const { data: previousWeekAppointments, isLoading: isLoadingPreviousAppointments } = 
		api.appointments.adminListAllAppointments.useQuery(
			{ 
				dateFrom: previousWeekRange.startDate.toISOString(),
				dateTo: previousWeekRange.endDate.toISOString(),
				take: 1 // We only need totalCount
			},
			{ refetchOnWindowFocus: false }
		);
	
	const appointmentStats = useMemo(() => {
		const currentBookings = currentWeekAppointments?.totalCount ?? 0;
		const previousBookings = previousWeekAppointments?.totalCount ?? 0;
		let percentageChange = 0;
		if (previousBookings > 0) {
			percentageChange = ((currentBookings - previousBookings) / previousBookings) * 100;
		} else if (currentBookings > 0) {
			percentageChange = 100;
		}
		return {
			total: currentBookings,
			percentageChange: percentageChange,
		};
	}, [currentWeekAppointments, previousWeekAppointments]);


	// 4. Active Ring Buses
	const { data: liveBusesData, isLoading: isLoadingLiveBuses } = 
		api.ringTracking.getLiveBusLocations.useQuery(
			{},
			{ refetchOnWindowFocus: false }
		);
	const { data: totalBusesData, isLoading: isLoadingTotalBuses } = 
		api.ringTracking.listBuses.useQuery(
			{ take: 1 }, // We only need totalCount
			{ refetchOnWindowFocus: false }
		);

	const activeBusesCount = liveBusesData?.length ?? 0;
	const totalBusesCount = totalBusesData?.totalCount ?? 0;


	const formatPercentage = (value: number | undefined) => {
		if (value === undefined || Number.isNaN(value)) return "N/A";
		const sign = value >= 0 ? "+" : "";
		return `${sign}${value.toFixed(1)}%`;
	};
	
	// Specific Analytics Data
	const { data: mostPopularDishData, isLoading: isLoadingMostPopularDish } = 
		api.cafeteria.getMostPopularDish.useQuery(undefined, { refetchOnWindowFocus: false });

	const { data: mostFavoritedRouteData, isLoading: isLoadingMostFavoritedRoute } = 
		api.ringTracking.getMostFavoritedRoute.useQuery(undefined, { refetchOnWindowFocus: false });

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 mb-[80px]">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/admin">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<h1 className="font-semibold text-2xl md:text-3xl">
						Analytics Dashboard
					</h1>
				</div>
				{/* Placeholder for date range picker or other global filters */}
			</div>

			{/* KPIs Row */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Users</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoadingUsers ? "Loading..." : usersData?.totalCount ?? "N/A"}
						</div>
						{/* Percentage change for users is more complex and omitted for now */}
						{/* <p className="text-muted-foreground text-xs">
							+10.2% from last month
						</p> */}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Cafeteria Sales
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoadingCurrentSales || isLoadingPreviousSales ? "Loading..." : `$${cafeteriaSalesStats.total.toFixed(2)}`}
						</div>
						<p className="text-muted-foreground text-xs">
							{isLoadingCurrentSales || isLoadingPreviousSales ? "Loading..." : `${formatPercentage(cafeteriaSalesStats.percentageChange)} from last month`}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Appointments Booked
						</CardTitle>
						<CalendarDays className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoadingCurrentAppointments || isLoadingPreviousAppointments ? "Loading..." : `+${appointmentStats.total}`}
						</div>
						<p className="text-muted-foreground text-xs">
							{isLoadingCurrentAppointments || isLoadingPreviousAppointments ? "Loading..." : `${formatPercentage(appointmentStats.percentageChange)} from last week`}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Active Ring Buses
						</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoadingLiveBuses || isLoadingTotalBuses ? "Loading..." : `${activeBusesCount} / ${totalBusesCount}`}
						</div>
						<p className="text-muted-foreground text-xs">
							{totalBusesCount > 0 && activeBusesCount === totalBusesCount ? "All buses active" : totalBusesCount > 0 ? `${activeBusesCount} of ${totalBusesCount} active` : "No bus data"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts Row */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>User Sign-ups Over Time</CardTitle>
						<CardDescription>Monthly new user registrations (last 12 months).</CardDescription>
					</CardHeader>
					<CardContent>
						<MonthlySignupsChart />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Feature Usage</CardTitle>
						<CardDescription>
							Relative engagement with major app features.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FeatureUsageChart />
					</CardContent>
				</Card>
			</div>

			{/* System Specific Analytics */}
			<div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Cafeteria Analytics</CardTitle>
						<CardDescription>Popular dishes, peak hours, etc.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-2 text-sm">
							<div className="flex justify-between">
								<span>Most Popular Dish:</span>
								<span className="font-semibold">
									{isLoadingMostPopularDish ? "Loading..." : mostPopularDishData?.name ?? "N/A"}
									{mostPopularDishData && mostPopularDishData.name !== "N/A" ? ` (${mostPopularDishData.count} sold)` : ""}
								</span>
							</div>
							<div className="flex justify-between">
								<span>Peak Ordering Time:</span>
								<span className="font-semibold">
									12:00 PM - 1:00 PM (Placeholder)
								</span>
							</div>
							<div className="flex justify-between">
								<span>Average Order Value:</span>
								<span className="font-semibold">$8.50 (Placeholder)</span>
							</div>
						</div>
						<div className="mt-4">
							<DailyRevenueChart />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Ring Tracking Analytics</CardTitle>
						<CardDescription>
							Route popularity, ETA accuracy, etc.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-2 text-sm">
							<div className="flex justify-between">
								<span>Most Favorited Route:</span>
								<span className="font-semibold">
									{isLoadingMostFavoritedRoute ? "Loading..." : mostFavoritedRouteData?.routeName ?? "N/A"}
									{mostFavoritedRouteData && mostFavoritedRouteData.routeName !== "N/A" ? ` (${mostFavoritedRouteData.count} favorites)` : ""}
								</span>
							</div>
							<div className="flex justify-between">
								<span>Average Wait Time:</span>
								<span className="font-semibold">7 mins (Placeholder)</span>
							</div>
							<div className="flex justify-between">
								<span>Peak Usage Hours:</span>
								<span className="font-semibold">
									8:00 AM - 9:00 AM (Placeholder)
								</span>
							</div>
						</div>
						<div className="mt-4">
							<BusesPerRouteChart />
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
