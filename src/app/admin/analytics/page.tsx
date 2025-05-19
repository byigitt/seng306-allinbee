import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, ShoppingCart, Activity, CalendarDays, Utensils } from "lucide-react";

// Placeholder for a chart component - in a real app, you'd use a library like Recharts or Chart.js
const PlaceholderChart = ({ title }: { title: string }) => (
  <div className="w-full h-64 border border-dashed rounded-lg flex items-center justify-center">
    <p className="text-muted-foreground">{title} - Chart Placeholder</p>
  </div>
);

export default function AdminAnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold md:text-3xl">Analytics Dashboard</h1>
        {/* Placeholder for date range picker or other global filters */}
      </div>

      {/* KPIs Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+1,234</div>
            <p className="text-xs text-muted-foreground">+10.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cafeteria Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$15,231.89</div>
            <p className="text-xs text-muted-foreground">+5.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments Booked</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+450</div>
            <p className="text-xs text-muted-foreground">+8.0% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Ring Buses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 / 5</div>
            <p className="text-xs text-muted-foreground">All routes operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Sign-ups Over Time</CardTitle>
            <CardDescription>Monthly new user registrations.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlaceholderChart title="User Sign-ups" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
            <CardDescription>Popularity of different app features.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlaceholderChart title="Feature Usage (e.g., Cafeteria vs. Ring Tracking)" />
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
                    <span className="font-semibold">Avocado Toast (Placeholder)</span>
                </div>
                <div className="flex justify-between">
                    <span>Peak Ordering Time:</span>
                    <span className="font-semibold">12:00 PM - 1:00 PM (Placeholder)</span>
                </div>
                <div className="flex justify-between">
                    <span>Average Order Value:</span>
                    <span className="font-semibold">$8.50 (Placeholder)</span>
                </div>
            </div>
            <div className="mt-4">
                 <PlaceholderChart title="Daily Cafeteria Revenue" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ring Tracking Analytics</CardTitle>
            <CardDescription>Route popularity, ETA accuracy, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                    <span>Most Used Route:</span>
                    <span className="font-semibold">Campus Loop A (Placeholder)</span>
                </div>
                <div className="flex justify-between">
                    <span>Average Wait Time:</span>
                    <span className="font-semibold">7 mins (Placeholder)</span>
                </div>
                <div className="flex justify-between">
                    <span>Peak Usage Hours:</span>
                    <span className="font-semibold">8:00 AM - 9:00 AM (Placeholder)</span>
                </div>
            </div>
            <div className="mt-4">
                <PlaceholderChart title="Bus Occupancy by Route" />
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
} 