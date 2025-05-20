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
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function LoginPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") || "/";
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const isCankayaDomain = (email: string): boolean => {
		return email.endsWith("@cankaya.edu.tr") || email.endsWith("@student.cankaya.edu.tr");
	};

	const handleGoogleSignIn = () => {
		setIsLoading(true);
		signIn("google", { callbackUrl }).catch(() => setIsLoading(false));
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			const result = await signIn("credentials", {
				redirect: false,
				email,
				password,
			});

			if (result?.error) {
				if (result.error === "CredentialsSignin") {
					setError("Invalid email or password. Please try again.");
				} else {
					setError(`Login failed: ${result.error}`);
				}
				setIsLoading(false);
			} else if (result?.ok) {
				router.push(callbackUrl);
			} else {
				setError("An unexpected issue occurred during login.");
				setIsLoading(false);
			}
		} catch (err) {
			console.error("Login submission error:", err);
			setError("An unexpected error occurred. Please check your connection and try again.");
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-2xl font-bold tracking-tight">Sign in to your account</CardTitle>
					<CardDescription>
						Or <Link href="/auth/register" className="font-medium text-primary hover:underline">create a new account</Link>
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
							<p>{error}</p>
						</div>
					)}
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email address</Label>
							<Input 
								id="email" 
								name="email" 
								type="email" 
								autoComplete="email" 
								required 
								value={email} 
								onChange={(e) => setEmail(e.target.value)} 
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input 
								id="password" 
								name="password" 
								type="password" 
								autoComplete="current-password" 
								required 
								value={password} 
								onChange={(e) => setPassword(e.target.value)} 
								disabled={isLoading}
							/>
						</div>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Signing in..." : "Sign in"}
						</Button>
					</form>
					<div className="relative my-4">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">Or continue with</span>
						</div>
					</div>
					{!isCankayaDomain(email) && (
					<Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
						{isLoading ? "Redirecting..." : "Sign in with Google"}
					</Button>
					)}
				</CardContent>
				<CardFooter className="text-center text-sm">
					<p className="text-muted-foreground">
						Having trouble? <Link href="/contact-support" className="font-medium text-primary hover:underline">Contact support</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={<LoginPageLoadingSkeleton />}>
			<LoginPageContent />
		</Suspense>
	);
}

function LoginPageLoadingSkeleton() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<Skeleton className="h-8 w-3/4 mx-auto" />
					<Skeleton className="h-4 w-1/2 mx-auto" />
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-6 w-full rounded-md bg-destructive/10 p-3" /> 
					<div className="space-y-4">
						<div className="space-y-2">
							<Skeleton className="h-4 w-1/4" />
							<Skeleton className="h-10 w-full" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-1/4" />
							<Skeleton className="h-10 w-full" />
						</div>
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="relative my-4">
						<div className="absolute inset-0 flex items-center">
							<Skeleton className="h-px w-full" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<Skeleton className="h-4 w-20 px-2" />
						</div>
					</div>
					<Skeleton className="h-10 w-full" />
				</CardContent>
				<CardFooter className="text-center text-sm">
					<Skeleton className="h-4 w-3/4 mx-auto" />
				</CardFooter>
			</Card>
		</div>
	);
}
