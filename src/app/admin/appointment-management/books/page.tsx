import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, PlusCircle, Settings2, Trash2 } from "lucide-react";

// Mock data
const mockBookableServices = [
	{
		id: "serv1",
		name: "Sports Facility Access",
		description: "General access to gym, courts etc.",
		requiresApproval: false,
		maxSlotsPerUser: 2,
		leadTimeDays: 1,
	},
	{
		id: "serv2",
		name: "Doctor Consultation (GP)",
		description: "Standard consultation with a General Practitioner.",
		requiresApproval: true,
		maxSlotsPerUser: 1,
		leadTimeDays: 3,
	},
	{
		id: "serv3",
		name: "Library Study Room Booking",
		description: "Book a private study room.",
		requiresApproval: false,
		maxSlotsPerUser: 1,
		leadTimeDays: 0,
	},
];

export default function ManageBookableServicesPage() {
	// TODO: Implement CRUD for bookable services
	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-semibold text-xl md:text-2xl">
						Manage Bookable Services
					</h1>
					<p className="text-muted-foreground">
						Define and configure services available for appointments.
					</p>
				</div>
				<Button className="w-full sm:w-auto">
					<PlusCircle className="mr-2 h-4 w-4" /> Add New Service
				</Button>
			</div>

			{/* Placeholder for Add/Edit Service Form/Modal */}

			<Card className="mb-[80px]">
				<CardHeader>
					<CardTitle>Configured Services</CardTitle>
				</CardHeader>
				<CardContent>
					{mockBookableServices.length > 0 ? (
						<ul className="space-y-3">
							{mockBookableServices.map((service) => (
								<li key={service.id} className="rounded-lg border p-4">
									<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between">
										<div className="flex-grow">
											<p className="font-medium text-lg">{service.name}</p>
											<p className="break-words text-muted-foreground text-sm">
												{service.description}
											</p>
										</div>
										<div className="mt-2 flex w-full shrink-0 gap-2 sm:mt-0 sm:w-auto">
											<Button
												variant="outline"
												size="sm"
												className="flex-1 sm:flex-initial"
											>
												<Edit className="mr-1 h-3 w-3" /> Edit
											</Button>
											<Button
												variant="destructive"
												size="sm"
												className="flex-1 sm:flex-initial"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
									<div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 border-t pt-3 text-sm sm:grid-cols-2 md:grid-cols-4">
										<div>
											<Label className="text-muted-foreground text-xs">
												Requires Approval
											</Label>
											<p>{service.requiresApproval ? "Yes" : "No"}</p>
										</div>
										<div>
											<Label className="text-muted-foreground text-xs">
												Max Bookings/User
											</Label>
											<p>{service.maxSlotsPerUser}</p>
										</div>
										<div>
											<Label className="text-muted-foreground text-xs">
												Min. Lead Time
											</Label>
											<p>{service.leadTimeDays} day(s)</p>
										</div>
										{/* Add more configuration display here, e.g., available slots, duration */}
									</div>
								</li>
							))}
						</ul>
					) : (
						<p className="text-muted-foreground">
							No bookable services configured yet.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
