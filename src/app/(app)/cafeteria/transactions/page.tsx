"use client";

import React, { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { api } from "@/trpc/react";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// We will derive transactions from the digitalCard.qrCodes array
// Each QRCode represents a payment attempt or a completed payment.

export default function TransactionHistoryPage() {
	const {
		data: digitalCard,
		isLoading,
		error,
		isError,
	} = api.cafeteria.getMyDigitalCard.useQuery();

	useEffect(() => {
		if (isError && error) {
			toast.error("Transaction History Error", {
				description: error.message || "Could not load your transaction history.",
			});
		}
	}, [isError, error]);

	// Transform QR codes into a more displayable transaction format
	const transactions = React.useMemo(() => {
		if (!digitalCard?.qrCodes) return [];
		return digitalCard.qrCodes
			.filter(qr => qr.paysForDate) // Only show QRs that resulted in a payment
			.map((qr) => ({
				id: qr.qrId,
				date: qr.paysForDate ? new Date(qr.paysForDate).toISOString() : new Date(qr.createDate).toISOString(),
				type: "Purchase",
				description: qr.menuId
					? `Menu Purchase (ID: ${qr.menuId.substring(0, 8)}...)` 
					: "General QR Payment",
				amount: "- Amount N/A", // Menu details (like price) are not in qr object from current API response
				status: "Completed", // Assuming paysForDate means completed
			}))
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}, [digitalCard]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl">Transaction History</h1>
				<p className="text-muted-foreground">
					View your past purchases made via QR code.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Recent Purchases</CardTitle>
                    {isLoading && <CardDescription>Loading history...</CardDescription>}
                    {error && <CardDescription className="text-destructive">Could not load history: {error.message}</CardDescription>}
                    {!isLoading && !error && transactions.length === 0 && (
                        <CardDescription>No purchase transactions found.</CardDescription>
                    )}
				</CardHeader>
				<CardContent>
					{isLoading && (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    )}
					{!isLoading && error && (
                        <div className="flex items-center text-destructive py-4">
                            <AlertTriangle className="mr-2 h-6 w-6" />
                            <p>Error loading transactions.</p>
                        </div>
                    )}
					{!isLoading && !error && transactions.length > 0 && (
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
								{transactions.map((txn) => (
									<TableRow key={txn.id}>
										<TableCell>
											{new Date(txn.date).toLocaleDateString("en-CA")}
										</TableCell>
										<TableCell>
											<Badge
												variant={txn.type === "Deposit" ? "default" : "secondary"}
											>
												{txn.type}
											</Badge>
										</TableCell>
										<TableCell>{txn.description}</TableCell>
										<TableCell
											className={`text-right font-medium ${txn.amount.startsWith("+") || txn.amount === "- Amount N/A" ? "text-muted-foreground" : "text-red-600"}`}
										>
											{txn.amount}
										</TableCell>
										<TableCell className="text-center">
											<Badge
												variant={
													txn.status === "Completed"
														? "default"
														: txn.status === "Pending"
															? "secondary"
															: "destructive"
												}
											>
												{txn.status}
											</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
			<Button variant="link" asChild className="mt-4">
				<Link href="/cafeteria/digital-wallet">Back to Wallet</Link>
			</Button>
		</div>
	);
}
