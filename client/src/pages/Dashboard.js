import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminNotice, setAdminNotice] = useState("");
  const [adminRefreshing, setAdminRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("all");

  const fetchDashboardData = useCallback(async (showGlobalLoader = false) => {
    if (showGlobalLoader) {
      setLoading(true);
    } else {
      setAdminRefreshing(true);
    }

    setError("");
    setAdminError("");

    const [itemsResult, bookingsResult] = await Promise.allSettled([
      axios.get("http://3.231.204.101:5001/api/items"),
      axios.get("http://3.231.204.101:5001/api/bookings"),
    ]);

    if (itemsResult.status === "fulfilled") {
      setItems(itemsResult.value.data || []);
    } else {
      setError("Unable to load sports items. Please refresh the page.");
    }

    if (bookingsResult.status === "fulfilled") {
      setBookings(Array.isArray(bookingsResult.value.data) ? bookingsResult.value.data : []);
    } else {
      setAdminError("Admin metrics are temporarily unavailable.");
    }

    setLastRefreshedAt(new Date());

    setLoading(false);
    setAdminRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!adminNotice) {
      return undefined;
    }

    const noticeTimer = setTimeout(() => {
      setAdminNotice("");
    }, 2500);

    return () => clearTimeout(noticeTimer);
  }, [adminNotice]);

  useEffect(() => {
    if (!adminError) {
      return undefined;
    }

    const errorTimer = setTimeout(() => {
      setAdminError("");
    }, 3500);

    return () => clearTimeout(errorTimer);
  }, [adminError]);

  const allSlots = [...new Set(items.flatMap((item) => item.availableTimeSlots || []))];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
    const matchesSlot = selectedSlot === "all" || item.availableTimeSlots.includes(selectedSlot);
    return matchesSearch && matchesSlot;
  });

  const totalSlots = items.reduce((sum, item) => sum + item.availableTimeSlots.length, 0);
  const isToday = (dateValue) => {
    const date = new Date(dateValue);
    const today = new Date();

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const todaysBookingsCount = bookings.filter((booking) => isToday(booking.bookingTime)).length;
  const lateReturnsCount = bookings.filter((booking) => booking.returnStatus === "Late").length;
  const recentBookings = [...bookings]
    .filter((booking) => booking.bookingTime)
    .sort((firstBooking, secondBooking) => new Date(secondBooking.bookingTime) - new Date(firstBooking.bookingTime))
    .slice(0, 5);

  const formatBookingDate = (dateValue) => {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString();
  };

  const formattedLastRefreshTime = lastRefreshedAt
    ? lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";

  const statusBadgeClassName = (status) => {
    if (status === "Late") {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }

    if (status === "Returned") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }

    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  const escapeCsvValue = (value) => {
    const rawValue = value ?? "";
    const stringValue = String(rawValue).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const buildBookingsCsv = (bookingsToExport) => {
    const header = [
      "ID",
      "Full Name",
      "Roll Number",
      "Email",
      "Contact Number",
      "Item",
      "Time Slot",
      "Booking Time",
      "Return Status",
      "Return Time",
    ];

    const rows = bookingsToExport.map((booking) => [
      booking.id,
      booking.fullName,
      booking.rollNumber,
      booking.email,
      booking.contactNumber,
      booking.itemName,
      booking.timeSlot,
      booking.bookingTime,
      booking.returnStatus || "Booked",
      booking.returnTime || "",
    ]);

    return [header, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
      .join("\n");
  };

  const downloadCsvFile = (fileName, bookingsToExport) => {
    if (!bookingsToExport.length) {
      setAdminError("No bookings available to export.");
      return;
    }

    const csvContent = buildBookingsCsv(bookingsToExport);
    const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const csvUrl = URL.createObjectURL(csvBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = csvUrl;
    downloadLink.setAttribute("download", fileName);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(csvUrl);
    setAdminNotice("CSV exported successfully.");
  };

  const handleMarkReturned = async (bookingId) => {
    try {
      setUpdatingBookingId(bookingId);
      setAdminError("");
      setAdminNotice("");

      await axios.patch(`http://3.231.204.101:5001/api/bookings/${bookingId}/return`);

      setBookings((previousBookings) =>
        previousBookings.map((booking) =>
          String(booking.id) === String(bookingId)
            ? {
                ...booking,
                returnStatus: "Returned",
                returnTime: new Date().toISOString(),
              }
            : booking
        )
      );

      setAdminNotice("Booking marked as Returned successfully.");
    } catch (requestError) {
      setAdminError(requestError?.response?.data?.message || "Failed to mark booking as Returned.");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
        <p className="text-sm font-medium text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-md">
        <p className="text-sm font-semibold text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div aria-live="polite" className="pointer-events-none fixed right-5 top-20 z-50 flex w-full max-w-sm flex-col gap-3">
        {adminNotice && (
          <div className="pointer-events-auto flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition-all duration-300">
            <p>{adminNotice}</p>
            <button
              type="button"
              onClick={() => setAdminNotice("")}
              className="rounded px-1 text-emerald-700 transition-colors hover:bg-emerald-100"
              aria-label="Close success message"
            >
              ×
            </button>
          </div>
        )}

        {adminError && (
          <div className="pointer-events-auto flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-lg transition-all duration-300">
            <p>{adminError}</p>
            <button
              type="button"
              onClick={() => setAdminError("")}
              className="rounded px-1 text-red-700 transition-colors hover:bg-red-100"
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-900 p-6 text-white shadow-xl">
        <h2 className="text-3xl font-extrabold tracking-tight">Sports Booking Dashboard</h2>
        <p className="mt-1 text-sm text-blue-100">View items, explore available timings, and book in one click.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Items</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{items.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Slots</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{totalSlots}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Matching Items</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{filteredItems.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-5 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-indigo-900">Quick Admin Panel</h3>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-md bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Last refreshed: {formattedLastRefreshTime}
            </span>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">Live</span>
            <button
              type="button"
              onClick={() => downloadCsvFile("recent-bookings.csv", recentBookings)}
              className="rounded-md border border-indigo-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              Export Recent CSV
            </button>
            <button
              type="button"
              onClick={() => downloadCsvFile("all-bookings.csv", bookings)}
              className="rounded-md border border-indigo-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              Export All CSV
            </button>
            <button
              type="button"
              onClick={() => fetchDashboardData(false)}
              disabled={adminRefreshing || loading}
              className="rounded-md border border-indigo-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {adminRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today's Bookings</p>
            <p className="mt-2 text-3xl font-extrabold text-indigo-700">{todaysBookingsCount}</p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Late Returns</p>
            <p className="mt-2 text-3xl font-extrabold text-amber-600">{lateReturnsCount}</p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm">
          <div className="border-b border-indigo-100 bg-indigo-50/70 px-4 py-3">
            <h4 className="text-sm font-bold uppercase tracking-wide text-indigo-900">Recent 5 Bookings</h4>
          </div>

          {recentBookings.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Slot</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Booked At</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="transition-colors hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-700">{booking.fullName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{booking.itemName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{booking.timeSlot}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{formatBookingDate(booking.bookingTime)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClassName(
                            booking.returnStatus
                          )}`}
                        >
                          {booking.returnStatus || "Booked"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <button
                          type="button"
                          onClick={() => handleMarkReturned(booking.id)}
                          disabled={booking.returnStatus === "Returned" || updatingBookingId === booking.id}
                          className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-all duration-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                        >
                          {updatingBookingId === booking.id ? "Updating..." : booking.returnStatus === "Returned" ? "Returned" : "Mark Returned"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-4 text-sm font-medium text-slate-500">No bookings found yet.</p>
          )}
        </div>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search by item</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sports item..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Filter by slot</label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All slots</option>
              {allSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => (
          <article
            key={item.name}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <h3 className="text-xl font-bold text-slate-800 transition-colors group-hover:text-blue-700">{item.name}</h3>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Available</span>
            </div>

            <p className="mb-3 text-sm font-semibold text-slate-600">Available Timings</p>
            <div className="mb-6 flex flex-wrap gap-2">
              {item.availableTimeSlots.map((slot) => (
                <span
                  key={slot}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition-colors duration-200 group-hover:bg-blue-100"
                >
                  {slot}
                </span>
              ))}
            </div>

            <Link
              to={`/book/${item.name}`}
              className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-cyan-600 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Book Now
            </Link>
          </article>
        ))}
      </div>

      {!filteredItems.length && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">No items match your current search/filter.</p>
        </div>
      )}
    </section>
  );
};

export default Dashboard;