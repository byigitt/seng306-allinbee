import { MoreHorizontal, PlusCircle, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: string;
  name: string;
  email: string;
  role: "Student" | "Admin" | "Cafeteria Staff" | "Lecturer" | "Staff";
  status: "Active" | "Inactive" | "Suspended";
  joinedDate: string;
  avatar?: string;
};

const mockUsers: User[] = [
  { id: "usr_001", name: "Alice Wonderland", email: "alice@example.com", role: "Student", status: "Active", joinedDate: "2023-01-15", avatar: "/placeholders/avatar-mock.png" },
  { id: "usr_002", name: "Bob The Builder", email: "bob@example.com", role: "Admin", status: "Active", joinedDate: "2022-11-20" },
  { id: "usr_003", name: "Charlie Brown", email: "charlie@example.com", role: "Cafeteria Staff", status: "Inactive", joinedDate: "2023-03-01" },
  { id: "usr_004", name: "Diana Prince", email: "diana@example.com", role: "Lecturer", status: "Active", joinedDate: "2021-08-10", avatar: "/placeholders/avatar-mock.png" },
  { id: "usr_005", name: "Edward Scissorhands", email: "edward@example.com", role: "Student", status: "Suspended", joinedDate: "2023-05-05" },
  { id: "usr_006", name: "Fiona Gallagher", email: "fiona@example.com", role: "Staff", status: "Active", joinedDate: "2022-07-11" },
];

export default function AdminUserManagementPage() {
  // Placeholder states and handlers for filters and search
  // const [searchTerm, setSearchTerm] = React.useState("");
  // const [roleFilter, setRoleFilter] = React.useState("all");
  // const [statusFilter, setStatusFilter] = React.useState("all");

  // const filteredUsers = mockUsers.filter(user => {
  //   return (
  //     (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //      user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
  //     (roleFilter === "all" || user.role === roleFilter) &&
  //     (statusFilter === "all" || user.status === statusFilter)
  //   );
  // });

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold md:text-3xl">User Management</h1>
        <Button size="sm" variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New User (Placeholder)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View, manage, and filter all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
                // value={searchTerm}
                // onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select
                // value={roleFilter}
                // onValueChange={setRoleFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Cafeteria Staff">Cafeteria Staff</SelectItem>
                  <SelectItem value="Lecturer">Lecturer</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <Select
                // value={statusFilter}
                // onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                   <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Avatar</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Joined Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="hidden sm:table-cell">
                    {user.avatar ? (
                        <img
                            alt="User avatar"
                            className="aspect-square rounded-full object-cover"
                            height="40"
                            src={user.avatar}
                            width="40"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "Admin" ? "destructive" : "secondary"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        user.status === "Active" ? "default" : 
                        user.status === "Suspended" ? "destructive" : "outline"
                      }
                      className={user.status === "Active" ? "bg-green-500 text-white" : ""}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{user.joinedDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details (Placeholder)</DropdownMenuItem>
                        <DropdownMenuItem>Edit User (Placeholder)</DropdownMenuItem>
                        <DropdownMenuItem>Change Role (Placeholder)</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          {user.status === "Active" ? "Deactivate" : 
                           user.status === "Inactive" ? "Activate" : "Unsuspend"} (Placeholder)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        {/* <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-5</strong> of <strong>{mockUsers.length}</strong> users
          </div>
        </CardFooter> */}
      </Card>
    </div>
  );
} 