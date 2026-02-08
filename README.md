# Secure Online Banking System

This project is a secure online banking application that demonstrates robust authentication, fraud detection, and security best practices. It features a React frontend, a Node.js/Express backend, and a MongoDB database, all containerized using Docker.

## Tech Stack

This project utilizes a modern and secure technology stack:

### Frontend
*   **React**: A JavaScript library for building user interfaces.
*   **React Router**: For client-side routing.
*   **Axios**: For making HTTP requests to the backend.
*   **QRCode.react**: For rendering MFA QR codes.

### Backend
*   **Node.js & Express**: A fast and minimalist web framework for Node.js.
*   **MongoDB & Mongoose**: NoSQL database and object modeling.
*   **Security & Authentication**:
    *   `jsonwebtoken` (JWT): For secure stateless authentication.
    *   `bcryptjs`: For password hashing.
    *   `speakeasy` & `qrcode`: For Multi-Factor Authentication (MFA/TOTP).
    *   `csurf`: For Cross-Site Request Forgery (CSRF) protection.
    *   `helmet`: To set secure HTTP headers.
    *   `express-rate-limit`: To prevent brute-force attacks and abuse.

### DevOps
*   **Docker**: For containerizing the application services.
*   **Docker Compose**: For orchestrating the multi-container application.

## Features

*   **Secure User Authentication**: Registration and Login with bcrypt password hashing.
*   **Multi-Factor Authentication (MFA)**: TOTP-based 2FA using Google Authenticator or similar apps.
*   **Fraud Detection Engine**: Analyzes transactions/actions for suspicious patterns (e.g., rapid login failures).
*   **Security Hardening**: Implements rate limiting, secure headers, and CSRF protection.

## Prerequisites

*   **Docker Desktop**: Ensure Docker is installed and running on your machine.

## How to Run

The easiest way to run the entire application is using Docker Compose.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd SecureOnlineBanking
    ```

2.  **Start the application:**
    Run the following command in the root directory:
    ```bash
    docker-compose up --build
    ```
    This command will:
    *   Build the Docker images for the client and server.
    *   Start the MongoDB container.
    *   Start the Backend server on port `5000`.
    *   Start the Frontend client on port `3000`.

3.  **Access the Application:**
    Open your browser and navigate to:
    ```
    http://localhost:3000
    ```

4.  **Stop the Application:**
    Press `Ctrl+C` in the terminal to stop the containers, or run:
    ```bash
    docker-compose down
    ```

## Environment Variables

The `docker-compose.yml` file allows you to set environment variables. The default values used for development are:

**Backend:**
*   `PORT=5000`
*   `MONGODB_URI=mongodb://mongo:27017/securebooking`
*   `JWT_SECRET` (Change this in production!)
*   `MFA_ENCRYPTION_KEY`

**Frontend:**
*   `REACT_APP_API_URL=http://localhost:5000/api`

## Project Structure

*   `client/`: React frontend application.
*   `server/`: Node.js/Express backend API.
*   `docker-compose.yml`: Docker services configuration.