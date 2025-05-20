"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit3, LogOut } from "lucide-react"; // Removed UserCircle as it's not used
import type React from "react";
import { useState, useEffect } from "react";
import { api, type RouterOutputs } from "@/trpc/react";
import { signOut } from "next-auth/react";
import { useRouter } from 'next/navigation'; // Added for redirection
import type { TRPCClientErrorLike } from "@trpc/client"; // Import TRPCClientErrorLike
import type { AppRouter } from "@/server/api/root"; // Import AppRouter for error typing
import { toast } from "sonner"; // Import toast

export default function ProfilePage() {
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		mInit: "",
		phoneNumber: "",
	});
	const router = useRouter(); // Initialize router

	const userQuery = api.user.me.useQuery(
		undefined,
		{
			retry: (failureCount: number, error: TRPCClientErrorLike<AppRouter>) => {
				if (error.data?.code === 'UNAUTHORIZED') {
					return false;
				}
				return failureCount < 2;
			},
			refetchOnWindowFocus: false,
		}
	);

	useEffect(() => {
		if (userQuery.isSuccess && userQuery.data) {
			const data = userQuery.data;
			setFormData({
				firstName: data.fName ?? "",
				lastName: data.lName ?? "",
				mInit: data.mInit ?? "",
				phoneNumber: data.phoneNumber ?? "",
			});
		}
	}, [userQuery.isSuccess, userQuery.data]);

	useEffect(() => {
		if (userQuery.isError && userQuery.error) {
			const error = userQuery.error;
			if (error.data?.code === 'UNAUTHORIZED') {
				toast.error("Unauthorized", { description: "You need to be logged in to view your profile. Redirecting..." });
				router.push('/auth/login');
			} else {
				toast.error("Profile Error", { description: error.message || "Could not fetch your profile data." });
				console.error("Error fetching profile:", error.message);
			}
		}
	}, [userQuery.isError, userQuery.error, router]);

	const updateUserMutation = api.user.updateMe.useMutation({
		onSuccess: async () => {
			await userQuery.refetch();
			toast.success("Profile Updated", { description: "Your profile information has been saved." });
			setIsEditing(false);
		},
		onError: (error) => {
			toast.error("Update Failed", { description: error.message || "Could not update your profile. Please try again." });
		},
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		if (id === "mInit" && value.length > 1) return;
		setFormData((prev) => ({ ...prev, [id]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!userQuery.data) return;

		updateUserMutation.mutate({
			fName: formData.firstName,
			lName: formData.lastName,
			mInit: formData.mInit === "" ? undefined : formData.mInit,
			phoneNumber: formData.phoneNumber,
			name: `${formData.firstName} ${formData.lastName}`,
		});
	};

	const handleLogout = () => {
		signOut(); // No more mock alert
	};

	const handleEditToggle = () => {
		if (!isEditing && userQuery.data) {
			setFormData({
				firstName: userQuery.data.fName ?? "",
				lastName: userQuery.data.lName ?? "",
				mInit: userQuery.data.mInit ?? "",
				phoneNumber: userQuery.data.phoneNumber ?? "",
			});
		}
		setIsEditing(!isEditing);
	};
	
	const handleCancelEdit = () => {
		setIsEditing(false);
		if (userQuery.data) {
			setFormData({
				firstName: userQuery.data.fName ?? "",
				lastName: userQuery.data.lName ?? "",
				mInit: userQuery.data.mInit ?? "",
				phoneNumber: userQuery.data.phoneNumber ?? "",
			});
		}
	};


	if (userQuery.isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<p>Loading profile...</p>
			</div>
		);
	}

	if (userQuery.error && userQuery.error.data?.code !== 'UNAUTHORIZED') {
		return (
			<div className="flex h-full flex-col items-center justify-center">
				<p className="text-red-500">Error loading profile: {userQuery.error.message}</p>
				<Button onClick={() => userQuery.refetch()} className="mt-4">Try Again</Button>
			</div>
		);
	}

	if (!userQuery.data && !userQuery.isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<p>No profile data found.</p>
				{/* Consider a button to go to login if session might have expired silently */}
				{/* <Button onClick={() => router.push('/auth/login')} className="mt-4">Login</Button> */}
			</div>
		);
	}

	if (!userQuery.data) {
		return null;
	}

	const { name, email, phoneNumber, role, fName, lName, image, mInit: userMInit } = userQuery.data;
	const displayName = `${fName ?? ""}${userMInit ? ` ${userMInit}.` : ""} ${lName ?? ""}`.trim();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl">My Profile</h1>
					<p className="text-muted-foreground">
						View and update your personal information.
					</p>
				</div>
				<Button onClick={handleLogout} variant="outline" disabled={updateUserMutation.isPending}>
					<LogOut className="mr-2 h-4 w-4" /> Logout
				</Button>
			</div>

			<Card className="mx-auto w-full max-w-2xl mb-[80px]">
				<CardHeader className="relative flex flex-col items-center space-y-2 text-center sm:flex-row sm:space-y-0 sm:text-left">
					<Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-background">
						<AvatarImage
							src={image ?? "/placeholders/avatar-mock.png"} // Use user.image or fallback
							alt={name ?? displayName}
						/>
						<AvatarFallback>
							{(fName?.charAt(0) ?? "") + (lName?.charAt(0) ?? "")}
						</AvatarFallback>
					</Avatar>
					<div className="sm:ml-6">
						<CardTitle className="text-2xl">
							{name ?? displayName}
						</CardTitle>
						<CardDescription>{role}</CardDescription>
						<p className="mt-1 text-muted-foreground text-sm">
							{email}
						</p>
					</div>
					<Button
						variant="outline"
						size="icon"
						className="absolute top-4 right-4 ml-auto sm:static"
						onClick={handleEditToggle}
						disabled={updateUserMutation.isPending}
					>
						<Edit3 className="h-5 w-5" />
						<span className="sr-only">
							{isEditing ? "Cancel Edit" : "Edit Profile"}
						</span>
					</Button>
				</CardHeader>
				<CardContent>
					{isEditing ? (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="grid gap-2">
									<Label htmlFor="firstName">First Name</Label>
									<Input
										id="firstName"
										value={formData.firstName}
										onChange={handleInputChange}
										disabled={updateUserMutation.isPending}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="lastName">Last Name</Label>
									<Input
										id="lastName"
										value={formData.lastName}
										onChange={handleInputChange}
										disabled={updateUserMutation.isPending}
									/>
								</div>
							</div>
							<div className="grid gap-2 sm:grid-cols-2">
								<div className="grid gap-2">
									<Label htmlFor="mInit">Middle Initial</Label>
									<Input
										id="mInit"
										value={formData.mInit}
										onChange={handleInputChange}
										maxLength={1}
										disabled={updateUserMutation.isPending}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="phoneNumber">Phone Number</Label>
									<Input
										id="phoneNumber"
										type="tel"
										value={formData.phoneNumber}
										onChange={handleInputChange}
										disabled={updateUserMutation.isPending}
									/>
								</div>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="email-display">Email (Read-only)</Label>
								<Input
									id="email-display"
									type="email"
									value={email ?? ""}
									readOnly
									disabled
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="role-display">Role (Read-only)</Label>
								<Input
									id="role-display"
									value={role ?? ""}
									readOnly
									disabled
								/>
							</div>
							<div className="flex justify-end gap-2 pt-2">
								<Button
									type="button"
									variant="outline"
									onClick={handleCancelEdit}
									disabled={updateUserMutation.isPending}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={updateUserMutation.isPending || userQuery.isFetching}>
									{updateUserMutation.isPending ? "Saving..." : "Save Changes"}
								</Button>
							</div>
						</form>
					) : (
						<div className="space-y-3">
							<div className="flex items-center justify-between border-b py-2">
								<span className="font-medium text-muted-foreground text-sm">
									Full Name:
								</span>
								<span className="text-sm">
									{name ?? displayName}
								</span>
							</div>
							<div className="flex items-center justify-between border-b py-2">
								<span className="font-medium text-muted-foreground text-sm">
									Email Address:
								</span>
								<span className="text-sm">{email}</span>
							</div>
							<div className="flex items-center justify-between border-b py-2">
								<span className="font-medium text-muted-foreground text-sm">
									Phone Number:
								</span>
								<span className="text-sm">{phoneNumber ?? "N/A"}</span>
							</div>
							<div className="flex items-center justify-between py-2">
								<span className="font-medium text-muted-foreground text-sm">
									Role:
								</span>
								<span className="text-sm">{role ?? "N/A"}</span>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
