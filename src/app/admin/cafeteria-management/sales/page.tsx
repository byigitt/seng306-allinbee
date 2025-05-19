import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePickerWithRange } from "@/app/_components/common/date-range-picker"; // Assuming this component exists or will be created
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

// Mock Data
const mockSalesData = [
  { id: "s1", date: "2023-10-26", dishName: "Chicken Curry", quantity: 50, totalAmount: "750.00 TL" },
  { id: "s2", date: "2023-10-26", dishName: "Lentil Soup", quantity: 80, totalAmount: "640.00 TL" },
  { id: "s3", date: "2023-10-25", dishName: "Beef Stew", quantity: 40, totalAmount: "800.00 TL" },
  { id: "s4", date: "2023-10-25", dishName: "Rice Pilaf", quantity: 100, totalAmount: "700.00 TL" },
];

const mockSummaryStats = {
    totalSales: "3250.00 TL",
    totalItemsSold: 270,
    topSellingItem: "Rice Pilaf (100 units)"
}

export default function SalesReportPage() {
  // TODO: Implement date range filtering and actual data fetching
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
            <h1 className="text-2xl font-semibold">Sales Reports</h1>
            <p className="text-muted-foreground">View sales data and filter by date range.</p>
        </div>
        <div className="flex items-center gap-2">
            <DatePickerWithRange className="w-full md:w-auto" />
            <Button variant="outline"><Download className="mr-2 h-4 w-4"/> Export CSV</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader><CardTitle>Total Sales</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{mockSummaryStats.totalSales}</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Items Sold</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{mockSummaryStats.totalItemsSold}</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Top Seller</CardTitle></CardHeader>
            <CardContent><p className="text-lg font-semibold">{mockSummaryStats.topSellingItem}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Sales Data</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell>{new Date(sale.date).toLocaleDateString('en-CA')}</TableCell>
                  <TableCell>{sale.dishName}</TableCell>
                  <TableCell className="text-right">{sale.quantity}</TableCell>
                  <TableCell className="text-right font-medium">{sale.totalAmount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 