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
import { api } from "@/trpc/react"; // Import tRPC API hook

export default function RegisterPage() {
	const router = useRouter();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const registerMutation = api.user.register.useMutation();

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			await registerMutation.mutateAsync({
				fName: firstName,
				lName: lastName,
				email,
				// phone, // Your user.register mutation does not take phone yet
				password,
			});

			// Automatically sign in after successful registration
			const signInResult = await signIn("credentials", {
				redirect: false,
				email,
				password,
			});

			setIsLoading(false);

			if (signInResult?.error) {
				setError(signInResult.error === "CredentialsSignin" ? "Failed to auto-login after registration." : signInResult.error);
			} else if (signInResult?.ok) {
				router.push("/"); // Redirect to homepage or dashboard
			}
		} catch (mutationError: any) {
			setIsLoading(false);
			setError(mutationError.message || "An error occurred during registration.");
		}
	};

	const handleGoogleLogin = async () => {
		setIsLoading(true);
		setError(null);
		await signIn("google", { callbackUrl: "/" });
	};

	return (
		<Card className="w-full max-w-sm">
			<form onSubmit={handleRegister}>
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
							<Input 
								id="first-name" 
								placeholder="Max" 
								required 
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								disabled={isLoading}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="last-name">Last name</Label>
							<Input 
								id="last-name" 
								placeholder="Robinson" 
								required 
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								disabled={isLoading}
							/>
						</div>
					</div>
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
					{/* Phone number field is present in UI but not used in current register mutation 
						 You might want to add it to the user.register tRPC input schema and data handling */}
					<div className="grid gap-2">
						<Label htmlFor="phone">Phone Number (Optional)</Label>
						<Input 
							id="phone" 
							type="tel" 
							placeholder="+1 234 567 8900" 
							// required // Making it optional for now as backend doesn't support it
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
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
					<Button type="submit" className="w-full" disabled={isLoading || registerMutation.isPending}>
						{isLoading || registerMutation.isPending ? "Creating account..." : "Create account"}
					</Button>
					<Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
						{isLoading ? "Redirecting..." : "Sign up with Google"}
					</Button>
					<div className="mt-4 text-center text-sm">
						Already have an account?{" "}
						<Link href="/auth/login" className="underline">
							Sign in
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
