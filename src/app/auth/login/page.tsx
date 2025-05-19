'use client';

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
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleEmailLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		const result = await signIn("credentials", {
			redirect: false,
			email,
			password,
		});

		setIsLoading(false);

		if (result?.error) {
			setError(result.error === "CredentialsSignin" ? "Invalid email or password" : result.error);
		} else if (result?.ok) {
			router.push("/"); // Redirect to homepage or dashboard
		}
	};

	const handleGoogleLogin = async () => {
		setIsLoading(true);
		setError(null);
		await signIn("google", { callbackUrl: "/" });
    // No need to set isLoading false here as Google redirect will take over
	};

	return (
		<Card className="w-full max-w-sm">
			<form onSubmit={handleEmailLogin}>
				<CardHeader>
					<CardTitle className="text-2xl">Login</CardTitle>
					<CardDescription>
						Enter your email below to login to your account.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input 
							id="email" 
							type="email" 
							placeholder="m@example.com" 
							required 
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={isLoading}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password">Password</Label>
						<Input 
							id="password" 
							type="password" 
							required 
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={isLoading}
						/>
					</div>
					{error && <p className="text-sm text-red-500">{error}</p>}
				</CardContent>
				<CardFooter className="flex flex-col gap-4">
					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Signing in..." : "Sign in"}
					</Button>
					<Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
						{isLoading ? "Redirecting..." : "Sign in with Google"}
					</Button>
					<div className="mt-4 text-center text-sm">
						Don&apos;t have an account?{" "}
						<Link href="/auth/register" className="underline">
							Sign up
						</Link>
					</div>
					<div className="mt-2 w-full">
						<Button type="button" variant="ghost" className="w-full" onClick={() => router.push('/')}>
							Go to Homepage
						</Button>
					</div>
				</CardFooter>
			</form>
		</Card>
	);
}
