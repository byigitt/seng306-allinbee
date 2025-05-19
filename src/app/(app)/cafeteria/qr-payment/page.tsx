"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { QrCode } from "lucide-react";
import Image from "next/image"; // For displaying the QR code image
import Link from "next/link";
import React from "react";

export default function QrPaymentPage() {
	const [qrCodeUrl, setQrCodeUrl] = React.useState<string | null>(null);
	const [isLoading, setIsLoading] = React.useState(false);

	// Mock function to simulate QR code generation
	const generateQrCode = async () => {
		setIsLoading(true);
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1500));
		// In a real app, this URL would come from the backend API POST /api/qrcodes/generate
		setQrCodeUrl("/placeholders/qr-code-mock.png"); // Using a placeholder image
		setIsLoading(false);
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl">Cafeteria QR Payment</h1>
				<p className="text-muted-foreground">
					Generate a QR code to make payments at the cafeteria.
				</p>
			</div>

			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Payment QR Code</CardTitle>
					<CardDescription>
						{qrCodeUrl
							? "Present this QR code to the cafeteria staff for payment."
							: "Click the button below to generate a new QR code for your purchase."}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 text-center">
					{isLoading && (
						<div className="flex flex-col items-center justify-center space-y-2">
							<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
							<p>Generating QR Code...</p>
						</div>
					)}
					{!isLoading && qrCodeUrl && (
						<div className="flex justify-center">
							<Image
								src={qrCodeUrl}
								alt="Payment QR Code"
								width={256}
								height={256}
								className="rounded-lg border"
							/>
						</div>
					)}
					{!isLoading && !qrCodeUrl && (
						<div className="flex justify-center p-8">
							<QrCode className="h-32 w-32 text-muted-foreground" />
						</div>
					)}
					<Button
						onClick={generateQrCode}
						disabled={isLoading}
						className="w-full"
					>
						{isLoading
							? "Generating..."
							: qrCodeUrl
								? "Regenerate QR Code"
								: "Generate Payment QR Code"}
					</Button>
				</CardContent>
			</Card>
			<p className="text-center text-muted-foreground text-sm">
				Note: This QR code will be valid for a limited time. (Functionality to
				be implemented)
			</p>

			<Button variant="link" asChild className="mt-4">
				<Link href="/cafeteria">Back to Menu</Link>
			</Button>
		</div>
	);
}
