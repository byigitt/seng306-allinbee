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
	const [emailDomainError, setEmailDomainError] = useState<string | null>(null);

	const registerMutation = api.user.register.useMutation();

	const isCankayaDomain = (email: string): boolean => {
		return email.endsWith("@cankaya.edu.tr") || email.endsWith("@student.cankaya.edu.tr");
	};

	const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		setEmailDomainError(null);

		if (!isCankayaDomain(email)) {
			setEmailDomainError("Registration is only allowed with @cankaya.edu.tr or @student.cankaya.edu.tr emails.");
			setIsLoading(false);
			return;
		}

		try {
			await registerMutation.mutateAsync({
				fName: firstName,
				lName: lastName,
				email,
				// phone, // Your user.register mutation does not take phone yet
				password,
			});

			const signInResult = await signIn("credentials", {
				redirect: false,
				email,
				password,
			});

			setIsLoading(false);

			if (signInResult?.error) {
				setError(signInResult.error === "CredentialsSignin" ? "Failed to auto-login after registration. Please try logging in." : `Registration successful, but login failed: ${signInResult.error}`);
			} else if (signInResult?.ok) {
				router.push("/"); 
			}
		} catch (mutationError: unknown) {
			setIsLoading(false);
			let message = "An error occurred during registration.";
			if (mutationError instanceof Error) {
				message = mutationError.message;
			} else if (typeof mutationError === 'object' && mutationError !== null && 'message'in mutationError && typeof (mutationError as {message: unknown}).message === 'string') {
        message = (mutationError as {message: string}).message;
      }
      
      if (message.toLowerCase().includes("user with this email already exists")) {
        setError("An account with this email already exists. Please try logging in.");
      } else {
        setError(message);
      }
		}
	};

	const handleGoogleSignUp = () => {
		setIsLoading(true);
		// Errors from Google sign-in will typically redirect to an error page or handle via callbackUrl with error params
		signIn("google", { callbackUrl: "/" }).catch(() => setIsLoading(false)); 
	};

	return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
  		<Card className="w-full max-w-md">
  			<CardHeader className="space-y-1 text-center">
  				<CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
  				<CardDescription>
  					Already have an account?{" "}
  					<Link href="/auth/login" className="font-medium text-primary hover:underline">
  						Sign in
  					</Link>
  				</CardDescription>
  			</CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
              <p>{error}</p>
            </div>
          )}
          {emailDomainError && (
            <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
              <p>{emailDomainError}</p>
            </div>
          )}
    			<form onSubmit={handleRegister} className="space-y-4">
    				<div className="grid grid-cols-2 gap-4">
    					<div className="space-y-2">
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
    					<div className="space-y-2">
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
    				<div className="space-y-2">
    					<Label htmlFor="email">Email</Label>
    					<Input 
    						id="email" 
    						type="email" 
    						placeholder="cXXXXXXX@student.cankaya.edu.tr" 
    						required 
    						value={email}
    							onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value && !isCankayaDomain(e.target.value)) {
                      setEmailDomainError("Registration is only allowed with @cankaya.edu.tr or @student.cankaya.edu.tr emails.");
                    } else {
                      setEmailDomainError(null);
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value && !isCankayaDomain(e.target.value)) {
                      setEmailDomainError("Registration is only allowed with @cankaya.edu.tr or @student.cankaya.edu.tr emails.");
                    } else {
                      setEmailDomainError(null);
                    }
                  }}
    						disabled={isLoading}
    					/>
    				</div>
    				<div className="space-y-2">
    					<Label htmlFor="phone">Phone Number (Optional)</Label>
    					<Input 
    						id="phone" 
    						type="tel" 
    						placeholder="+1 234 567 8900" 
    						value={phone}
    							onChange={(e) => setPhone(e.target.value)}
    							disabled={isLoading}
    					/>
    				</div>
    				<div className="space-y-2">
    					<Label htmlFor="password">Password</Label>
    					<Input 
    						id="password" 
    						type="password" 
    						required 
    						minLength={8} // Added minLength for better UX based on typical password reqs
    						value={password}
    							onChange={(e) => setPassword(e.target.value)}
    							disabled={isLoading}
    					/>
    				</div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || registerMutation.isPending || (email !== "" && !isCankayaDomain(email)) || !!emailDomainError}
              >
                {isLoading || registerMutation.isPending ? "Creating account..." : "Create account"}
              </Button>
    			</form>
          {/* <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          {!isCankayaDomain(email) && (
  				<Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignUp} disabled={isLoading}>
  					{isLoading ? "Redirecting..." : "Sign up with Google"}
  				</Button>
          )} */}
        </CardContent>
        <CardFooter className="text-center text-sm">
            <p className="text-muted-foreground">
                By creating an account, you agree to our <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>.
            </p>
        </CardFooter>
  		</Card>
    </div>
	);
}
