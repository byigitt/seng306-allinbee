import BottomNavigation from "@/app/_components/common/bottom-navigation"; // Placeholder for BottomNav
import PageHeader from "@/app/_components/common/page-header"; // Placeholder for PageHeader
import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "AllInBee - Appointment System",
	description: "AllInBee - Appointment System",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col">
			<PageHeader title="AllInBee" />
			<main className="flex-grow bg-muted/40 p-4 md:p-6">{children}</main>
			<BottomNavigation />
		</div>
	);
}
