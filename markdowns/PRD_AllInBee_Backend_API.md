# Product Requirements Document: AllInBee - Backend API

**Version:** 1.0
**Date:** October 26, 2023
**Project:** AllInBee Backend Services

## 1. Introduction

### 1.1 Purpose
This document specifies the requirements for the AllInBee Backend API. The API will serve as the backbone for the AllInBee platform, providing data and services to the frontend mobile application webpage and potentially other clients. It will manage all data entities, business logic, and interactions as defined by the AllInBee Prisma schema (derived from SRS v1.3). The focus is on providing robust, secure, and well-defined CRUD (Create, Read, Update, Delete) operations and business logic endpoints.

### 1.2 Scope
The scope includes the design and specification of all API endpoints necessary to support the features of the AllInBee application: User Management, Cafeteria System, Ring Bus Tracking, and Appointment System. This includes defining request/response payloads, authentication/authorization mechanisms, and core business logic.

### 1.3 Goals
*   To provide a secure and reliable API for all AllInBee functionalities.
*   To ensure efficient data management and retrieval based on the Prisma schema.
*   To define clear API contracts for frontend consumption.
*   To implement necessary business logic and data validation rules at the API layer.
*   To support role-based access control for different user types (Student, Staff, Admin).

## 2. Overall Description

### 2.1 Product Perspective
The AllInBee Backend API is a server-side application that will expose RESTful (or tRPC, given your project structure) endpoints. It will interact directly with the PostgreSQL database via Prisma ORM. It will handle authentication (likely leveraging NextAuth session/token management) and enforce authorization rules.

### 2.2 Assumptions and Dependencies
*   The Prisma schema (as recently discussed and updated) is the source of truth for data structures.
*   NextAuth is used for authentication, and its session/token information will be used to identify and authorize users.
*   The backend will be built using a technology stack compatible with Next.js (likely Next.js API routes or a separate Node.js/Express server if tRPC is used more broadly).

## 3. Specific API Requirements (CRUD and Business Logic)

This section outlines the API endpoints. We'll group them by resource, aligning with your Prisma models. Standard CRUD operations are assumed unless specified otherwise. `(Auth: Role)` indicates the minimum role typically required.

### 3.1 Authentication (`/api/auth/...`)
*   Leverages NextAuth. Endpoints for login, logout, session management are provided by NextAuth.
*   **Endpoint:** `GET /api/auth/session` (or equivalent NextAuth mechanism)
    *   **Description:** Retrieve current user session and profile.
    *   **Response:** User object (including roles derived from Student/Admin/Staff relations).

### 3.2 User Resource (`/api/users`)
*   The `User` model is central, with linked `Student`, `Admin`, `Staff` profiles.
*   **Endpoint:** `GET /api/users/me`
    *   **Description:** Get the profile of the currently authenticated user (merged User, Student/Admin/Staff data).
    *   **Auth:** Authenticated User.
*   **Endpoint:** `PUT /api/users/me`
    *   **Description:** Update the authenticated user's profile (e.g., `phoneNumber`, `name`, potentially `passwordHash` if credentials provider is used).
    *   **Request Body:** Fields to update (e.g., `{ "phoneNumber": "...", "name": "..." }`).
    *   **Auth:** Authenticated User.
*   **Admin-Specific User Management (e.g., `/api/admin/users`):**
    *   `GET /api/admin/users`: List all users (Admin).
    *   `GET /api/admin/users/{userId}`: Get specific user details (Admin).
    *   `PUT /api/admin/users/{userId}`: Update user (e.g., assign roles by creating/updating Student/Admin/Staff entries) (Admin).
    *   `DELETE /api/admin/users/{userId}`: Delete user (Admin).

### 3.3 Cafeteria System Resources

*   **Dish (`/api/dishes`)**
    *   `POST /api/dishes` (Auth: Staff/Admin) - Create Dish (`DishName`, `Calories`).
    *   `GET /api/dishes` (Auth: Authenticated User) - List all dishes.
    *   `GET /api/dishes/{dishId}` (Auth: Authenticated User) - Get specific dish.
    *   `PUT /api/dishes/{dishId}` (Auth: Staff/Admin) - Update Dish.
    *   `DELETE /api/dishes/{dishId}` (Auth: Staff/Admin) - Delete Dish.
*   **Menu (`/api/menus`)**
    *   `POST /api/menus` (Auth: Staff/Admin) - Create Menu (`MenuOfferingName`, `Price`, `MenuDate`, link to `Dish` items via `MenuDish`).
    *   `GET /api/menus` (Auth: Authenticated User) - List menus (filterable by date).
    *   `GET /api/menus/{menuId}` (Auth: Authenticated User) - Get specific menu.
    *   `PUT /api/menus/{menuId}` (Auth: Staff/Admin) - Update Menu.
    *   `DELETE /api/menus/{menuId}` (Auth: Staff/Admin) - Delete Menu.
    *   **Business Logic:** Ensure `managedByStaffId` is correctly linked.
*   **DigitalCard (`/api/digitalcards`)**
    *   `GET /api/digitalcards/me` (Auth: Student) - Get logged-in student's digital card details (`Balance`, `Card_CreationDate`).
    *   `POST /api/digitalcards/me/deposits` (Auth: Student) - Record a deposit transaction.
        *   **Request Body:** `{ "amount": ... }`.
        *   **Business Logic:** Triggered after successful external payment. Updates `Balance`. Creates `DepositTransaction`.
    *   `GET /api/digitalcards/me/transactions` (Auth: Student) - Get deposit and purchase history for the student.
*   **QRCode (`/api/qrcodes`)**
    *   `POST /api/qrcodes/generate` (Auth: Student) - Generate a QR code for payment.
        *   **Request Body:** `{ "menuId": ... }` (optional, if for a specific menu).
        *   **Response:** QR code data (ID, expiry, etc.).
        *   **Business Logic:** Links QR to `DigitalCard.userId`, sets `Expired_Date`, `RemainingTime`.
    *   `POST /api/qrcodes/pay` (Auth: Staff - at POS)
        *   **Request Body:** `{ "qrId": ..., "menuId": ... }`.
        *   **Response:** Payment success/failure.
        *   **Business Logic:**
            1.  Validate QR code (not expired, exists).
            2.  Verify `DigitalCard.Balance` >= `Menu.Price`.
            3.  Deduct `Menu.Price` from `DigitalCard.Balance`.
            4.  Link `QRCode` to `Menu` (if not already).
            5.  Create/Update `Sale` record for the `Menu`.
            6.  All database operations must be atomic.
*   **Sales (`/api/sales`)**
    *   `GET /api/sales` (Auth: Staff/Admin) - Get sales data (filterable by date, menu).
    *   **Note:** Sales records are primarily created/updated via the QR payment process. The `v_Daily_Revenue` view will be useful for reporting.

### 3.4 Ring Tracking System Resources

*   **Route (`/api/routes`)**
    *   Standard CRUD for `Route` (Auth: Staff/Admin for CUD, Authenticated User for R).
    *   Include `RouteDepartureTime` and `RouteStation` relations in responses/requests.
*   **Station (`/api/stations`)**
    *   Standard CRUD for `Station` (Auth: Staff/Admin for CUD, Authenticated User for R).
*   **Bus (`/api/buses`)**
    *   `POST /api/buses/{vehicleId}/location` (Auth: System/Secure Service) - Update bus live location.
        *   **Request Body:** `{ "latitude": ..., "longitude": ..., "timestamp": ... }`.
    *   `GET /api/buses/live` (Auth: Authenticated User) - Get live locations of all active buses.
    *   `GET /api/buses/{vehicleId}/eta` (Auth: Authenticated User) - Calculate ETA for a bus to specified stations on its route.
        *   **Query Params:** `stationId` (can be multiple).
        *   **Business Logic:** Complex ETA calculation based on current location, route, station order, and potentially historical data/traffic.
*   **UserFavoriteRoute (`/api/users/me/favoriteroutes`)**
    *   `POST /api/users/me/favoriteroutes` (Auth: Student/User) - Add a route to favorites.
        *   **Request Body:** `{ "routeId": ... }`.
    *   `GET /api/users/me/favoriteroutes` (Auth: Student/User) - List favorite routes.
    *   `DELETE /api/users/me/favoriteroutes/{routeId}` (Auth: Student/User) - Remove route from favorites.

### 3.5 Appointment System Resources

*   **Appointment (`/api/appointments`)**
    *   `POST /api/appointments` (Auth: Student) - Book an appointment.
        *   **Request Body:** `{ "appointmentType": "Book" | "Sport" | "Health", "appointmentDate": ..., "startTime": ..., "endTime": ..., "serviceSpecificDetails": { ... } }` (e.g., `isbn` for Book, `sportType` for Sport).
        *   **Business Logic:**
            1.  Check for conflicting appointments for the student and resource.
            2.  Create `Appointment` record and appropriate subtype record (`BookAppointment`, `SportAppointment`, `HealthAppointment`).
            3.  Link to `takenByStudentId` and infer `managedByStaffId` based on service if applicable.
            4.  If `BookAppointment`, update `Book.currentQuantity`.
    *   `GET /api/appointments/me` (Auth: Student) - List student's appointments.
    *   `GET /api/appointments/availability` (Auth: Student) - Get available slots.
        *   **Query Params:** `serviceType`, `date`, `staffId` (optional).
    *   `PUT /api/appointments/{appointmentId}` (Auth: Student, Staff/Admin for status changes) - Update appointment (e.g., cancel, reschedule - complex).
        *   **Request Body:** `{ "status": "Cancelled", ... }`.
    *   `DELETE /api/appointments/{appointmentId}` (Auth: Student, Staff/Admin) - Cancel/Delete.
*   **Book (`/api/books`)**
    *   Standard CRUD for `Book` (Auth: Staff/Admin for CUD, Authenticated User for R).

## 4. Non-Functional Requirements
*   **NFR-API-SEC-1 (Authentication):** All endpoints (except potentially public data like general menu lists, if decided) must require authentication.
*   **NFR-API-SEC-2 (Authorization):** Role-based access control must be enforced for all operations.
*   **NFR-API-SEC-3 (Input Validation):** All incoming data must be validated (type, format, required fields).
*   **NFR-API-PERF-1 (Response Times):** Aim for API response times under 500ms for typical requests under normal load.
*   **NFR-API-ERR-1 (Error Handling):** Consistent error response formats (e.g., status codes, error messages).
*   **NFR-API-LOG-1 (Logging):** Comprehensive logging for requests, errors, and significant events.