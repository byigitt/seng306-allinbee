import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, UserCircle } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              AIB
              <span className="sr-only">AllInBee</span>
            </Link>
            <Link
              href="/cafeteria"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              Cafeteria
            </Link>
            <Link
              href="/ring-tracking"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              Ring Tracking
            </Link>
            <Link
              href="/appointments"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              Appointments
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
        {title}
      </h1>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/profile">
          <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
            <UserCircle className="h-6 w-6" />
             <span className="sr-only">User Profile</span>
          </Button>
        </Link>
      </div>
    </header>
  );
} 