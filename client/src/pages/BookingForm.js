import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const BookingForm = () => {
  const { itemName } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    rollNumber: "",
    email: localStorage.getItem("userEmail") || "",
    contactNumber: "",
    itemName: itemName,
    timeSlot: "",
  });
  const [error, setError] = useState("");
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      const res = await axios.get("http://3.231.204.101:5001/api/items");
      const currentItem = res.data.find(i => i.name === itemName);
      setItem(currentItem);
    };
    fetchItems();
  }, [itemName]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await axios.post("http://3.231.204.101:5001/api/bookings", formData);
      navigate("/confirmation");
    } catch (err) {
      setError(err?.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!item) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <p className="text-sm font-medium text-slate-500">Loading booking form...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl">
      <h2 className="mb-2 text-center text-3xl font-extrabold text-slate-900">Book {itemName}</h2>
      <p className="mb-6 text-center text-sm text-slate-500">Complete details and choose your preferred available timing.</p>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="fullName">
              Full Name
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              id="fullName"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="rollNumber">
              Roll Number
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              id="rollNumber"
              type="text"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm text-slate-600 shadow-sm"
            id="email"
            type="email"
            name="email"
            value={formData.email}
            readOnly
          />
        </div>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="contactNumber">
            Contact Number
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            id="contactNumber"
            type="text"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="timeSlot">
            Time Slot
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            id="timeSlot"
            name="timeSlot"
            value={formData.timeSlot}
            onChange={handleChange}
            required
          >
            <option value="">Select a time slot</option>
            {item.availableTimeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}
        <div className="flex items-center justify-center">
          <button
            className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-cyan-600 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Booking"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;