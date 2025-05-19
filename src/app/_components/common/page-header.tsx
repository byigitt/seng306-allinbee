import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Bus, Calendar, Menu, UserCircle, Utensils } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface PageHeaderProps {
	title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
	return (
		<header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
			<Sheet>
				<SheetTrigger asChild>
					<Button size="icon" variant="outline" className="sm:hidden">
						<Menu className="h-5 w-5" />
						<span className="sr-only">Toggle Menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="left" className="p-0 sm:max-w-xs">
					<SheetTitle className="sr-only">Main Menu</SheetTitle>
					<div className="flex items-center justify-between border-b px-4 py-4">
						<Link
							href="#"
							className="flex items-center gap-2 rounded-full bg-primary px-3 py-2 font-bold text-lg text-primary-foreground shadow"
						>
							AIB
							<span className="sr-only">AllInBee</span>
						</Link>
						<SheetClose asChild>
							<Button size="icon" variant="ghost" className="rounded-full">
								<Menu className="h-5 w-5" />
								<span className="sr-only">Close Menu</span>
							</Button>
						</SheetClose>
					</div>
					<nav className="flex flex-col gap-2 px-4 py-6">
						<Link
							href="/cafeteria"
							className="flex items-center gap-3 rounded-lg px-3 py-3 font-medium text-base text-foreground transition hover:bg-accent hover:text-accent-foreground"
						>
							<Utensils className="h-5 w-5 text-primary" />
							Cafeteria
						</Link>
						<Link
							href="/ring-tracking"
							className="flex items-center gap-3 rounded-lg px-3 py-3 font-medium text-base text-foreground transition hover:bg-accent hover:text-accent-foreground"
						>
							<Bus className="h-5 w-5 text-primary" />
							Ring Tracking
						</Link>
						<Link
							href="/appointments"
							className="flex items-center gap-3 rounded-lg px-3 py-3 font-medium text-base text-foreground transition hover:bg-accent hover:text-accent-foreground"
						>
							<Calendar className="h-5 w-5 text-primary" />
							Appointments
						</Link>
					</nav>
				</SheetContent>
			</Sheet>
			<div className="flex items-center gap-2 flex-1 shrink-0">
				<Image src="/logo.png" alt="Logo" width={32} height={32} className="h-8 w-8 object-contain" />
				<h1 className="whitespace-nowrap font-semibold text-xl tracking-tight sm:grow-0">{title}</h1>
			</div>
			<div className="ml-auto flex items-center gap-2">
				<Link href="/profile">
					<Button
						variant="outline"
						size="icon"
						className="overflow-hidden rounded-full"
					>
						<UserCircle className="h-6 w-6" />
						<span className="sr-only">User Profile</span>
					</Button>
				</Link>
			</div>
		</header>
	);
}
