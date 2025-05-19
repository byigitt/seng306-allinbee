"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function AddFundsPage() {
  // In a real app, this would interact with a payment gateway.
  // For now, it's a placeholder UI.
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add Funds to Wallet</h1>
        <p className="text-muted-foreground">Select an amount and proceed to payment.</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose Amount</CardTitle>
          <CardDescription>Your current balance: 125.50 TL (mock)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (TL)</Label>
            <Select defaultValue="20">
              <SelectTrigger id="amount">
                <SelectValue placeholder="Select amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 TL</SelectItem>
                <SelectItem value="20">20 TL</SelectItem>
                <SelectItem value="50">50 TL</SelectItem>
                <SelectItem value="100">100 TL</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="grid gap-2">
            <Label htmlFor="custom-amount">Or Enter Custom Amount (TL)</Label>
            <Input id="custom-amount" type="number" placeholder="e.g., 75" />
          </div>
          <Button className="w-full" onClick={() => alert("Redirecting to payment gateway... (mock)")}>
            Proceed to Payment
          </Button>
        </CardContent>
      </Card>

      <Button variant="link" asChild className="mt-4">
        <Link href="/cafeteria/digital-wallet">Back to Wallet</Link>
      </Button>
    </div>
  );
} 