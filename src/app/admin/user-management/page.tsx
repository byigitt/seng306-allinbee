"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Filter, MoreHorizontal, PlusCircle, Search, UserPlus, Edit, Trash2, Loader2, AlertTriangle, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";
import { format } from 'date-fns';

// Type definitions from tRPC
type RouterOutputs = inferRouterOutputs<AppRouter>;
type UserFromServer = RouterOutputs["user"]["adminListUsers"]["users"][number];

const UserRoleSchema = z.enum(["admin", "staff", "student", "user"]);
type UserRole = z.infer<typeof UserRoleSchema>;

const userRoleDisplay: Record<UserRole, string> = {
	admin: "Admin",
	staff: "Staff",
	student: "Student",
	user: "General User",
};

// Zod schema for adding a user
const addUserFormSchema = z.object({
	fName: z.string().min(1, "First name is required."),
	lName: z.string().min(1, "Last name is required."),
	email: z.string().email("Invalid email address."),
	password: z.string().min(8, "Password must be at least 8 characters."),
	phoneNumber: z.string().optional(),
	isStudent: z.boolean().default(false),
	isAdmin: z.boolean().default(false),
	isStaff: z.boolean().default(false),
});
type AddUserFormValues = z.infer<typeof addUserFormSchema>;

// Zod schema for editing a user
const editUserFormSchema = z.object({
	fName: z.string().min(1, "First name is required.").optional(),
	lName: z.string().min(1, "Last name is required.").optional(),
	email: z.string().email("Invalid email address.").optional(),
	phoneNumber: z.string().nullable().optional(),
	isStudent: z.boolean().optional(),
	studentManagingAdminId: z.string().optional(),
	isAdmin: z.boolean().optional(),
	isStaff: z.boolean().optional(),
	staffManagingAdminId: z.string().optional(),
});
type EditUserFormValues = z.infer<typeof editUserFormSchema>;

const ITEMS_PER_PAGE = 10;

export default function AdminUserManagementPage() {
	const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
	const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
	const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);

	const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserFromServer | null>(null);
	const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserFromServer | null>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
	const [currentPage, setCurrentPage] = useState(1);

	const utils = api.useUtils();

	const usersQuery = api.user.adminListUsers.useQuery(
		{
			filterByName: searchTerm || undefined, // Use filterByName for combined name/email search for now
			// filterByEmail: searchTerm || undefined, // Or separate if backend supports both distinctly
			take: ITEMS_PER_PAGE,
			skip: (currentPage - 1) * ITEMS_PER_PAGE,
		},
		{ placeholderData: (prev) => prev }
	);

	// Client-side filtering for role as adminListUsers doesn't have role filter yet
	const filteredUsers = useMemo(() => {
		if (!usersQuery.data) return [];
		if (roleFilter === "all") return usersQuery.data.users;
		return usersQuery.data.users.filter(user => user.role === roleFilter);
	}, [usersQuery.data, roleFilter]);

	const totalFilteredCount = useMemo(() => {
        if (!usersQuery.data) return 0;
        if (roleFilter === "all") return usersQuery.data.totalCount;
        // For client-side filtering, totalCount reflects the filtered list length, not total in DB for that filter
        return filteredUsers.length; 
    }, [usersQuery.data, roleFilter, filteredUsers.length]);

    const totalPages = useMemo(() => {
        if (!usersQuery.data) return 0;
        // If filtering client-side, pagination should be based on the length of the client-side filtered list
        // This is a simplification. True server-side filtering for roles would be better for pagination.
        const count = roleFilter === 'all' ? usersQuery.data.totalCount : filteredUsers.length;
        return Math.ceil(count / ITEMS_PER_PAGE);
    }, [usersQuery.data, roleFilter, filteredUsers.length]);

    const paginatedUsers = useMemo(() => {
        const usersSource = roleFilter === 'all' ? (usersQuery.data?.users ?? []) : filteredUsers;
        // If roleFilter is 'all', pagination is handled by query 'skip' and 'take'.
        // If roleFilter is active, we are client-side filtering the currently fetched page.
        // This is a known limitation if the server doesn't filter by role for pagination.
        // For simplicity, if role filter is active, we show the filtered results from the current API page.
        // Proper pagination with role filter requires backend support.
        return usersSource; // The `adminListUsers` query already handles pagination when roleFilter is 'all'.
                          // When a role filter is applied client-side, it filters the *current page* of users.
                          // This means pagination controls still operate on the basis of `usersQuery.data.totalCount` for 'all' roles.
    }, [usersQuery.data?.users, roleFilter, filteredUsers]);

	const addUserForm = useForm({
		resolver: zodResolver(addUserFormSchema),
		defaultValues: {
			fName: "",
			lName: "",
			email: "",
			password: "",
			phoneNumber: "",
			isStudent: false,
			isAdmin: false,
			isStaff: false,
		},
	});

	const editUserForm = useForm<EditUserFormValues>({
		resolver: zodResolver(editUserFormSchema),
	});

	useEffect(() => {
		if (selectedUserForEdit) {
			// Helper to determine if a value is a placeholder or not a CUID look-alike
			const getSafeManagingAdminId = (id: string | null | undefined): string | undefined => {
				if (id === "USR_ADMIN" || id === "STUDENT_ADMIN_PLACEHOLDER_IF_ANY") { // Add any other known placeholders
					return undefined; // Treat placeholders as 'not set'
				}
				// Basic check if it remotely looks like a CUID (starts with 'c', length typical of CUID)
				// This is not a foolproof CUID validation, but helps filter obvious non-CUIDs.
				// Zod will do the final CUID validation.
				if (id && typeof id === 'string' && id.startsWith('c') && id.length > 20) {
					return id;
				}
				return undefined; // If not a placeholder and not CUID-like, treat as 'not set'
			};

			editUserForm.reset({
				fName: selectedUserForEdit.fName,
				lName: selectedUserForEdit.lName,
				email: selectedUserForEdit.email,
				phoneNumber: selectedUserForEdit.phoneNumber,
				isStudent: !!selectedUserForEdit.student,
				studentManagingAdminId: getSafeManagingAdminId(selectedUserForEdit.student?.managingAdminId),
				isAdmin: !!selectedUserForEdit.admin,
				isStaff: !!selectedUserForEdit.staff,
				staffManagingAdminId: getSafeManagingAdminId(selectedUserForEdit.staff?.managingAdminId),
			});
		} else {
			editUserForm.reset({});
		}
	}, [selectedUserForEdit, editUserForm]);

	const adminCreateUserMutation = api.user.adminCreateUser.useMutation({
		onSuccess: (data) => {
			toast.success(`User "${data.fName} ${data.lName}" created successfully!`);
			utils.user.adminListUsers.invalidate();
			setIsAddUserDialogOpen(false);
			addUserForm.reset();
		},
		onError: (error) => {
			toast.error(`Failed to create user: ${error.message}`);
			// TODO: Map Zod errors to form fields if possible from error.data.zodError
		},
	});

	const adminUpdateUserMutation = api.user.adminUpdateUser.useMutation({
		onSuccess: (data) => {
			console.log("Mutation onSuccess:", data);
			toast.success(`User "${data.fName} ${data.lName}" updated successfully!`);
			utils.user.adminListUsers.invalidate();
			setIsEditUserDialogOpen(false);
			setSelectedUserForEdit(null);
		},
		onError: (error) => {
			console.error("Mutation onError:", error);
			toast.error(`Failed to update user: ${error.message}`);
		},
	});

	const adminDeleteUserMutation = api.user.adminDeleteUser.useMutation({
		onSuccess: (_, variables) => {
			const userName = selectedUserForDelete?.name ?? `User ID ${variables.userId.substring(0, 6)}`;
			toast.success(`User "${userName}" deleted.`);
			utils.user.adminListUsers.invalidate();
			setIsDeleteUserDialogOpen(false);
			setSelectedUserForDelete(null);
			// Adjust current page if last item on page is deleted
			if (usersQuery.data?.users.length === 1 && currentPage > 1) {
				setCurrentPage(currentPage - 1);
			}
		},
		onError: (error) => toast.error(`Failed to delete user: ${error.message}`),
	});

	const handleAddUserSubmit = (values: AddUserFormValues) => {
		adminCreateUserMutation.mutate(values);
	};

	const handleEditUserSubmit = (values: EditUserFormValues) => {
		console.log("handleEditUserSubmit called with values:", values);
		if (!selectedUserForEdit) {
			console.error("handleEditUserSubmit: selectedUserForEdit is null");
			return;
		}
		adminUpdateUserMutation.mutate({ userId: selectedUserForEdit.id, ...values });
	};

	const openEditUserDialog = (user: UserFromServer) => {
		setSelectedUserForEdit(user);
		setIsEditUserDialogOpen(true);
	};

	const openDeleteUserDialog = (user: UserFromServer) => {
		setSelectedUserForDelete(user);
		setIsDeleteUserDialogOpen(true);
	};

	const confirmDeleteUser = () => {
		if (!selectedUserForDelete) return;
		adminDeleteUserMutation.mutate({ userId: selectedUserForDelete.id });
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
		setCurrentPage(1);
	};

	const handleRoleFilterChange = (value: string) => {
		setRoleFilter(value as UserRole | "all");
		setCurrentPage(1);
	};

	if (usersQuery.isLoading && !usersQuery.isPlaceholderData) {
		return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading users...</span></div>;
	}

	if (usersQuery.isError) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-destructive">
				<AlertTriangle className="h-12 w-12 mb-2" />
				<p className="text-lg font-semibold">Error loading users</p>
				<p>{usersQuery.error?.message}</p>
				<Button onClick={() => usersQuery.refetch()} className="mt-4">Retry</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 p-1 md:p-0">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					{/* <Button variant="ghost" size="icon" asChild>
						<Link href="/admin">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button> */}
					<h1 className="font-semibold text-xl md:text-2xl">User Management</h1>
				</div>
				<Button size="sm" variant="outline" onClick={() => { addUserForm.reset(); setIsAddUserDialogOpen(true);}}>
					<UserPlus className="mr-2 h-4 w-4" />
					Add New User
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Users</CardTitle>
					<CardDescription>
						View, manage, and filter all users in the system.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
						<div className="relative flex-1">
							<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search by name or email..."
								className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
								value={searchTerm}
								onChange={handleSearchChange}
							/>
							{searchTerm && (
								<Button variant="ghost" size="icon" onClick={() => setSearchTerm("")} className="ml-2">
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
						<div className="flex gap-2">
							<Select
								value={roleFilter}
								onValueChange={handleRoleFilterChange}
							>
								<SelectTrigger className="w-full md:w-[180px]">
									<Filter className="mr-2 h-4 w-4" />
									<SelectValue placeholder="Filter by Role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Roles</SelectItem>
									{Object.entries(userRoleDisplay).map(([value, label]) => (
										<SelectItem key={value} value={value}>{label}</SelectItem>
									))}
								</SelectContent>
							</Select>
							{/* Status filter removed as it's not in DB schema */}
						</div>
					</div>

					<div className="border rounded-lg overflow-x-auto">
						<Table className="min-w-full">
							<TableHeader>
								<TableRow>
									<TableHead className="hidden w-[60px] sm:table-cell px-2 py-2 text-xs">
										<span className="sr-only">Avatar</span>
									</TableHead>
									<TableHead className="px-2 py-2 text-xs">Name</TableHead>
									<TableHead className="px-2 py-2 text-xs">Email</TableHead>
									<TableHead className="px-2 py-2 text-xs">Role</TableHead>
									<TableHead className="hidden md:table-cell px-2 py-2 text-xs">Joined / Verified</TableHead>
									<TableHead className="px-2 py-2 text-center text-xs">
										<span className="sr-only">Actions</span>
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{usersQuery.isLoading && usersQuery.isPlaceholderData && (
									<TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" /></TableCell></TableRow>
								)}
								{!usersQuery.isLoading && paginatedUsers.length === 0 && (
									<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
										{searchTerm || roleFilter !== 'all' ? 'No users match your current filters.' : 'No users found.'}
									</TableCell></TableRow>
								)}
								{paginatedUsers.map((user) => (
									<TableRow key={user.id}>
										<TableCell className="hidden sm:table-cell px-2 py-2">
											{user.image ? (
												<img
													alt="User avatar"
													className="aspect-square rounded-full object-cover"
													height="40"
													src={user.image}
													width="40"
												/>
											) : (
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-sm">
													{(user.fName?.charAt(0) ?? "").toUpperCase()}{(user.lName?.charAt(0) ?? "").toUpperCase()}
												</div>
											)}
										</TableCell>
										<TableCell className="font-medium px-2 py-2 text-xs truncate">
											{`${user.fName} ${user.lName}`.length > 10 ? `${(`${user.fName} ${user.lName}`).substring(0, 10)}...` : `${user.fName} ${user.lName}`}
										</TableCell>
										<TableCell className="px-2 py-2 text-xs truncate">
											{(user.email ?? '').length > 10 ? `${(user.email ?? '').substring(0, 10)}...` : user.email}
										</TableCell>
										<TableCell className="px-2 py-2 text-xs">
											<Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
												{userRoleDisplay[user.role as UserRole] || "Unknown"}
											</Badge>
										</TableCell>
										<TableCell className="hidden md:table-cell px-2 py-2 text-xs whitespace-nowrap">
											{user.emailVerified ? format(new Date(user.emailVerified), "PP") : "Not Verified"}
										</TableCell>
										<TableCell className="px-2 py-2 text-center text-xs whitespace-nowrap">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button aria-haspopup="true" size="icon" variant="ghost">
														<MoreHorizontal className="h-4 w-4" />
														<span className="sr-only">Toggle menu</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													{/* <DropdownMenuItem>View Details (NYI)</DropdownMenuItem> */}
													<DropdownMenuItem onClick={() => openEditUserDialog(user)}>
														<Edit className="mr-2 h-4 w-4" /> Edit User
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem className="text-red-600" onClick={() => openDeleteUserDialog(user)}>
														<Trash2 className="mr-2 h-4 w-4" /> Delete User
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Pagination */}
			{totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || usersQuery.isFetching}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || usersQuery.isFetching}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}

			{/* Add User Dialog */}
			<Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Add New User</DialogTitle>
						<DialogDescription>
							Enter the details for the new user and assign initial roles.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={addUserForm.handleSubmit(handleAddUserSubmit)} className="space-y-4 py-2">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="add-fName">First Name</Label>
								<Input id="add-fName" {...addUserForm.register("fName")} />
								{addUserForm.formState.errors.fName && <p className="text-red-500 text-xs mt-1">{addUserForm.formState.errors.fName.message}</p>}
							</div>
							<div>
								<Label htmlFor="add-lName">Last Name</Label>
								<Input id="add-lName" {...addUserForm.register("lName")} />
								{addUserForm.formState.errors.lName && <p className="text-red-500 text-xs mt-1">{addUserForm.formState.errors.lName.message}</p>}
							</div>
						</div>
						<div>
							<Label htmlFor="add-email">Email</Label>
							<Input id="add-email" type="email" {...addUserForm.register("email")} />
							{addUserForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{addUserForm.formState.errors.email.message}</p>}
						</div>
						<div>
							<Label htmlFor="add-password">Password</Label>
							<Input id="add-password" type="password" {...addUserForm.register("password")} />
							{addUserForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{addUserForm.formState.errors.password.message}</p>}
						</div>
						<div>
							<Label htmlFor="add-phoneNumber">Phone Number (Optional)</Label>
							<Input id="add-phoneNumber" {...addUserForm.register("phoneNumber")} />
						</div>
						<div className="space-y-2 pt-2">
							<Label>Initial Roles</Label>
							<div className="flex items-center space-x-2">
								<Controller name="isStudent" control={addUserForm.control} render={({ field }) => <Checkbox id="add-isStudent" checked={field.value} onCheckedChange={field.onChange} />} />
								<Label htmlFor="add-isStudent" className="font-normal">Student</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Controller name="isStaff" control={addUserForm.control} render={({ field }) => <Checkbox id="add-isStaff" checked={field.value} onCheckedChange={field.onChange} />} />
								<Label htmlFor="add-isStaff" className="font-normal">Staff</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Controller name="isAdmin" control={addUserForm.control} render={({ field }) => <Checkbox id="add-isAdmin" checked={field.value} onCheckedChange={field.onChange} />} />
								<Label htmlFor="add-isAdmin" className="font-normal">Admin</Label>
							</div>
						</div>
						<DialogFooter>
							<DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
							<Button type="submit" disabled={adminCreateUserMutation.isPending}>
								{adminCreateUserMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating User...</> : "Create User"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit User Dialog */}
			{selectedUserForEdit && (
				<Dialog open={isEditUserDialogOpen} onOpenChange={(open) => { if (!open) setSelectedUserForEdit(null); setIsEditUserDialogOpen(open); }}>
					<DialogContent className="sm:max-w-lg">
						<DialogHeader>
							<DialogTitle>Edit User: {selectedUserForEdit.fName} {selectedUserForEdit.lName}</DialogTitle>
							<DialogDescription>Update user details and roles.</DialogDescription>
						</DialogHeader>
						{/* 
                        console.log("Edit Dialog - adminUpdateUserMutation state:", { 
							isIdle: adminUpdateUserMutation.isIdle,
							isPending: adminUpdateUserMutation.isPending, // Corrected from isLoading
							isSuccess: adminUpdateUserMutation.isSuccess,
							isError: adminUpdateUserMutation.isError,
							status: adminUpdateUserMutation.status,
							error: adminUpdateUserMutation.error,
							data: adminUpdateUserMutation.data
						})
                        */}
						<form onSubmit={editUserForm.handleSubmit(handleEditUserSubmit, (errors) => {
							console.error("Form validation errors:", errors);
						})} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="edit-fName">First Name</Label>
									<Input id="edit-fName" {...editUserForm.register("fName")} />
									{editUserForm.formState.errors.fName && <p className="text-red-500 text-xs mt-1">{editUserForm.formState.errors.fName.message}</p>}
								</div>
								<div>
									<Label htmlFor="edit-lName">Last Name</Label>
									<Input id="edit-lName" {...editUserForm.register("lName")} />
									{editUserForm.formState.errors.lName && <p className="text-red-500 text-xs mt-1">{editUserForm.formState.errors.lName.message}</p>}
								</div>
							</div>
							<div>
								<Label htmlFor="edit-email">Email</Label>
								<Input id="edit-email" type="email" {...editUserForm.register("email")} />
								{editUserForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{editUserForm.formState.errors.email.message}</p>}
							</div>
							<div>
								<Label htmlFor="edit-phoneNumber">Phone Number</Label>
								<Input id="edit-phoneNumber" {...editUserForm.register("phoneNumber")} />
							</div>

							<div className="space-y-2 pt-3">
								<Label className="font-medium">Roles</Label>
								<div className="flex items-center space-x-2">
									<Controller name="isStudent" control={editUserForm.control} render={({ field }) => <Checkbox id="edit-isStudent" checked={field.value} onCheckedChange={field.onChange} />} />
									<Label htmlFor="edit-isStudent" className="font-normal">Student</Label>
								</div>
								{editUserForm.watch("isStudent") && (
									<div className="pl-6">
										<Label htmlFor="edit-studentManagingAdminId">Managing Admin ID (Optional)</Label>
										<Input id="edit-studentManagingAdminId" {...editUserForm.register("studentManagingAdminId")} placeholder="Enter User ID of Admin" />
									</div>
								)}
								<div className="flex items-center space-x-2">
									<Controller name="isStaff" control={editUserForm.control} render={({ field }) => <Checkbox id="edit-isStaff" checked={field.value} onCheckedChange={field.onChange} />} />
									<Label htmlFor="edit-isStaff" className="font-normal">Staff</Label>
								</div>
								{editUserForm.watch("isStaff") && (
									<div className="pl-6">
										<Label htmlFor="edit-staffManagingAdminId">Managing Admin ID (Optional)</Label>
										<Input id="edit-staffManagingAdminId" {...editUserForm.register("staffManagingAdminId")} placeholder="Enter User ID of Admin" />
									</div>
								)}
								<div className="flex items-center space-x-2">
									<Controller name="isAdmin" control={editUserForm.control} render={({ field }) => <Checkbox id="edit-isAdmin" checked={field.value} onCheckedChange={field.onChange} />} />
									<Label htmlFor="edit-isAdmin" className="font-normal">Admin</Label>
								</div>
							</div>
							<DialogFooter className="pt-4">
								<DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
								<Button type="submit" disabled={adminUpdateUserMutation.isPending}>
									{adminUpdateUserMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...</> : "Save Changes"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			)}

			{/* Delete User Dialog */}
			{selectedUserForDelete && (
				<Dialog open={isDeleteUserDialogOpen} onOpenChange={(open) => { if (!open) setSelectedUserForDelete(null); setIsDeleteUserDialogOpen(open); }}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete User: {selectedUserForDelete.name}?</DialogTitle>
							<DialogDescription className="py-2">
								Are you sure you want to delete this user? This action is permanent and cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
							<Button variant="destructive" onClick={confirmDeleteUser} disabled={adminDeleteUserMutation.isPending}>
								{adminDeleteUserMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting User...</> : "Delete User"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
			
			<Button variant="link" asChild className="mt-4 mb-[80px] ml-auto block w-fit">
				<Link href="/admin">
					Back to Admin Dashboard
				</Link>
			</Button>
		</div>
	);
}
