import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Edit, MapPin } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data
const mockBusStations = [
  { id: "S1", name: "Rectorate Building", routeIds: ["R1"], amenities: ["Shelter", "Bench"], status: "Operational" },
  { id: "S2", name: "Library", routeIds: ["R1", "R2"], amenities: ["Shelter", "Bench", "Info Screen"], status: "Operational" },
  { id: "S3", name: "Engineering Faculty", routeIds: ["R1"], amenities: ["Bench"], status: "Maintenance" },
  { id: "S4", name: "East Dormitory A", routeIds: ["R2"], amenities: ["Shelter"], status: "Operational" },
  { id: "S5", name: "Sports Hall", routeIds: ["R3"], amenities: ["Shelter", "Bench"], status: "Operational" },
];

const mockRoutesForSelect = [
    {id: "R1", name: "Main Campus Ring"},
    {id: "R2", name: "East Dorms - Library"},
    {id: "R3", name: "West Gate - Sports Complex"},
    {id: "R4", name: "City Center Express"},
];

export default function ManageBusStationsPage() {
  // TODO: Implement CRUD operations for bus stations
  // TODO: Modal/dialog for adding/editing stations, including map integration for lat/long

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manage Bus Stations</h1>
          <p className="text-muted-foreground">Add, edit, or remove ring bus stop locations.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Station
        </Button>
      </div>

      {/* Placeholder for Add/Edit Station Form/Modal */}

      <Card>
        <CardHeader>
          <CardTitle>Existing Bus Stations</CardTitle>
        </CardHeader>
        <CardContent>
          {mockBusStations.length > 0 ? (
            <ul className="space-y-4">
              {mockBusStations.map((station) => (
                <li key={station.id} className="rounded-lg border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-medium text-lg flex items-center">
                         <MapPin className={`mr-2 h-5 w-5 ${station.status === 'Operational' ? 'text-blue-500' : 'text-orange-500'}`} /> 
                        {station.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Serves Routes: {station.routeIds.join(", ") || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Amenities: {station.amenities.join(", ") || 'None'}
                      </p>
                       <p className="text-sm">
                        Status: <span className={station.status === 'Operational' ? 'text-green-600' : 'text-orange-600'}>{station.status}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2 sm:mt-0 shrink-0">
                      <Button variant="outline" size="sm"><Edit className="mr-1 h-3 w-3"/> Edit</Button>
                      <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No bus stations found. Add some to get started.</p>
          )}
        </CardContent>
      </Card>
      <Button variant="link" asChild className="mt-4 mb-[80px]">
        <Link href="/admin/ring-tracking-management">Back to Ring Tracking Overview</Link>
      </Button>
    </div>
  );
} 