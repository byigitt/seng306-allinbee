# Product Requirements Document: AllInBee - Frontend Web Application

**Version:** 1.0
**Date:** October 26, 2023
**Project:** AllInBee Frontend Mobile Application Webpage

## 1. Introduction

### 1.1 Purpose
This document specifies the product requirements for the AllInBee Frontend Web Application. This application will serve as the primary user interface for Çankaya University students and staff to access AllInBee services. It will be a web application designed with a mobile-first approach, providing a user experience akin to a native mobile app but accessible via a web browser.

### 1.2 Scope
The scope includes the design and development of all user-facing features, including User Management, Cafeteria System, Ring Bus Tracking, and Appointment System. The frontend will consume the AllInBee Backend API for all data display and manipulation.

### 1.3 Goals
*   To provide an intuitive, responsive, and accessible user interface for all AllInBee services.
*   To deliver a seamless user experience that feels like a mobile application.
*   To accurately display data retrieved from the backend API.
*   To enable users to perform all intended actions (e.g., payments, bookings, tracking) efficiently.

## 2. Overall Description

### 2.1 Product Perspective
The AllInBee Frontend is a client-side web application, likely built with Next.js/React. It will make asynchronous requests to the AllInBee Backend API to fetch and submit data. It will manage client-side state, user sessions (via NextAuth), and render the UI dynamically. The design will prioritize a mobile viewport but should be responsive enough to be usable on larger screens if accessed.

### 2.2 Assumptions and Dependencies
*   The AllInBee Backend API is available and provides the necessary endpoints as specified in its PRD.
*   UI/UX designs (wireframes, mockups, style guides) for the application are available or will be developed.
*   The application will be accessible via modern web browsers on various devices.

## 3. Specific Frontend Features

### 3.1 Core UI/UX Features
*   **FR-FE-CORE-1 (Mobile-First Layout):** The primary layout should be optimized for mobile screen sizes.
*   **FR-FE-CORE-2 (Responsive Design):** While mobile-first, the application should adapt gracefully to tablet or small desktop viewports if accessed.
*   **FR-FE-CORE-3 (Navigation):** Implement intuitive navigation, likely using a bottom tab bar for main sections and header navigation for contextual actions (back, profile).
*   **FR-FE-CORE-4 (User Feedback):** Provide clear visual feedback for user actions (loading states, success messages, error notifications).
*   **FR-FE-CORE-5 (Forms):** All forms for data input (login, registration, search, booking details) should be user-friendly and include client-side validation where appropriate.

### 3.2 User Management (Consumes `/api/auth/...`, `/api/users/...`)
*   **FR-FE-UM-1 (Registration):** Allow new users (students/staff) to register.
    *   UI: Form for FName, LName, Email, Password, Phone Number.
    *   API: Calls registration endpoint on backend.
*   **FR-FE-UM-2 (Login):** Allow existing users to log in.
    *   UI: Form for Email, Password.
    *   API: Uses NextAuth for authentication.
*   **FR-FE-UM-3 (Profile Management):**
    *   UI: Display user's profile information (Name, Email, Phone Number, Role). Allow editing of mutable fields.
    *   API: `GET /api/users/me`, `PUT /api/users/me`.
*   **FR-FE-UM-4 (Logout):** Provide a clear logout mechanism.
    *   API: Uses NextAuth.

### 3.3 Cafeteria System (Consumes `/api/menus`, `/api/dishes`, `/api/digitalcards`, `/api/qrcodes`)
*   **FR-FE-CS-1 (View Daily Menu):**
    *   UI: Display list of menu offerings for the current day (or selected date), including dish names, prices, calories.
    *   API: `GET /api/menus` (filtered by date), `GET /api/dishes/{dishId}` (if details needed).
*   **FR-FE-CS-2 (Digital Wallet):**
    *   UI: Display student's current `DigitalCard.Balance`. Options to "Add Funds" and "View Transactions."
    *   API: `GET /api/digitalcards/me`.
*   **FR-FE-CS-3 (Add Funds - UI Flow):**
    *   UI: Interface to initiate adding funds (e.g., select amount). This will likely redirect to/integrate with an external payment gateway. The UI should handle the flow back from the payment gateway.
    *   API: On successful external payment, the frontend informs the backend which then calls `POST /api/digitalcards/me/deposits`.
*   **FR-FE-CS-4 (View Transaction History):**
    *   UI: Display a list of past deposit and purchase transactions.
    *   API: `GET /api/digitalcards/me/transactions`.
*   **FR-FE-CS-5 (QR Code Payment):**
    *   UI:
        1.  User selects items to purchase from the menu.
        2.  Button to "Generate Payment QR Code."
        3.  Display generated QR code clearly on screen for scanning by staff.
    *   API: `POST /api/qrcodes/generate` (potentially with menu items if pre-selected).
*   **FR-FE-CS-6 (Staff: Manage Dishes & Menus - Admin Panel section):**
    *   UI: Forms for creating, updating, deleting Dishes and Menus.
    *   API: CRUD endpoints for `/api/dishes`, `/api/menus`.
*   **FR-FE-CS-7 (Staff: View Sales - Admin Panel section):**
    *   UI: Display sales reports.
    *   API: `GET /api/sales`.

### 3.4 Ring Tracking System (Consumes `/api/routes`, `/api/stations`, `/api/buses`, `/api/users/me/favoriteroutes`)
*   **FR-FE-RT-1 (Live Map View):**
    *   UI: Display an interactive map showing bus routes, station locations, and real-time bus positions.
    *   API: `GET /api/routes`, `GET /api/stations`, `GET /api/buses/live`.
*   **FR-FE-RT-2 (View ETAs):**
    *   UI: Allow users to select a bus or station to see ETAs.
    *   API: `GET /api/buses/{vehicleId}/eta`.
*   **FR-FE-RT-3 (Search/Find Nearest Station):**
    *   UI: Allow users to find the nearest station based on their current location (if permission given).
*   **FR-FE-RT-4 (Manage Favorite Routes):**
    *   UI: Allow users to view, add, and remove favorite routes.
    *   API: CRUD for `/api/users/me/favoriteroutes`.
*   **FR-FE-RT-5 (Staff: Manage Routes & Stations - Admin Panel section):**
    *   UI: Forms for creating, updating, deleting Routes and Stations.
    *   API: CRUD endpoints for `/api/routes`, `/api/stations`.

### 3.5 Appointment System (Consumes `/api/appointments`, `/api/books`)
*   **FR-FE-AS-1 (Browse Appointment Services):**
    *   UI: Display available services for booking (Sports, Health, Library Books).
*   **FR-FE-AS-2 (View Availability & Book):**
    *   UI: For a selected service, display a calendar/timeslot picker showing available slots. Allow users to select a slot and fill in necessary details.
    *   API: `GET /api/appointments/availability`, `POST /api/appointments`.
*   **FR-FE-AS-3 (View My Appointments):**
    *   UI: List the student's upcoming and past appointments. Allow cancellation.
    *   API: `GET /api/appointments/me`, `PUT /api/appointments/{appointmentId}` (for cancellation).
*   **FR-FE-AS-4 (Staff: Manage Appointments - Admin Panel section):**
    *   UI: Interface for staff to view and manage appointments related to their service.
    *   API: `GET /api/appointments` (filtered by staff/service), `PUT /api/appointments/{appointmentId}` (for status updates).
*   **FR-FE-AS-5 (Staff: Manage Books - Admin Panel section):**
    *   UI: Interface for staff to manage library books.
    *   API: CRUD for `/api/books`.

## 4. Non-Functional Requirements
*   **NFR-FE-PERF-1 (Page Load Speed):** Key pages should load within 2-3 seconds on a decent connection. Optimize assets.
*   **NFR-FE-PERF-2 (UI Responsiveness):** Interactions within the UI should be smooth without noticeable lag.
*   **NFR-FE-USAB-1 (Intuitiveness):** The application flow should be easy to understand and use for the target audience.
*   **NFR-FE-ACC-1 (Accessibility):** Adhere to WCAG 2.1 Level AA guidelines where feasible.
*   **NFR-FE-SEC-1 (Secure API Communication):** All communication with the backend API must use HTTPS. Client-side handling of sensitive data (like tokens) must be secure.
*   **NFR-FE-COMPAT-1 (Browser Compatibility):** Support latest versions of major browsers (Chrome, Firefox, Safari, Edge).