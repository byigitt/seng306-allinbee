import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Edit, Settings2 } from "lucide-react";

// Mock data
const mockBookableServices = [
  { id: "serv1", name: "Sports Facility Access", description: "General access to gym, courts etc.", requiresApproval: false, maxSlotsPerUser: 2, leadTimeDays: 1 },
  { id: "serv2", name: "Doctor Consultation (GP)", description: "Standard consultation with a General Practitioner.", requiresApproval: true, maxSlotsPerUser: 1, leadTimeDays: 3 },
  { id: "serv3", name: "Library Study Room Booking", description: "Book a private study room.", requiresApproval: false, maxSlotsPerUser: 1, leadTimeDays: 0 },
];

export default function ManageBookableServicesPage() {
  // TODO: Implement CRUD for bookable services
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manage Bookable Services</h1>
          <p className="text-muted-foreground">Define and configure services available for appointments.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
        </Button>
      </div>

      {/* Placeholder for Add/Edit Service Form/Modal */}

      <Card>
        <CardHeader>
          <CardTitle>Configured Services</CardTitle>
        </CardHeader>
        <CardContent>
          {mockBookableServices.length > 0 ? (
            <ul className="space-y-3">
              {mockBookableServices.map((service) => (
                <li key={service.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-lg">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button variant="outline" size="sm"><Edit className="mr-1 h-3 w-3"/> Edit</Button>
                        <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                        <Label className="text-xs text-muted-foreground">Requires Approval</Label>
                        <p>{service.requiresApproval ? 'Yes' : 'No'}</p>
                    </div>
                     <div>
                        <Label className="text-xs text-muted-foreground">Max Bookings/User</Label>
                        <p>{service.maxSlotsPerUser}</p>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Min. Lead Time</Label>
                        <p>{service.leadTimeDays} day(s)</p>
                    </div>
                    {/* Add more configuration display here, e.g., available slots, duration */}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No bookable services configured yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 