import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2 } from "lucide-react";

// Mock data - replace with API call
const mockDishes = [
  { id: "d1", name: "Chicken Curry", price: "15.00", category: "Main Course" },
  { id: "d2", name: "Lentil Soup", price: "8.00", category: "Soup" },
];

export default function ManageDishesPage() {
  // TODO: Implement CRUD operations for dishes
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manage Dishes</h1>
          <p className="text-muted-foreground">Add, edit, or remove cafeteria dishes.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Dish
        </Button>
      </div>

      {/* Placeholder for Add/Edit Dish Form/Modal */}
      {/* <Card>
        <CardHeader><CardTitle>Add/Edit Dish</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2"><Label htmlFor="dish-name">Dish Name</Label><Input id="dish-name" /></div>
          <div className="grid gap-2"><Label htmlFor="dish-price">Price (TL)</Label><Input id="dish-price" type="number" /></div>
          <div className="grid gap-2"><Label htmlFor="dish-category">Category</Label><Input id="dish-category" /></div>
          <Button>Save Dish</Button>
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle>Existing Dishes</CardTitle>
        </CardHeader>
        <CardContent>
          {mockDishes.length > 0 ? (
            <ul className="space-y-3">
              {mockDishes.map((dish) => (
                <li key={dish.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{dish.name} <span className="text-sm text-muted-foreground">({dish.category})</span></p>
                    <p className="text-sm text-primary">{dish.price} TL</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No dishes found. Add some!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 