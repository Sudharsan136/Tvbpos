# TVB POS (Topi Vappa Biriyani POS)

A comprehensive, full-stack Restaurant Point of Sale (POS) and Billing System built using the MERN stack (MongoDB, Express, React, Node.js). 

## Features

- **Real-Time KOT (Kitchen Order Tickets):** Instant updates from the POS terminal to the kitchen.
- **Table Management:** Dynamic table mapping, status tracking (Available, Occupied), and admin configurations.
- **Billing & Payments:** Generate detailed invoices, calculate taxes, and process various payment methods.
- **Role-Based Access:** Admin and Cashier roles with secure authentication.
- **Dashboard & Analytics:** View sales data, order history, and restaurant performance.

## Tech Stack

- **Frontend:** React.js, Tailwind CSS (or Vanilla CSS based on configuration), Socket.io-client
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** MongoDB (Mongoose)

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Local instance or MongoDB Atlas URI)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sudharsan136/Tvbpos.git
   cd Tvbpos
   ```

2. **Install all dependencies:**
   This project uses a root `package.json` to manage both client and server dependencies.
   ```bash
   npm run build
   ```

3. **Environment Variables:**
   You will need to create `.env` files in both the `client` and `server` directories based on your local configuration.
   
   **Server (`server/.env`):**
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
   
   **Client (`client/.env`):**
   ```env
   VITE_API_URL=http://localhost:5000
   ```

### Running Locally

To start both the React frontend and the Node backend concurrently, run:

```bash
npm run dev
```

- The frontend will typically run on `http://localhost:5173`
- The backend will run on `http://localhost:5000`

## Production Build

To build the client and prepare the server for production deployment:

```bash
npm run build
npm start
```
