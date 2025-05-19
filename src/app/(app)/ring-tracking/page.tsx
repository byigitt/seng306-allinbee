import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Clock, MapPinned, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function RingTrackingPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-semibold text-2xl">Ring Bus Live Tracking</h1>
					<p className="text-muted-foreground">
						View real-time bus locations on campus.
					</p>
				</div>
				<div className="flex gap-2">
					<Button asChild variant="outline">
						<Link href="/ring-tracking/favorite-routes">
							<Star className="mr-2 h-4 w-4" /> Favorite Routes
						</Link>
					</Button>
					<Button asChild>
						<Link href="/ring-tracking/etas">
							<Clock className="mr-2 h-4 w-4" /> Check ETAs
						</Link>
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<MapPinned className="mr-2 h-5 w-5 text-primary" /> Campus Map -
						Live View
					</CardTitle>
					<CardDescription>
						Showing mock bus locations. Real integration needed.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
						{/* In a real app, this would be an interactive map component */}
						<Image
							src="/placeholders/campus-map-mock.png"
							alt="Campus Map Mockup"
							width={800}
							height={450}
							className="object-cover"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Placeholder for additional info, e.g. list of active buses or incidents */}
			<div className="mt-8 mb-[100px] flex justify-center">
				<Button variant="link" asChild>
					<Link href="/">Back to Home</Link>
				</Button>
			</div>
		</div>
	);
}
