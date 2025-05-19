"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ListChecks, PlusCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { toast } from "sonner";

export default function DigitalWalletPage() {
	const {
		data: digitalCard,
		isLoading,
		error,
		isError,
	} = api.cafeteria.getMyDigitalCard.useQuery();

	useEffect(() => {
		if (isError && error) {
			toast.error("Wallet Error", {
				description: error.message || "Could not load your wallet details.",
			});
		}
	}, [isError, error]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl">My Digital Wallet</h1>
				<p className="text-muted-foreground">
					Manage your cafeteria funds and view transactions.
				</p>
			</div>

			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Current Balance</CardTitle>
					{isLoading && <Skeleton className="h-4 w-32" />}
					{digitalCard && (
						<CardDescription>
							{digitalCard.student?.user?.name ??
								digitalCard.student?.user?.email ??
								"Your Wallet"}
						</CardDescription>
					)}
					{error && (
						<CardDescription className="text-destructive">
							Could not load wallet details.
						</CardDescription>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					{isLoading && (
						<Skeleton className="h-12 w-48" />
					)}
					{digitalCard && (
					<p className="font-bold text-4xl text-primary">
							{parseFloat(digitalCard.balance as unknown as string).toFixed(2)} TL
					</p>
					)}
					{error && (
						<div className="flex items-center text-destructive">
							<AlertTriangle className="mr-2 h-6 w-6" />
							<p>Error: {error.message}</p>
						</div>
					)}
					<div className="flex gap-4">
						<Button asChild className="flex-1" disabled={isLoading || !!error}>
							<Link href="/cafeteria/add-funds">
								<PlusCircle className="mr-2 h-4 w-4" /> Add Funds
							</Link>
						</Button>
						<Button
							variant="outline"
							asChild
							className="flex-1"
							disabled={isLoading || !!error}
						>
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
