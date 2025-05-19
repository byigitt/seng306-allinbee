"use client";

import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import React, { useState, useEffect } from 'react';

// Mock Data - In a real app, this would come from an API based on serviceId
const mockServiceDetails: { [key: string]: { name: string; description: string; requiresNotes?: boolean } } = {
  "sports-facility": { name: "Sports Facility Booking", description: "Select a date and time slot for your desired sports activity.", requiresNotes: true },
  "health-center": { name: "Health Center Appointment", description: "Choose an available time to see a healthcare professional.", requiresNotes: true },
  "library-books": { name: "Library Book Reservation", description: "Select books and a pickup time.", requiresNotes: false }, // Simplified for now
  "academic-advising": { name: "Academic Advising Session", description: "Book a slot with your advisor.", requiresNotes: true },
};

// Mock availability - replace with API call
const mockAvailableSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"
];

export default function BookAppointmentPage() {
  const params = useParams();
  const serviceId = params.serviceId as string;
  const [serviceInfo, setServiceInfo] = useState<{ name: string; description: string; requiresNotes?: boolean } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (serviceId && mockServiceDetails[serviceId]) {
      setServiceInfo(mockServiceDetails[serviceId]);
    }
    // TODO: Fetch actual service details and availability from API based on serviceId and selectedDate
  }, [serviceId]);

  const handleBooking = () => {
    if (!selectedDate || !selectedTimeSlot) {
      alert("Please select a date and time slot.");
      return;
    }
    // TODO: Call POST /api/appointments
    alert(`Booking confirmed for ${serviceInfo?.name} on ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot}. Notes: ${notes || 'N/A'} (Mock)`);
  };

  if (!serviceInfo) {
    return <p>Loading service details or service not found...</p>; // Or a proper loading spinner
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Book: {serviceInfo.name}</h1>
        <p className="text-muted-foreground">{serviceInfo.description}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              // disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Time Slot</CardTitle>
            <CardDescription>
              Available slots for {selectedDate ? selectedDate.toLocaleDateString('en-US', { dateStyle: 'long' }) : 'selected date'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {mockAvailableSlots.map((slot) => (
              <Button
                key={slot}
                variant={selectedTimeSlot === slot ? "default" : "outline"}
                onClick={() => setSelectedTimeSlot(slot)}
              >
                {slot}
              </Button>
            ))}
            {mockAvailableSlots.length === 0 && <p className="col-span-full text-center text-muted-foreground">No slots available for this date.</p>}
          </CardContent>
        </Card>
      </div>

      {serviceInfo.requiresNotes && (
          <Card>
            <CardHeader>
                <CardTitle>Additional Notes (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea 
                    placeholder="Any specific requests or information..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </CardContent>
          </Card>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end mb-[80px]">
        <Button variant="outline" asChild>
            <Link href="/appointments">Cancel</Link>
        </Button>
        <Button onClick={handleBooking} disabled={!selectedDate || !selectedTimeSlot}>
          Confirm Booking
        </Button>
      </div>
    </div>
  );
} 