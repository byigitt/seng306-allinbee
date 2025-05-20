# AllInBee - Campus Management System

`seng306-allinbee` is a comprehensive campus management system designed to streamline various aspects of university life. It provides features for students, staff, and administrators, covering academic, financial, and transportation services.

## Features

The system is modular and includes the following key components:

*   **User Management:**
    *   Secure registration, login, and profile management.
    *   Separate roles and interfaces for Students, Staff, and Administrators.
    *   Authentication and authorization using NextAuth.js.
*   **Appointments:**
    *   Booking system for different types of appointments:
        *   Library Book Borrows (including management of book inventory by admins).
        *   Sports Facility Bookings.
        *   Health Service Appointments.
    *   Users can view their own appointments.
    *   Admins can manage all appointments.
*   **Cafeteria Services:**
    *   Students can view daily menus.
    *   Digital Wallet for students (view balance, add funds, view transaction history).
    *   QR Code based payment system for students.
    *   Staff/Admin can manage Dishes, Menus, and view Sales reports.
*   **Ring (Bus) Tracking:**
    *   Real-time GPS tracking of university ring buses and display on a live map.
    *   Calculation and display of Estimated Time of Arrival (ETA) for buses at selected stations.
    *   Users can save and manage Favorite Routes.
    *   Admin can manage Bus Routes and Stations.
*   **Admin Portal:**
    *   Dedicated sections for managing all aspects of the system:
        *   User Management (Students, Staff, Admins).
        *   Appointment Management (view all appointments, manage bookable services like library books).
        *   Cafeteria Management (Dishes, Menus, Sales Analytics).
        *   Ring Tracking Management (Routes, Stations, Buses).
        *   System Analytics dashboard.

## Technology Stack

This project is built with the T3 Stack and other modern technologies:

*   **Framework:** [Next.js](https://nextjs.org) (v15+)
*   **Authentication:** [NextAuth.js](https://next-auth.js.org) (v5+)
*   **ORM:** [Prisma](https://prisma.io)
*   **Database:** PostgreSQL
*   **Styling:** [Tailwind CSS](https://tailwindcss.com)
*   **API & Typesafety:** [tRPC](https://trpc.io)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (using Radix UI primitives)
*   **Package Manager:** [pnpm](https://pnpm.io/)

## Getting Started

### Prerequisites

*   Node.js (version recommended by Next.js, e.g., v18.17 or later)
*   pnpm (version specified in `package.json` or latest)
*   Docker (for running PostgreSQL, if using the provided `start-database.sh`)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/byigitt/seng306-allinbee.git
    cd seng306-allinbee
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Copy the `.env.example` file to a new file named `.env` and update the variables as needed, especially the `DATABASE_URL`.
    ```bash
    cp .env.example .env
    ```
    Example `DATABASE_URL` for local PostgreSQL:
    `DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"`

4.  **Start the database:**
    If you have Docker installed, you can use the provided script to start a PostgreSQL container:
    ```bash
    ./start-database.sh
    ```
    Alternatively, ensure you have a PostgreSQL instance running and accessible.

5.  **Apply database migrations:**
    This will create the database schema based on `prisma/schema.prisma`.
    ```bash
    pnpm db:push
    ```
    Or, to create and apply a new migration if you've changed the schema:
    ```bash
    pnpm db:generate
    ```
    (Note: `pnpm db:generate` in `package.json` actually runs `prisma migrate dev`. `pnpm db:push` is suitable for prototyping and initial setup without generating migration files, while `prisma migrate dev` is better for evolving the schema with migration history.)

6.  **(Optional) Seed the database:**
    If a seed script is available (e.g., `prisma/seed.ts`), you can populate the database with initial data:
    ```bash
    pnpm db:seed
    ```

### Running the Development Server

```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Key Project Structure

*   `src/app/`: Main application code, following Next.js App Router structure.
    *   `src/app/(app)/`: Routes for authenticated regular users (students, staff).
    *   `src/app/admin/`: Routes for the admin portal.
    *   `src/app/api/`: API routes, including NextAuth and tRPC.
    *   `src/app/auth/`: Authentication-related pages (login, register).
    *   `src/app/_components/`: Project-specific reusable UI components (e.g., common layouts, navigation). Feature-specific components may reside within their respective feature directories (e.g., `src/app/(app)/ring-tracking/_components/`).
*   `src/components/ui/`: UI components generated by Shadcn UI (typically not manually edited).
*   `src/lib/`: Utility functions and libraries.
*   `src/server/`: Server-side logic, including tRPC routers and auth configuration.
*   `prisma/`: Prisma schema (`schema.prisma`), migrations, and seed scripts.
*   `public/`: Static assets.

## Learn More about the T3 Stack

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

-   [Documentation](https://create.t3.gg/)
-   [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow the deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information. Ensure your production environment has the necessary environment variables set.