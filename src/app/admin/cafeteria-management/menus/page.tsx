"use client";

import React, { useState, useMemo, useEffect } from "react";
import { api } from "@/trpc/react";
import { useForm, Controller } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PlusCircle, Edit, Trash2, Search, Utensils, CircleDollarSign, PackageOpen, CalendarIcon, MoreHorizontal, X } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";

// Zod schema for the menu form
const menuFormSchema = z.object({
	menuName: z.string().min(1, "Menu name is required."),
	date: z.date({ required_error: "Menu date is required." }),
	price: z.coerce.number().min(0, "Price must be non-negative."),
	dishIds: z.array(z.string().uuid()).min(1, "At least one dish must be selected."),
});

type MenuFormValues = z.infer<typeof menuFormSchema>;

type RouterOutputs = inferRouterOutputs<AppRouter>;
type MenuFromServer = RouterOutputs["cafeteria"]["listMenus"]["menus"][number];
type DishFromServer = RouterOutputs["cafeteria"]["listDishes"]["dishes"][number];

export default function ManageMenusPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [page, setPage] = useState(0);
	const [pageSize] = useState(10);

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedMenu, setSelectedMenu] = useState<MenuFromServer | null>(null);

	const utils = api.useUtils();

	const menusQuery = api.cafeteria.listMenus.useQuery(
		{ search: debouncedSearchTerm, limit: pageSize, page: page + 1 },
		{ placeholderData: (previousData) => previousData }
	);

	const dishesForSelectionQuery = api.cafeteria.listDishes.useQuery({ limit: 1000, page: 1 });

	const createMenuMutation = api.cafeteria.createMenu.useMutation({
		onSuccess: (data) => {
			toast.success(`Menu "${data.menuName}" created successfully!`);
			utils.cafeteria.listMenus.invalidate();
			setIsAddDialogOpen(false);
			resetAddForm();
		},
		onError: (error) => {
			toast.error(`Failed to create menu: ${error.message}`);
		},
	});

	const updateMenuMutation = api.cafeteria.updateMenu.useMutation({
		onSuccess: (data) => {
			toast.success(`Menu "${data.menuName}" updated successfully!`);
			utils.cafeteria.listMenus.invalidate();
			setIsEditDialogOpen(false);
			setSelectedMenu(null);
		},
		onError: (error) => {
			toast.error(`Failed to update menu: ${error.message}`);
		},
	});

	const deleteMenuMutation = api.cafeteria.deleteMenu.useMutation({
		onSuccess: (_data, variables) => {
			const menuName = selectedMenu?.menuName ?? `Menu ID ${variables.menuId.substring(0,8)}`;
			toast.success(`Menu "${menuName}" deleted successfully!`);
			utils.cafeteria.listMenus.invalidate();
			setIsDeleteDialogOpen(false);
			setSelectedMenu(null);
			if (menusQuery.data?.menus.length === 1 && page > 0) {
                setPage(page - 1);
            }
		},
		onError: (error) => {
			toast.error(`Failed to delete menu: ${error.message}`);
		},
	});

	const {
		control: addFormControl,
		handleSubmit: handleAddSubmit,
		reset: resetAddForm,
		formState: { errors: addFormErrors },
	} = useForm<MenuFormValues>({
		resolver: zodResolver(menuFormSchema),
		defaultValues: { menuName: "", date: new Date(), price: 0, dishIds: [] },
	});

	const {
		control: editFormControl,
		handleSubmit: handleEditSubmit,
		reset: resetEditForm,
		formState: { errors: editFormErrors },
	} = useForm<MenuFormValues>({
		resolver: zodResolver(menuFormSchema),
	});

	useEffect(() => {
		const timerId = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
			setPage(0); 
		}, 500);
		return () => clearTimeout(timerId);
	}, [searchTerm]);
	
	useEffect(() => {
        if (selectedMenu) {
            resetEditForm({
                menuName: selectedMenu.menuName,
                date: new Date(selectedMenu.date),
                price: Number(selectedMenu.price),
                dishIds: selectedMenu.menuDishes.map((md) => md.dish.dishId),
            });
        }
    }, [selectedMenu, resetEditForm]);

	const onSubmitAddMenu = (data: MenuFormValues) => {
		createMenuMutation.mutate(data);
	};

	const handleOpenEditDialog = (menu: MenuFromServer) => {
		setSelectedMenu(menu);
		setIsEditDialogOpen(true);
	};

	const onSubmitEditMenu = (data: MenuFormValues) => {
		if (!selectedMenu) return;
		updateMenuMutation.mutate({ menuId: selectedMenu.menuId, ...data });
	};

	const handleOpenDeleteDialog = (menu: MenuFromServer) => {
		setSelectedMenu(menu);
		setIsDeleteDialogOpen(true);
	};

	const confirmDeleteMenu = () => {
		if (!selectedMenu) return;
		deleteMenuMutation.mutate({ menuId: selectedMenu.menuId });
	};

	const totalPages = menusQuery.data?.totalPages ?? 0;

	useEffect(() => {
		if (menusQuery.error) {
			toast.error(`Failed to load menus: ${menusQuery.error.message}`);
		}
		if (dishesForSelectionQuery.error) {
			toast.error(`Failed to load dishes for selection: ${dishesForSelectionQuery.error.message}`);
		}
	}, [menusQuery.error, dishesForSelectionQuery.error]);

	const renderDishSelection = (field: ControllerRenderProps<MenuFormValues, "dishIds">, allDishes: DishFromServer[] | undefined) => (
		<ScrollArea className="h-40 w-full rounded-md border p-2 col-span-full sm:col-span-3">
			{(allDishes ?? []).map((dish) => (
				<div key={dish.dishId} className="flex items-center space-x-2 mb-1">
					<Checkbox
						id={`dish-${dish.dishId}-${field.name}`}
						checked={field.value?.includes(dish.dishId)}
						onCheckedChange={(checked) => {
							return checked
								? field.onChange([...(field.value ?? []), dish.dishId])
								: field.onChange((field.value ?? []).filter((id: string) => id !== dish.dishId));
						}}
					/>
					<Label htmlFor={`dish-${dish.dishId}-${field.name}`} className="text-sm font-normal cursor-pointer">
						{dish.dishName} (₺{Number(dish.price).toFixed(2)})
					</Label>
				</div>
			))}
			{(allDishes ?? []).length === 0 && <p className="text-sm text-muted-foreground">No dishes available.</p>}
		</ScrollArea>
	);
	
	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        setPage(0);
    };


	return (
		<div className="flex flex-col gap-4 p-1 md:p-0">
			<div className="flex items-center justify-between">
				<h1 className="font-semibold text-xl md:text-2xl">Manage Menus</h1>
				<Button size="sm" variant="outline" onClick={() => { resetAddForm({ menuName: "", date: new Date(), price: 0, dishIds: [] }); setIsAddDialogOpen(true); }}>
					<PlusCircle className="mr-2 h-4 w-4" />
					Add New Menu
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Menus</CardTitle>
					<CardDescription>
						View, manage, and filter all menus in the system.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
						<div className="relative flex-1">
							<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search menus by name or dish..."
								className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
								value={searchTerm}
								onChange={handleSearchChange}
							/>
							{searchTerm && (
								<Button variant="ghost" size="icon" onClick={() => setSearchTerm("")} className="absolute top-0.5 right-0.5 h-7 w-7">
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
						{/* Future filter controls can go here */}
					</div>

					<div className="border rounded-lg overflow-x-auto">
						<Table className="min-w-full">
							<TableHeader>
								<TableRow>
									<TableHead className="py-2 px-2 md:px-3"><Utensils className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>Menu Name</TableHead>
									<TableHead className="py-2 px-2 md:px-3 hidden sm:table-cell"><CalendarIcon className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>Date</TableHead>
									<TableHead className="py-2 px-2 md:px-3 text-right hidden xs:table-cell"><CircleDollarSign className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>Price</TableHead>
									<TableHead className="py-2 px-2 md:px-3"><PackageOpen className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>Dishes</TableHead>
									<TableHead className="py-2 px-2 md:px-3 hidden lg:table-cell">Managed By</TableHead>
									<TableHead className="py-2 px-2 md:px-3 text-center">
										<span className="sr-only">Actions</span>
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{menusQuery.isLoading && !menusQuery.isPlaceholderData && (
									<TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading menus...</TableCell></TableRow>
								)}
								{menusQuery.isError && (
									<TableRow><TableCell colSpan={6} className="text-center py-10 text-red-500">Error loading menus. Try refreshing.</TableCell></TableRow>
								)}
								{menusQuery.data?.menus.length === 0 && !menusQuery.isLoading && !menusQuery.isError && (
									<TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No menus found.</TableCell></TableRow>
								)}
								{menusQuery.data?.menus.map((menu) => (
									<TableRow key={menu.menuId} className={`${menusQuery.isPlaceholderData ? "opacity-50" : ""} hover:bg-muted/50`}>
										<TableCell className="font-medium py-2 px-2 md:px-3 whitespace-nowrap">{menu.menuName}</TableCell>
										<TableCell className="py-2 px-2 md:px-3 hidden sm:table-cell">{format(new Date(menu.date), "PPP")}</TableCell>
										<TableCell className="py-2 px-2 md:px-3 text-right hidden xs:table-cell">₺{Number(menu.price).toFixed(2)}</TableCell>
										<TableCell className="py-2 px-2 md:px-3">
											{menu.menuDishes.length > 0 ? (
												<ul className="list-disc list-inside text-xs">
													{menu.menuDishes.slice(0, 2).map((md) => <li key={md.dish.dishId}>{md.dish.dishName}</li>)}
													{menu.menuDishes.length > 2 && <li className="text-muted-foreground">...and {menu.menuDishes.length - 2} more</li>}
												</ul>
											) : (
												<span className="text-xs text-muted-foreground">No dishes</span>
											)}
										</TableCell>
										<TableCell className="text-xs py-2 px-2 md:px-3 hidden lg:table-cell">
											{menu.managedByStaff.user.name ?? `${menu.managedByStaff.user.fName} ${menu.managedByStaff.user.lName}`}
										</TableCell>
										<TableCell className="py-2 px-2 md:px-3 text-center whitespace-nowrap">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button aria-haspopup="true" size="icon" variant="ghost">
														<MoreHorizontal className="h-4 w-4" />
														<span className="sr-only">Toggle menu</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuItem onClick={() => handleOpenEditDialog(menu)}>
														<Edit className="mr-2 h-4 w-4" /> Edit Menu
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem className="text-red-600" onClick={() => handleOpenDeleteDialog(menu)}>
														<Trash2 className="mr-2 h-4 w-4" /> Delete Menu
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
			{totalPages > 0 && (
                <div className="flex items-center justify-center space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                        disabled={page === 0 || menusQuery.isFetching}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page + 1} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                        disabled={page >= totalPages - 1 || menusQuery.isFetching}
                    >
                        Next
                    </Button>
                </div>
            )}

			{/* Add Menu Dialog */} 
			<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
				<DialogContent className="w-[95%] max-w-lg sm:w-full rounded-lg">
					<DialogHeader>
						<DialogTitle>Add New Menu</DialogTitle>
						<DialogDescription>Fill in the details for the new menu and select dishes.</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleAddSubmit(onSubmitAddMenu)} className="grid gap-4 py-4">
						<Controller
							name="menuName"
							control={addFormControl}
							render={({ field }) => (
								<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
									<Label htmlFor="menuNameAdd" className="sm:text-right">Name</Label>
									<Input id="menuNameAdd" {...field} className="col-span-1 sm:col-span-3" />
								</div>
							)}
						/>
						{addFormErrors.menuName && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{addFormErrors.menuName.message}</p>}
						
						<Controller
							name="date"
							control={addFormControl}
							render={({ field }) => (
								<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
									<Label htmlFor="menuDateAdd" className="sm:text-right">Date</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant={"outline"}
												className={cn(
													"col-span-1 sm:col-span-3 justify-start text-left font-normal",
													!field.value && "text-muted-foreground"
												)}
											>
												<CalendarIcon className="mr-2 h-4 w-4" />
												{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0">
											<Calendar
												mode="single"
												selected={field.value}
												onSelect={field.onChange}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>
							)}
						/>
						{addFormErrors.date && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{addFormErrors.date.message}</p>}

						<Controller
							name="price"
							control={addFormControl}
							render={({ field }) => (
								<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
									<Label htmlFor="priceAdd" className="sm:text-right">Price (₺)</Label>
									<Input id="priceAdd" type="number" step="0.01" {...field} onChange={e => field.onChange(Number.parseFloat(e.target.value))} className="col-span-1 sm:col-span-3"/>
								</div>
							)}
						/>
						{addFormErrors.price && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{addFormErrors.price.message}</p>}
						
						<div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
							<Label className="sm:text-right pt-2">Dishes</Label>
							<Controller
								name="dishIds"
								control={addFormControl}
								render={({ field }) => renderDishSelection(field, dishesForSelectionQuery.data?.dishes)}
							/>
						</div>
						 {addFormErrors.dishIds && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{addFormErrors.dishIds.message}</p>}

						<DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
							<DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
							<Button type="submit" disabled={createMenuMutation.isPending || dishesForSelectionQuery.isLoading} className="w-full sm:w-auto">
								{createMenuMutation.isPending ? "Adding..." : "Add Menu"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit Menu Dialog */} 
			{selectedMenu && (
				<Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) setSelectedMenu(null); }}>
					<DialogContent className="w-[95%] max-w-lg sm:w-full rounded-lg">
						<DialogHeader>
							<DialogTitle>Edit Menu</DialogTitle>
							<DialogDescription>Update details for &quot;{selectedMenu.menuName}&quot;.</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleEditSubmit(onSubmitEditMenu)} className="grid gap-4 py-4">
							<Controller
								name="menuName"
								control={editFormControl}
								render={({ field }) => (
									<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
										<Label htmlFor="menuNameEdit" className="sm:text-right">Name</Label>
										<Input id="menuNameEdit" {...field} className="col-span-1 sm:col-span-3" />
									</div>
								)}
							/>
							{editFormErrors.menuName && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{editFormErrors.menuName.message}</p>}
							
							<Controller
								name="date"
								control={editFormControl}
								render={({ field }) => (
									<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
										<Label htmlFor="menuDateEdit" className="sm:text-right">Date</Label>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant={"outline"}
													className={cn(
														"col-span-1 sm:col-span-3 justify-start text-left font-normal",
														!field.value && "text-muted-foreground"
													)}
												>
													<CalendarIcon className="mr-2 h-4 w-4" />
													{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0">
												<Calendar
													mode="single"
													selected={field.value}
													onSelect={field.onChange}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
									</div>
								)}
							/>
							{editFormErrors.date && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{editFormErrors.date.message}</p>}

							<Controller
								name="price"
								control={editFormControl}
								render={({ field }) => (
									<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
										<Label htmlFor="priceEdit" className="sm:text-right">Price (₺)</Label>
										<Input id="priceEdit" type="number" step="0.01" {...field} className="col-span-1 sm:col-span-3" onChange={e => field.onChange(Number.parseFloat(e.target.value))} />
									</div>
								)}
							/>
							{editFormErrors.price && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{editFormErrors.price.message}</p>}

							<div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
								<Label className="sm:text-right pt-2">Dishes</Label>
								 <Controller
									name="dishIds"
									control={editFormControl}
									render={({ field }) => renderDishSelection(field, dishesForSelectionQuery.data?.dishes)}
								/>
							</div>
							{editFormErrors.dishIds && <p className="text-red-500 text-xs sm:col-span-4 sm:text-right -mt-2">{editFormErrors.dishIds.message}</p>}

							<DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
								<DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
								<Button type="submit" disabled={updateMenuMutation.isPending || dishesForSelectionQuery.isLoading} className="w-full sm:w-auto">
									{updateMenuMutation.isPending ? "Saving..." : "Save Changes"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			)}

			{/* Delete Menu Dialog */} 
			{selectedMenu && (
				<Dialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => { setIsDeleteDialogOpen(isOpen); if (!isOpen) setSelectedMenu(null); }}>
					<DialogContent className="w-[95%] max-w-md sm:w-full rounded-lg">
						<DialogHeader>
							<DialogTitle>Delete Menu</DialogTitle>
							<DialogDescription>
								Are you sure you want to delete &quot;{selectedMenu.menuName}&quot;? This action cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="sm:justify-start mt-4 flex flex-col sm:flex-row gap-2 sm:gap-0">
							<DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
							<Button variant="destructive" onClick={confirmDeleteMenu} disabled={deleteMenuMutation.isPending} className="w-full sm:w-auto">
								{deleteMenuMutation.isPending ? "Deleting..." : "Delete Menu"}
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
