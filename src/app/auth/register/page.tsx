import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function RegisterPage() {
	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Sign Up</CardTitle>
				<CardDescription>
					Enter your information to create an account.
				</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="grid gap-2">
						<Label htmlFor="first-name">First name</Label>
						<Input id="first-name" placeholder="Max" required />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="last-name">Last name</Label>
						<Input id="last-name" placeholder="Robinson" required />
					</div>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="email">Email</Label>
					<Input id="email" type="email" placeholder="m@example.com" required />
				</div>
				<div className="grid gap-2">
					<Label htmlFor="phone">Phone Number</Label>
					<Input id="phone" type="tel" placeholder="+1 234 567 8900" required />
				</div>
				<div className="grid gap-2">
					<Label htmlFor="password">Password</Label>
					<Input id="password" type="password" required />
				</div>
			</CardContent>
			<CardFooter className="flex flex-col">
				<Button type="submit" className="w-full">
					Create account
				</Button>
				<div className="mt-4 text-center text-sm">
					Already have an account?{" "}
					<Link href="/login" className="underline">
						Sign in
					</Link>
				</div>
			</CardFooter>
		</Card>
	);
}
