import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Mock Data
const mockRoutes = [
  { id: "R1", name: "Main Campus Ring" },
  { id: "R2", name: "East Dorms - Library" },
  { id: "R3", name: "West Gate - Sports Complex" },
];

const mockStations = [
  { id: "S1", name: "Rectorate Building", routeId: "R1" },
  { id: "S2", name: "Library", routeId: "R1" },
  { id: "S3", name: "Engineering Faculty", routeId: "R1" },
  { id: "S4", name: "East Dormitory A", routeId: "R2" },
  { id: "S5", name: "Sports Hall", routeId: "R3" },
];

const mockEtas = [
  { busId: "Bus-101", stationName: "Library", routeName: "Main Campus Ring", eta: "5 min" },
  { busId: "Bus-102", stationName: "Engineering Faculty", routeName: "Main Campus Ring", eta: "12 min" },
  { busId: "Bus-201", stationName: "East Dormitory A", routeName: "East Dorms - Library", eta: "8 min" },
];

export default function EtasPage() {
  // TODO: Implement logic to filter stations based on selected route and fetch ETAs
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bus ETAs</h1>
        <p className="text-muted-foreground">Check estimated arrival times for buses at selected stations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Route and Station</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
                <label htmlFor="route-select" className="text-sm font-medium">Route</label>
                <Select>
                    <SelectTrigger id="route-select">
                        <SelectValue placeholder="Select a bus route" />
                    </SelectTrigger>
                    <SelectContent>
                        {mockRoutes.map(route => (
                            <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label htmlFor="station-select" className="text-sm font-medium">Station</label>
                <Select>
                    <SelectTrigger id="station-select">
                        <SelectValue placeholder="Select a station" />
                    </SelectTrigger>
                    <SelectContent>
                        {/* This should be dynamically populated based on selected route */}
                        {mockStations.map(station => (
                            <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
          <Button className="w-full md:w-auto">Show ETAs</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estimated Arrival Times</CardTitle>
          <CardDescription>ETAs for selected station (mock data).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bus ID</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Destination Station</TableHead>
                <TableHead className="text-right">ETA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEtas.map((eta, index) => (
                <TableRow key={index}>
                  <TableCell>{eta.busId}</TableCell>
                  <TableCell>{eta.routeName}</TableCell>
                  <TableCell>{eta.stationName}</TableCell>
                  <TableCell className="text-right font-medium">{eta.eta}</TableCell>
                </TableRow>
              ))}
              {mockEtas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Select a route and station to see ETAs.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button variant="link" asChild className="mt-4">
        <Link href="/ring-tracking">Back to Live Map</Link>
      </Button>
    </div>
  );
} 