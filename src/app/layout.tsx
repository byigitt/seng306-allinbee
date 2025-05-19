import "@/styles/globals.css";

import { ThemeProvider } from "@/app/_components/theme-provider"; // Assuming ThemeProvider is set up for Shadcn
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner"; // Import Toaster

import { TRPCReactProvider } from "@/trpc/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "AllInBee",
	description: "Çankaya University AllInBee Services",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning className={inter.className}>
			<body>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<TRPCReactProvider>
						{children}
						<Toaster richColors position="top-center" /> 
					</TRPCReactProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
