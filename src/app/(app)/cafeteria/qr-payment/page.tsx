"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { QrCode as QrCodeIcon, AlertTriangle } from "lucide-react";
import Link from "next/link";
import React from "react";
import { QRCodeCanvas } from 'qrcode.react';
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function QrPaymentPage() {
	const [qrData, setQrData] = React.useState<string | null>(null);
	const [qrId, setQrId] = React.useState<string | null>(null);

	const generateQrCodeMutation = api.cafeteria.generatePaymentQRCode.useMutation({
		onSuccess: (data) => {
			setQrData(`allinbee-cafeteria-payment://qrId=${data.qrId}`);
			setQrId(data.qrId);
			toast.success("QR Code generated successfully!");
		},
		onError: (error) => {
			setQrData(null);
			setQrId(null);
			toast.error(error.message || "Failed to generate QR code.");
		},
	});

	const handleGenerateQrCode = async () => {
		generateQrCodeMutation.mutate({});
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
						{qrData
							? "Present this QR code to the cafeteria staff for payment."
							: "Click the button below to generate a new QR code."}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 text-center">
					{generateQrCodeMutation.isPending && (
						<div className="flex flex-col items-center justify-center space-y-2 py-8">
							<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
							<p>Generating QR Code...</p>
						</div>
					)}
					
					{/* Mockup QR display on error */} 
					{!generateQrCodeMutation.isPending && generateQrCodeMutation.error && (
						<div className="flex flex-col items-center justify-center p-4 border rounded-lg space-y-2">
							<AlertTriangle className="h-8 w-8 text-destructive" />
							<p className="text-sm text-destructive px-4">
								Failed to generate a real QR code: {generateQrCodeMutation.error.message}
							</p>
							<p className="text-sm text-muted-foreground">Displaying a mockup QR code for demonstration:</p>
							<div className="bg-white p-2 rounded-md">
								<QRCodeCanvas value="allinbee-mockup-qr-code-data-12345" size={192} level={"H"} includeMargin={true} />
							</div>
							<p className="text-xs text-muted-foreground mt-1">This is a non-functional mockup QR code.</p>
						</div>
					)}

					{/* Real QR display on success */} 
					{!generateQrCodeMutation.isPending && !generateQrCodeMutation.error && qrData && (
						<div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border">
							<QRCodeCanvas value={qrData} size={224} level={"H"} includeMargin={true} />
							<p className="text-xs text-muted-foreground mt-2">ID: {qrId}</p>
						</div>
					)}

					{/* Placeholder when no QR generated yet and no error, and not loading */} 
					{!generateQrCodeMutation.isPending && !generateQrCodeMutation.error && !qrData && (
						<div className="flex justify-center p-8">
							<QrCodeIcon className="h-32 w-32 text-muted-foreground" />
						</div>
					)}
					<Button
						onClick={handleGenerateQrCode}
						disabled={generateQrCodeMutation.isPending}
						className="w-full"
					>
						{generateQrCodeMutation.isPending
							? "Generating..."
							: qrData
								? "Regenerate QR Code"
								: "Generate Payment QR Code"}
					</Button>
				</CardContent>
			</Card>
			{qrData && (
			<p className="text-center text-muted-foreground text-sm">
					Note: This QR code will expire. (Actual expiry: {generateQrCodeMutation.data?.expiredDate ? new Date(generateQrCodeMutation.data.expiredDate).toLocaleString() : 'N/A'})
			</p>
			)}

			<Button variant="link" asChild className="mt-4">
				<Link href="/cafeteria">Back to Menu</Link>
			</Button>
		</div>
	);
}
