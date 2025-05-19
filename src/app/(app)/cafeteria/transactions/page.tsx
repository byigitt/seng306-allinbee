import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Mock data - replace with API call
const mockTransactions = [
  { id: "txn_1", date: "2023-10-25", type: "Deposit", description: "Added funds via Credit Card", amount: "+50.00 TL", status: "Completed" },
  { id: "txn_2", date: "2023-10-24", type: "Purchase", description: "Cafeteria Lunch (Chicken, Rice)", amount: "-18.50 TL", status: "Completed" },
  { id: "txn_3", date: "2023-10-23", type: "Purchase", description: "Cafeteria Snack (Sandwich)", amount: "-7.00 TL", status: "Completed" },
  { id: "txn_4", date: "2023-10-22", type: "Deposit", description: "Added funds via Bank Transfer", amount: "+100.00 TL", status: "Pending" },
  { id: "txn_5", date: "2023-10-20", type: "Purchase", description: "Cafeteria Breakfast (Simit, Tea)", amount: "-5.00 TL", status: "Completed" },
];

export default function TransactionHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transaction History</h1>
        <p className="text-muted-foreground">View your past deposits and purchases.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>{new Date(txn.date).toLocaleDateString('en-CA')}</TableCell>
                  <TableCell>
                    <Badge variant={txn.type === "Deposit" ? "default" : "secondary"}>
                      {txn.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell className={`text-right font-medium ${txn.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{txn.amount}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={txn.status === "Completed" ? "default" : txn.status === "Pending" ? "secondary" : "destructive"}>
                        {txn.status}
                    </Badge>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Button variant="link" asChild className="mt-4">
        <Link href="/cafeteria/digital-wallet">Back to Wallet</Link>
      </Button>
    </div>
  );
} 