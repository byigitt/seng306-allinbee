"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { api } from "@/trpc/react";
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const addFundsSchema = z.object({
	selectedAmount: z.string().optional(), // Can be one of the predefined values
	customAmount: z.string() 
		.optional() 
		.transform((value) => { 
			if (value === undefined || value.trim() === "") {
				return undefined; 
			}
			const num = Number(value.trim()); 
			return isNaN(num) ? undefined : num;
		}) 
		.pipe(
			z.number()
				.min(0.01, "Custom amount must be at least $0.01.")
				.optional()
		), 
}).refine(
    (data) => data.selectedAmount || data.customAmount,
    {
        message: "Please select an amount or enter a custom amount.",
        path: ["customAmount"], 
    }
).refine(
    (data) => !(data.selectedAmount && data.customAmount),
    {
        message: "Please either select an amount or enter a custom amount, not both.",
        path: ["customAmount"], 
    }
);

type AddFundsFormValues = z.infer<typeof addFundsSchema>; // This is z.output<typeof addFundsSchema>

export default function AddFundsPage() {
	const utils = api.useUtils();
	const {
		data: digitalCard,
		isLoading: isLoadingBalance,
		error: balanceError,
		isError: isBalanceError,
	} = api.cafeteria.getMyDigitalCard.useQuery();

	useEffect(() => {
		if (isBalanceError && balanceError) {
			toast.error("Balance Error", {
				description: balanceError.message || "Could not load your current balance.",
			});
		}
	}, [isBalanceError, balanceError]);

	const {
		handleSubmit,
		control,
		watch,
        formState: { errors, isSubmitting },
        reset,
	} = useForm({ // Infer TFieldValues from resolver: z.input<typeof addFundsSchema>
		resolver: zodResolver(addFundsSchema),
		defaultValues: {
			selectedAmount: "20",
			customAmount: undefined, // This should align with z.input's customAmount (string | undefined)
		},
	});

	const recordDepositMutation = api.cafeteria.recordDeposit.useMutation({
		onSuccess: (data) => {
			toast.success(data.message || "Funds added successfully!");
			utils.cafeteria.getMyDigitalCard.invalidate();
            reset(); 
		},
		onError: (error) => {
			toast.error(error.message || "Failed to add funds.");
		},
	});

	const onSubmit = (data: AddFundsFormValues) => { // data is z.output<typeof addFundsSchema>
		const amount = data.customAmount || parseFloat(data.selectedAmount || "0");
		if (amount > 0) {
			recordDepositMutation.mutate({ amount });
		} else {
            toast.error("Please enter or select a valid positive amount.");
        }
	};

    const watchedCustomAmount = watch("customAmount");
    const watchedSelectedAmount = watch("selectedAmount");

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl">Add Funds to Wallet</h1>
				<p className="text-muted-foreground">
					Select an amount and proceed to simulated payment.
				</p>
			</div>

			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Choose Amount</CardTitle>
					{isLoadingBalance && (
						<Skeleton className="h-4 w-36" />
					)}
					{digitalCard && (
					<CardDescription>
							Your current balance: {parseFloat(digitalCard.balance as unknown as string).toFixed(2)} TL
						</CardDescription>
					)}
					{balanceError && (
						<CardDescription className="text-destructive">
							Could not load balance: {balanceError.message}
					</CardDescription>
					)}
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="grid gap-2">
						<Label htmlFor="amount">Amount (TL)</Label>
							<Controller
								name="selectedAmount"
								control={control}
								render={({ field }) => (
									<Select 
                                        onValueChange={field.onChange} 
                                        defaultValue={field.value}
                                        disabled={!!watchedCustomAmount || isSubmitting}
                                    >
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
								)}
							/>
                            {errors.selectedAmount && <p className="text-xs text-destructive">{errors.selectedAmount.message}</p>}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="custom-amount">Or Enter Custom Amount (TL)</Label>
							<Controller
								name="customAmount"
								control={control}
								render={({ field }) => (
									<Input 
                                        {...field} 
                                        id="custom-amount" 
                                        type="number" 
                                        placeholder="e.g., 75" 
                                        disabled={!!watchedSelectedAmount && !field.value && !errors.customAmount || isSubmitting}
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                                    />
								)}
							/>
                            {errors.customAmount && <p className="text-xs text-destructive">{errors.customAmount.message}</p>}
					</div>
					<Button
							type="submit"
						className="w-full"
							disabled={recordDepositMutation.isPending || isLoadingBalance || isSubmitting}
					>
							{recordDepositMutation.isPending || isSubmitting ? "Processing..." : "Proceed to Payment"}
					</Button>
					</form>
				</CardContent>
			</Card>

			<Button variant="link" asChild className="mt-4">
				<Link href="/cafeteria/digital-wallet">Back to Wallet</Link>
			</Button>
		</div>
	);
}
