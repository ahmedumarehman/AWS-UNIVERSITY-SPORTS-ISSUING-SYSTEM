import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Login from "./pages/Login";
import Mfa from "./pages/Mfa";
import Dashboard from "./pages/Dashboard";
import BookingForm from "./pages/BookingForm";
import Confirmation from "./pages/Confirmation";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Header />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Login />} />

            {/* MFA is available after password login but before app access. */}
            <Route path="/mfa" element={<Mfa />} />

            {/* Student and authenticated user routes require AAL2. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/book/:itemName" element={<BookingForm />} />
              <Route path="/confirmation" element={<Confirmation />} />
              <Route path="/my-bookings" element={<MyBookings />} />
            </Route>

            {/* Administrator routes require AAL2 and trusted admin metadata. */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
