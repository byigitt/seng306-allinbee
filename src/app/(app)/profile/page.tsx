"use client";
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Edit3, LogOut } from "lucide-react"; // Assuming NextAuth handles logout

// Mock data - replace with API call (GET /api/users/me)
const mockUserProfile = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada.lovelace@example.com",
  phoneNumber: "+1 555 123 4567",
  role: "Student", // or "Staff"
  avatarUrl: "/placeholders/avatar-mock.png", // Placeholder avatar
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  // For a real app, use React Hook Form or similar for form state and validation
  const [formData, setFormData] = useState({
    firstName: mockUserProfile.firstName,
    lastName: mockUserProfile.lastName,
    phoneNumber: mockUserProfile.phoneNumber,
    // Email and role are typically not editable by the user directly
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call PUT /api/users/me with formData
    alert("Profile updated successfully! (Mock)");
    setIsEditing(false);
    // Update mockUserProfile or refetch for real data
    mockUserProfile.firstName = formData.firstName;
    mockUserProfile.lastName = formData.lastName;
    mockUserProfile.phoneNumber = formData.phoneNumber;
  };

  const handleLogout = () => {
    // TODO: Integrate with NextAuth signOut()
    alert("Logging out... (Mock)");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-semibold">My Profile</h1>
            <p className="text-muted-foreground">View and update your personal information.</p>
        </div>
        <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="flex flex-col items-center space-y-2 text-center sm:flex-row sm:space-y-0 sm:text-left">
            <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-background">
                <AvatarImage src={mockUserProfile.avatarUrl} alt={`${mockUserProfile.firstName} ${mockUserProfile.lastName}`} />
                <AvatarFallback>
                    {mockUserProfile.firstName.charAt(0)}{mockUserProfile.lastName.charAt(0)}
                </AvatarFallback>
            </Avatar>
            <div className="sm:ml-6">
                <CardTitle className="text-2xl">{mockUserProfile.firstName} {mockUserProfile.lastName}</CardTitle>
                <CardDescription>{mockUserProfile.role}</CardDescription>
                <p className="text-sm text-muted-foreground mt-1">{mockUserProfile.email}</p>
            </div>
            <Button variant="outline" size="icon" className="ml-auto absolute top-4 right-4 sm:static" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 className="h-5 w-5" />
                <span className="sr-only">{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </Button>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={formData.firstName} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={formData.lastName} onChange={handleInputChange} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email-display">Email (Read-only)</Label>
                <Input id="email-display" type="email" value={mockUserProfile.email} readOnly disabled />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="role-display">Role (Read-only)</Label>
                <Input id="role-display" value={mockUserProfile.role} readOnly disabled />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Full Name:</span>
                <span className="text-sm">{mockUserProfile.firstName} {mockUserProfile.lastName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Email Address:</span>
                <span className="text-sm">{mockUserProfile.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Phone Number:</span>
                <span className="text-sm">{mockUserProfile.phoneNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-muted-foreground">Role:</span>
                <span className="text-sm">{mockUserProfile.role}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 