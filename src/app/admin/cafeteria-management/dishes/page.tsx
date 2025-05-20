"use client";

import React, { useState, useMemo, useEffect } from "react";
import { api } from "@/trpc/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PlusCircle, Edit, Trash2, Search, Utensils, Shell, CircleDollarSign } from "lucide-react";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// Zod schema for the dish form
const dishFormSchema = z.object({
	dishName: z.string().min(1, "Dish name is required."),
	category: z.string().min(1, "Category is required."), // Made category required
	price: z.coerce.number().min(0.01, "Price must be at least 0.01."),
	calories: z.coerce.number().int().positive().nullable().optional(),
	available: z.boolean(),
});

type DishFormValues = z.infer<typeof dishFormSchema>;

type RouterOutputs = inferRouterOutputs<AppRouter>;
type DishFromServer = RouterOutputs["cafeteria"]["listDishes"]["dishes"][number];

export default function ManageDishesPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [page, setPage] = useState(0); // 0-indexed for client-side state
	const [pageSize] = useState(10);

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedDish, setSelectedDish] = useState<DishFromServer | null>(null);

	const utils = api.useUtils();

	const dishesQuery = api.cafeteria.listDishes.useQuery(
		{ search: debouncedSearchTerm, limit: pageSize, page: page + 1 },
		{ placeholderData: (previousData) => previousData }
	);

	const createDishMutation = api.cafeteria.createDish.useMutation({
		onSuccess: (data) => {
			toast.success(`Dish "${data.dishName}" created successfully!`);
			utils.cafeteria.listDishes.invalidate();
			setIsAddDialogOpen(false);
			resetAddForm();
		},
		onError: (error) => {
			toast.error(`Failed to create dish: ${error.message}`);
		},
	});

	const updateDishMutation = api.cafeteria.updateDish.useMutation({
		onSuccess: (data) => {
			toast.success(`Dish "${data.dishName}" updated successfully!`);
			utils.cafeteria.listDishes.invalidate();
			setIsEditDialogOpen(false);
			setSelectedDish(null);
		},
		onError: (error) => {
			toast.error(`Failed to update dish: ${error.message}`);
		},
	});

	const deleteDishMutation = api.cafeteria.deleteDish.useMutation({
		onSuccess: (_data, variables) => {
			const dishName = selectedDish?.dishName ?? `Dish ID ${variables.dishId.substring(0,8)}`;
			toast.success(`Dish "${dishName}" deleted successfully!`);
			utils.cafeteria.listDishes.invalidate();
			setIsDeleteDialogOpen(false);
			setSelectedDish(null);
		},
		onError: (error) => {
			toast.error(`Failed to delete dish: ${error.message}`);
		},
	});

	const {
		control: addFormControl,
		handleSubmit: handleAddSubmit,
		reset: resetAddForm,
		formState: { errors: addFormErrors },
	} = useForm<DishFormValues>({
		resolver: zodResolver(dishFormSchema),
		defaultValues: { dishName: "", category: "", price: 0.01, calories: null, available: true },
	});

	const {
		control: editFormControl,
		handleSubmit: handleEditSubmit,
		reset: resetEditForm,
		formState: { errors: editFormErrors },
	} = useForm<DishFormValues>({
		resolver: zodResolver(dishFormSchema),
	});

	useEffect(() => {
		const timerId = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
			setPage(0); // Reset to first page on new search
		}, 500);
		return () => clearTimeout(timerId);
	}, [searchTerm]);

	const onSubmitAddDish = (data: DishFormValues) => {
		const payload = {
			...data,
			calories: data.calories === null || data.calories === undefined || data.calories === 0 ? undefined : data.calories,
		};
		createDishMutation.mutate(payload);
	};

	const handleOpenEditDialog = (dish: DishFromServer) => {
		setSelectedDish(dish);
		resetEditForm({
			dishName: dish.dishName,
			category: dish.category ?? "", 
			price: Number(dish.price),
			calories: dish.calories,
			available: dish.available,
		});
		setIsEditDialogOpen(true);
	};

	const onSubmitEditDish = (data: DishFormValues) => {
		if (!selectedDish) return;
		const payload = {
			dishId: selectedDish.dishId,
			...data,
			calories: data.calories === null || data.calories === undefined || data.calories === 0 ? undefined : data.calories,
		};
		updateDishMutation.mutate(payload);
	};

	const handleOpenDeleteDialog = (dish: DishFromServer) => {
		setSelectedDish(dish);
		setIsDeleteDialogOpen(true);
	};

	const confirmDeleteDish = () => {
		if (!selectedDish) return;
		deleteDishMutation.mutate({ dishId: selectedDish.dishId });
	};

	const totalPages = dishesQuery.data?.totalPages ?? 0;

	useEffect(() => {
		if (dishesQuery.error) {
			toast.error(`Failed to load dishes: ${dishesQuery.error.message}`);
		}
	}, [dishesQuery.error]);

	return (
		<div className="container mx-auto py-6 px-2 sm:px-4 md:px-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
				<h1 className="text-2xl sm:text-3xl font-bold">Manage Dishes</h1>
				<Button onClick={() => { resetAddForm(); setIsAddDialogOpen(true); }} className="flex items-center gap-2 w-full sm:w-auto">
					<PlusCircle className="h-5 w-5" />
					Add New Dish
				</Button>
			</div>

			<div className="mb-4">
				<div className="relative">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search dishes..." // Simplified placeholder for mobile
						className="pl-8 w-full md:w-2/3 lg:w-1/3" // Adjusted width for different screens
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			{/* Add Dish Dialog */}
			<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
				<DialogContent className="sm:max-w-md w-[90%] sm:w-full rounded-lg">
					<DialogHeader>
						<DialogTitle>Add New Dish</DialogTitle>
						<DialogDescription>Fill in the details for the new dish.</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleAddSubmit(onSubmitAddDish)} className="grid gap-4 py-4">
						{/* Form fields - making them stack on small screens if needed */}
						<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
							<Label htmlFor="dishNameAdd" className="sm:text-right">Name</Label>
							<Controller
								name="dishName"
								control={addFormControl}
								render={({ field }) => <Input id="dishNameAdd" {...field} className="col-span-1 sm:col-span-3" />}
							/>
						</div>
						{addFormErrors.dishName && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{addFormErrors.dishName.message}</p>}
						
						<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
							<Label htmlFor="categoryAdd" className="sm:text-right">Category</Label>
							<Controller
								name="category"
								control={addFormControl}
								render={({ field }) => <Input id="categoryAdd" {...field} className="col-span-1 sm:col-span-3" />}
							/>
						</div>
						{addFormErrors.category && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{addFormErrors.category.message}</p>}

						<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
							<Label htmlFor="priceAdd" className="sm:text-right">Price (₺)</Label>
							<Controller
								name="price"
								control={addFormControl}
								render={({ field }) => <Input id="priceAdd" type="number" step="0.01" {...field} onChange={e => field.onChange(Number.parseFloat(e.target.value))} className="col-span-1 sm:col-span-3"/>}
							/>
						</div>
						{addFormErrors.price && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{addFormErrors.price.message}</p>}
						
						<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
							<Label htmlFor="caloriesAdd" className="sm:text-right">Calories</Label>
							<Controller
								name="calories"
								control={addFormControl}
								render={({ field }) => (
									<Input 
										id="caloriesAdd" 
										type="number" 
										step="1" 
										{...field} 
										value={field.value ?? ""}
										onChange={e => {
											const val = e.target.value;
											field.onChange(val === "" ? null : Number.parseInt(val, 10));
										}}
										placeholder="Optional" 
										className="col-span-1 sm:col-span-3"/>
								)}
							/>
						</div>
						{addFormErrors.calories && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{addFormErrors.calories.message}</p>}

						<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
							<div className="sm:col-start-2 sm:col-span-3 flex items-center space-x-2">
								<Controller
									name="available"
									control={addFormControl}
									render={({ field }) => (
										<>
											<Checkbox id="availableAdd" checked={field.value} onCheckedChange={field.onChange} />
											<Label htmlFor="availableAdd" className="font-normal">Available</Label>
										</>
									)}
								/>
							</div>
						</div>
						{addFormErrors.available && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{addFormErrors.available.message}</p>}
						
						<DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
							<DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
							<Button type="submit" disabled={createDishMutation.isPending} className="w-full sm:w-auto">
								{createDishMutation.isPending ? "Adding..." : "Add Dish"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit Dish Dialog */}
			{selectedDish && (
				<Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) setSelectedDish(null); }}>
					<DialogContent className="sm:max-w-md w-[90%] sm:w-full rounded-lg">
						<DialogHeader>
							<DialogTitle>Edit Dish</DialogTitle>
							<DialogDescription>Update details for &quot;{selectedDish.dishName}&quot;.</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleEditSubmit(onSubmitEditDish)} className="grid gap-4 py-4">
							<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
								<Label htmlFor="dishNameEdit" className="sm:text-right">Name</Label>
								<Controller
									name="dishName"
									control={editFormControl}
									render={({ field }) => <Input id="dishNameEdit" {...field} className="col-span-1 sm:col-span-3" />}
								/>
							</div>
							{editFormErrors.dishName && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{editFormErrors.dishName.message}</p>}

							<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
								<Label htmlFor="categoryEdit" className="sm:text-right">Category</Label>
								<Controller
									name="category"
									control={editFormControl}
									render={({ field }) => <Input id="categoryEdit" {...field} className="col-span-1 sm:col-span-3" />}
								/>
							</div>
							{editFormErrors.category && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{editFormErrors.category.message}</p>}

							<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
								<Label htmlFor="priceEdit" className="sm:text-right">Price (₺)</Label>
								<Controller
									name="price"
									control={editFormControl}
									render={({ field }) => <Input id="priceEdit" type="number" step="0.01" {...field} onChange={e => field.onChange(Number.parseFloat(e.target.value))} className="col-span-1 sm:col-span-3"/>}
								/>
							</div>
							{editFormErrors.price && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{editFormErrors.price.message}</p>}

							<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
								<Label htmlFor="caloriesEdit" className="sm:text-right">Calories</Label>
								<Controller
									name="calories"
									control={editFormControl}
									render={({ field }) => (
										<Input 
											id="caloriesEdit" 
											type="number" 
											step="1" 
											{...field} 
											value={field.value ?? ""}
											onChange={e => {
												const val = e.target.value;
												field.onChange(val === "" ? null : Number.parseInt(val, 10));
											}}
											placeholder="Optional" 
											className="col-span-1 sm:col-span-3"/>
									)}
								/>
							</div>
							{editFormErrors.calories && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{editFormErrors.calories.message}</p>}

							<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
								<div className="sm:col-start-2 sm:col-span-3 flex items-center space-x-2">
									<Controller
										name="available"
										control={editFormControl}
										render={({ field }) => (
											<>
												<Checkbox id="availableEdit" checked={field.value} onCheckedChange={field.onChange} />
												<Label htmlFor="availableEdit" className="font-normal">Available</Label>
											</>
										)}
									/>
								</div>
							</div>
							{editFormErrors.available && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{editFormErrors.available.message}</p>}
							
							<DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
								<DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
								<Button type="submit" disabled={updateDishMutation.isPending} className="w-full sm:w-auto">
									{updateDishMutation.isPending ? "Saving..." : "Save Changes"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			)}

			{/* Delete Dish Dialog */}
			{selectedDish && (
				<Dialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => { setIsDeleteDialogOpen(isOpen); if (!isOpen) setSelectedDish(null); }}>
					<DialogContent className="sm:max-w-xs w-[90%] sm:w-full rounded-lg">
						<DialogHeader>
							<DialogTitle>Delete Dish</DialogTitle>
							<DialogDescription>
								Are you sure you want to delete &quot;{selectedDish.dishName}&quot;? This action cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="sm:justify-start mt-4 flex flex-col sm:flex-row gap-2 sm:gap-0">
							<DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
							<Button variant="destructive" onClick={confirmDeleteDish} disabled={deleteDishMutation.isPending} className="w-full sm:w-auto">
								{deleteDishMutation.isPending ? "Deleting..." : "Delete Dish"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			<div className="border rounded-lg overflow-x-auto"> {/* Added overflow-x-auto for table responsiveness */}
				<Table className="min-w-full"><TableHeader>
						<TableRow>
							<TableHead className="py-2 px-2 md:px-3"><Utensils className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>Dish Name</TableHead>
							<TableHead className="py-2 px-2 md:px-3 hidden md:table-cell"><Shell className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>Category</TableHead>
							<TableHead className="py-2 px-2 md:px-3 text-right hidden sm:table-cell"><CircleDollarSign className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>Price</TableHead>
							<TableHead className="py-2 px-2 md:px-3 text-center hidden lg:table-cell">Calories</TableHead>
							<TableHead className="py-2 px-2 md:px-3 text-center">Available</TableHead>
							<TableHead className="py-2 px-2 md:px-3 text-center">Actions</TableHead>
						</TableRow>
					</TableHeader><TableBody>
						{dishesQuery.isLoading && !dishesQuery.isPlaceholderData && (
							<TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading dishes...</TableCell></TableRow>
						)}
						{dishesQuery.isError && (
							<TableRow><TableCell colSpan={6} className="text-center py-10 text-red-500">Error loading dishes. Try refreshing.</TableCell></TableRow>
						)}
						{dishesQuery.data?.dishes.length === 0 && !dishesQuery.isLoading && !dishesQuery.isError &&(
							<TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No dishes found.</TableCell></TableRow>
						)}
						{dishesQuery.data?.dishes.map((dish) => (
							<TableRow key={dish.dishId} className={`${dishesQuery.isPlaceholderData ? "opacity-50" : ""} hover:bg-muted/50`}>
								<TableCell className="font-medium py-2 px-2 md:px-3">{dish.dishName}</TableCell>
								<TableCell className="py-2 px-2 md:px-3 hidden md:table-cell">{dish.category}</TableCell>
								<TableCell className="py-2 px-2 md:px-3 text-right hidden sm:table-cell">₺{Number(dish.price).toFixed(2)}</TableCell>
								<TableCell className="py-2 px-2 md:px-3 text-center hidden lg:table-cell">{dish.calories ?? "N/A"}</TableCell>
								<TableCell className="py-2 px-2 md:px-3 text-center">
									<Badge variant={dish.available ? "default" : "outline"} className={`${dish.available ? "bg-green-500 hover:bg-green-600 text-white" : "border-gray-400 text-gray-600"} text-xs px-2 py-0.5`}>
										{dish.available ? "Yes" : "No"}
									</Badge>
								</TableCell>
								<TableCell className="py-2 px-2 md:px-3 text-center whitespace-nowrap">
									<Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(dish)} className="mr-1" aria-label="Edit dish">
										<Edit className="h-4 w-4" />
									</Button>
									<Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(dish)} className="text-destructive hover:text-destructive" aria-label="Delete dish">
										<Trash2 className="h-4 w-4" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody></Table>
			</div>

			{totalPages > 0 && (
				<div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 py-4 mb-[80px]">
					<div className="flex space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((prev) => Math.max(0, prev - 1))}
							disabled={page === 0 || dishesQuery.isFetching}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
							disabled={page >= totalPages - 1 || dishesQuery.isFetching}
						>
							Next
						</Button>
					</div>
					<span className="text-sm text-muted-foreground pt-2 sm:pt-0">
						Page {page + 1} of {totalPages}
					</span>
				</div>
			)}
		</div>
	);
}
