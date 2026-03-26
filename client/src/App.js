import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BookingForm from "./pages/BookingForm";
import Confirmation from "./pages/Confirmation";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100 text-slate-800">
        <Header />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/book/:itemName" element={<BookingForm />} />
            <Route path="/confirmation" element={<Confirmation />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;