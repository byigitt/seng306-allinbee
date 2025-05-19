'use client';

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
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
	DialogTrigger,
	DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";
import { Edit, PlusCircle, Trash2, ArrowLeft, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Zod Schema specifically for the Add Book form
const bookFormSchema = z.object({
	isbn: z.string().min(1, "ISBN is required"),
	title: z.string().min(1, "Title is required"),
	author: z.string().optional(),
	quantityInStock: z.coerce
		.number({ invalid_type_error: "Quantity must be a valid number" })
		.int("Quantity must be a whole number")
		.nonnegative("Quantity cannot be negative")
		.min(0, "Quantity must be at least 0"),
});
type BookFormValues = z.infer<typeof bookFormSchema>;

// Separate schema for editing, ISBN is not part of the editable fields here
const editBookFormSchema = bookFormSchema.omit({ isbn: true }); 
type EditBookFormValues = z.infer<typeof editBookFormSchema>;

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Book = RouterOutputs["appointments"]["listBooks"]["books"][number];

const ITEMS_PER_PAGE = 10;

export default function ManageBookableServicesPage() {
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); 
	const [editingBook, setEditingBook] = useState<Book | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [deletingBook, setDeletingBook] = useState<Book | null>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	const { control, handleSubmit, reset, formState: { errors } } = useForm<BookFormValues>({
		resolver: zodResolver(bookFormSchema),
		defaultValues: {
			isbn: "",
			title: "",
			author: "",
			quantityInStock: 0,
		},
	});

	// Separate form instance for editing
	const {
		control: editControl,
		handleSubmit: handleEditSubmit,
		reset: editReset,
		setValue: editSetValue,
		formState: { errors: editErrors },
	} = useForm<EditBookFormValues>({
		resolver: zodResolver(editBookFormSchema),
		defaultValues: {
			title: "",
			author: "",
			quantityInStock: 0,
		},
	});

	const listBooksQuery = api.appointments.listBooks.useQuery(
		{
			searchTerm: searchTerm || undefined,
			take: ITEMS_PER_PAGE,
			skip: (currentPage - 1) * ITEMS_PER_PAGE,
		},
		{ placeholderData: (previousData) => previousData }
	);

	const createBookMutation = api.appointments.createBook.useMutation({
		onSuccess: (data) => {
			toast.success(`Book "${data.title}" created successfully!`);
			listBooksQuery.refetch();
			setIsAddDialogOpen(false);
			reset();
		},
		onError: (error) => {
			toast.error(`Failed to create book: ${error.message}`);
		},
	});

	const updateBookMutation = api.appointments.updateBook.useMutation({
		onSuccess: (data) => {
			toast.success(`Book "${data.title}" updated successfully!`);
			listBooksQuery.refetch();
			setIsEditDialogOpen(false);
			editReset(); 
			setEditingBook(null);
		},
		onError: (error) => {
			toast.error(`Failed to update book: ${error.message}`);
		},
	});

	const deleteBookMutation = api.appointments.deleteBook.useMutation({
		onSuccess: (data) => {
			toast.success(`Book "${data.title}" (ISBN: ${data.isbn}) deleted successfully!`);
			listBooksQuery.refetch();
			setIsDeleteDialogOpen(false);
			setDeletingBook(null);
		},
		onError: (error) => {
			toast.error(`Failed to delete book: ${error.message}`);
		},
	});

	const onSubmitAddBook = (values: BookFormValues) => {
		createBookMutation.mutate(values);
	};

	const onSubmitEditBook = (values: EditBookFormValues) => {
		if (!editingBook) return;
		updateBookMutation.mutate({
			...values,
			isbn: editingBook.isbn,
		});
	};

	const handleOpenEditDialog = (book: Book) => {
		setEditingBook(book);
		editSetValue("title", book.title);
		editSetValue("author", book.author ?? "");
		editSetValue("quantityInStock", book.quantityInStock);
		setIsEditDialogOpen(true);
	};

	const handleOpenDeleteDialog = (book: Book) => {
		setDeletingBook(book);
		setIsDeleteDialogOpen(true);
	};

	const confirmDeleteBook = () => {
		if (!deletingBook) return;
		deleteBookMutation.mutate({ isbn: deletingBook.isbn });
	};

	const books = listBooksQuery.data?.books ?? [];
	const totalBooks = listBooksQuery.data?.totalCount ?? 0;
	const totalPages = Math.ceil(totalBooks / ITEMS_PER_PAGE);

	useEffect(() => {
		if (listBooksQuery.isError && listBooksQuery.error) {
			toast.error(`Failed to load books: ${listBooksQuery.error.message}`);
		}
	}, [listBooksQuery.isError, listBooksQuery.error]);

	// Debounce search term
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const handler = setTimeout(() => {
			setCurrentPage(1); 
			listBooksQuery.refetch();
		}, 500);
		return () => clearTimeout(handler);
	}, [searchTerm]);

	// Refetch when currentPage changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		listBooksQuery.refetch();
	}, [currentPage]);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/admin/appointment-management">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
				<div>
					<h1 className="font-semibold text-xl md:text-2xl">
						Manage Library Books
					</h1>
					<p className="text-muted-foreground">
						Add, edit, or remove books available for reservation.
					</p>
				</div>
			</div>

			<div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
				<div className="relative w-full md:max-w-sm">
					 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input 
						placeholder="Search books by title, author, ISBN..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-8 w-full"
					/>
				</div>
				<Dialog open={isAddDialogOpen} onOpenChange={(open) => {setIsAddDialogOpen(open); if(!open) reset();}}>
					<DialogTrigger asChild>
				<Button className="w-full sm:w-auto">
							<PlusCircle className="mr-2 h-4 w-4" /> Add New Book
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Add New Book</DialogTitle>
							<DialogDescription>
								Fill in the details for the new book.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit(onSubmitAddBook)} className="space-y-4">
							<div>
								<Label htmlFor="isbn">ISBN</Label>
								<Controller
									name="isbn"
									control={control}
									render={({ field }) => <Input id="isbn" {...field} />}
								/>
								{errors.isbn && <p className="text-sm text-destructive">{errors.isbn.message}</p>}
							</div>
							<div>
								<Label htmlFor="title">Title</Label>
								<Controller
									name="title"
									control={control}
									render={({ field }) => <Input id="title" {...field} />}
								/>
								{errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
							</div>
							<div>
								<Label htmlFor="author">Author</Label>
								<Controller
									name="author"
									control={control}
									render={({ field }) => <Input id="author" {...field} />}
								/>
								{errors.author && <p className="text-sm text-destructive">{errors.author.message}</p>}
							</div>
							<div>
								<Label htmlFor="quantityInStock">Total Quantity In Stock</Label>
								<Controller
									name="quantityInStock"
									control={control}
									render={({ field }) => (
										<Input 
											id="quantityInStock" 
											type="number" 
											{...field} 
											onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
										/>
									)}
								/>
								{errors.quantityInStock && <p className="text-sm text-destructive">{errors.quantityInStock.message}</p>}
							</div>
							<DialogFooter>
								<DialogClose asChild>
									<Button type="button" variant="outline" onClick={() => reset()}>Cancel</Button>
								</DialogClose>
								<Button type="submit" disabled={createBookMutation.isPending}>
									{createBookMutation.isPending ? "Adding..." : "Add Book"}
				</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card className="mb-[80px]">
				<CardHeader>
					<CardTitle>Library Books ({listBooksQuery.isLoading ? '...' : totalBooks})</CardTitle>
				</CardHeader>
				<CardContent>
					{listBooksQuery.isLoading && <p className="text-center text-muted-foreground">Loading books...</p>}
					{!listBooksQuery.isLoading && books.length === 0 && (
						<p className="text-center text-muted-foreground">
							No books found. Add some to get started.
						</p>
					)}
					{!listBooksQuery.isLoading && books.length > 0 && (
						<ul className="space-y-3">
							{books.map((book) => (
								<li key={book.isbn} className="rounded-lg border p-4">
									<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between">
										<div className="flex-grow">
											<p className="font-medium text-lg">{book.title}</p>
											<p className="text-xs text-muted-foreground">Author: {book.author ?? "N/A"}</p>
											<p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
										</div>
										<div className="mt-2 flex w-full shrink-0 gap-2 sm:mt-0 sm:w-auto">
											<Button
												variant="outline"
												size="sm"
												className="flex-1 sm:flex-initial"
												onClick={() => handleOpenEditDialog(book)}
												disabled={updateBookMutation.isPending && editingBook?.isbn === book.isbn}
											>
												<Edit className="mr-1 h-3 w-3" /> Edit
											</Button>
											<Button
												variant="destructive"
												size="sm"
												className="flex-1 sm:flex-initial"
												onClick={() => handleOpenDeleteDialog(book)}
												disabled={deleteBookMutation.isPending && deletingBook?.isbn === book.isbn}
											>
												<Trash2 className="mr-1 h-3 w-3" /> Delete
											</Button>
										</div>
									</div>
									<div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 border-t pt-3 text-sm sm:grid-cols-2 md:grid-cols-3">
										<div>
											<Label className="text-muted-foreground text-xs">
												Total Stock
											</Label>
											<p>{book.quantityInStock}</p>
										</div>
										<div>
											<Label className="text-muted-foreground text-xs">
												Currently Available
											</Label>
											<p>{book.currentQuantity}</p>
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>

			{!listBooksQuery.isLoading && totalPages > 1 && (
				<div className="flex items-center justify-center space-x-2 py-4">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
						disabled={currentPage === 1 || listBooksQuery.isFetching}
					>
						Previous
					</Button>
					<span>
						Page {currentPage} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							setCurrentPage((prev) => Math.min(prev + 1, totalPages))
						}
						disabled={currentPage === totalPages || listBooksQuery.isFetching}
					>
						Next
					</Button>
				</div>
			)}

			{/* Edit Book Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { editReset(); setEditingBook(null); } }}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Edit Book</DialogTitle>
						<DialogDescription>
							Update the details for "{editingBook?.title}". ISBN cannot be changed.
						</DialogDescription>
					</DialogHeader>
					{editingBook && (
						<form onSubmit={handleEditSubmit(onSubmitEditBook)} className="space-y-4">
							<div>
								<Label htmlFor="edit-isbn">ISBN (Read-only)</Label>
								<Input id="edit-isbn" value={editingBook.isbn} readOnly className="mt-1 bg-muted/50" />
							</div>
							<div>
								<Label htmlFor="edit-title">Title</Label>
								<Controller
									name="title"
									control={editControl}
									render={({ field }) => <Input id="edit-title" {...field} className="mt-1" />}
								/>
								{editErrors.title && <p className="text-sm text-destructive">{editErrors.title.message}</p>}
							</div>
							<div>
								<Label htmlFor="edit-author">Author</Label>
								<Controller
									name="author"
									control={editControl}
									render={({ field }) => <Input id="edit-author" {...field} className="mt-1" />}
								/>
								{editErrors.author && <p className="text-sm text-destructive">{editErrors.author.message}</p>}
							</div>
							<div>
								<Label htmlFor="edit-quantityInStock">Total Quantity In Stock</Label>
								<Controller
									name="quantityInStock"
									control={editControl}
									render={({ field }) => (
										<Input 
											id="edit-quantityInStock" 
											type="number" 
											{...field} 
											className="mt-1"
											onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
										/>
									)}
								/>
								{editErrors.quantityInStock && <p className="text-sm text-destructive">{editErrors.quantityInStock.message}</p>}
							</div>
							<DialogFooter>
								<DialogClose asChild>
									<Button type="button" variant="outline" onClick={() => { editReset(); setEditingBook(null); setIsEditDialogOpen(false); }}>Cancel</Button>
								</DialogClose>
								<Button type="submit" disabled={updateBookMutation.isPending}>
									{updateBookMutation.isPending ? "Saving..." : "Save Changes"}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete Book Confirmation Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) setDeletingBook(null); }}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the book "{deletingBook?.title} (ISBN: {deletingBook?.isbn})".
							<br />
							<span className="font-semibold text-destructive">{deleteBookMutation.error?.message}</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeletingBook(null)}>Cancel</AlertDialogCancel>
						<AlertDialogAction 
							onClick={confirmDeleteBook} 
							disabled={deleteBookMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteBookMutation.isPending ? "Deleting..." : "Delete Book"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
