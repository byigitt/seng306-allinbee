import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, ListChecks } from "lucide-react";
import Link from "next/link";

// Mock data - replace with API call
const mockWallet = {
  balance: "125.50 TL",
  userName: "Ada Lovelace",
};

export default function DigitalWalletPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Digital Wallet</h1>
        <p className="text-muted-foreground">Manage your cafeteria funds and view transactions.</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>{mockWallet.userName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-4xl font-bold text-primary">{mockWallet.balance}</p>
          <div className="flex gap-4">
            <Button asChild className="flex-1">
              <Link href="/cafeteria/add-funds">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Funds
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/cafeteria/transactions">
                <ListChecks className="mr-2 h-4 w-4" /> View Transactions
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button variant="link" asChild className="mt-4">
        <Link href="/cafeteria">Back to Menu</Link>
      </Button>
    </div>
  );
} 