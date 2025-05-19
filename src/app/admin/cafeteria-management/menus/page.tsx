"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2 } from "lucide-react";
import React from "react";

// Define an interface for the menu items
interface MenuType {
  id: string;
  date: string; // Ensure date is a non-optional string
  dishes: string[];
}

// Mock data
const mockDishesData = [
  { id: "d1", name: "Chicken Curry" }, { id: "d2", name: "Lentil Soup" }, { id: "d3", name: "Rice Pilaf" }, { id: "d4", name: "Salad" },
];
const mockMenus: MenuType[] = [
  { id: "m1", date: new Date().toISOString().split('T')[0] ?? "", dishes: ["d1", "d2", "d3"] },
];

export default function ManageMenusPage() {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  // TODO: Implement CRUD for menus
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-semibold">Manage Menus</h1>
            <p className="text-muted-foreground">Create, publish, and update daily or weekly menus.</p>
        </div>
        {/* Button to trigger a modal/form for creating a new menu */}
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Create New Menu</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Select Date / Create Menu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border p-0"
            />
            <h3 className="text-lg font-medium pt-4">Select Dishes for {selectedDate?.toLocaleDateString() || 'selected date'}:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {mockDishesData.map(dish => (
                    <div key={dish.id} className="flex items-center space-x-2">
                        <Checkbox id={`dish-${dish.id}`} />
                        <Label htmlFor={`dish-${dish.id}`} className="font-normal">{dish.name}</Label>
                    </div>
                ))}
            </div>
            <Button className="w-full">Save Menu for {selectedDate?.toLocaleDateString() || 'Date'}</Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Existing Menus</CardTitle>
            <CardDescription>Overview of currently defined menus.</CardDescription>
          </CardHeader>
          <CardContent>
            {mockMenus.length > 0 ? (
              <ul className="space-y-3">
                {mockMenus.map((menu) => (
                  <li key={menu.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">Menu for: {new Date(menu.date).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                      <p className="text-sm text-muted-foreground">Dishes: {menu.dishes.map(dId => mockDishesData.find(d=>d.id === dId)?.name || 'N/A').join(', ')}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No menus created yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 