import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

const formatTime = (value) => {
  if (!value) return "—";

  const [hourText, minute] = value.slice(0, 5).split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";

  return `${hour % 12 || 12}:${minute} ${suffix}`;
};

const formatBookedAt = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const statusStyles = {
  confirmed: "bg-emerald-50 text-emerald-700",
  issued: "bg-blue-50 text-blue-700",
  returned: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-50 text-red-700",
};

const MyBookings = () => {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchBookings = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) {
        setBookings([]);
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const { data, error: queryError } = await supabase
          .from("bookings")
          .select(
            `
          id,
          booking_date,
          booked_at,
          status,
          issued_at,
          returned_at,
          sports_item:sports_items(
            item_name,
            item_code,
            image_url
          ),
          time_slots(
            slot_name,
            start_time,
            end_time
          )
        `,
          )
          .eq("student_id", user.id)
          .order("booking_date", { ascending: false })
          .order("booked_at", { ascending: false });

        if (queryError) throw queryError;

        setBookings(data || []);
      } catch (err) {
        console.error("My bookings loading error:", err);
        setError(err.message || "Unable to load your bookings.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const cancelBooking = async (booking) => {
    const itemName = booking.sports_item?.item_name || "this sports item";

    const confirmed = window.confirm(
      `Are you sure you want to cancel your booking for ${itemName} on ${formatDate(booking.booking_date)}?`,
    );

    if (!confirmed) return;

    try {
      setCancellingId(booking.id);
      setError("");
      setSuccess("");

      const { error: cancelError } = await supabase.rpc(
        "student_cancel_sports_booking",
        {
          p_booking_id: booking.id,
        },
      );

      if (cancelError) throw cancelError;

      setSuccess("Your booking has been cancelled successfully.");
      await fetchBookings(true);
    } catch (err) {
      console.error("Booking cancellation error:", err);
      setError(err.message || "Unable to cancel this booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    if (activeFilter === "active") {
      return bookings.filter((booking) =>
        ["confirmed", "issued"].includes(booking.status),
      );
    }

    if (activeFilter === "history") {
      return bookings.filter((booking) =>
        ["returned", "cancelled"].includes(booking.status),
      );
    }

    return bookings;
  }, [bookings, activeFilter]);

  const activeCount = bookings.filter((booking) =>
    ["confirmed", "issued"].includes(booking.status),
  ).length;

  const confirmedCount = bookings.filter(
    (booking) => booking.status === "confirmed",
  ).length;

  if (loading) {
    return (
      <div className="page-container flex min-h-[60vh] items-center justify-center">
        <p className="text-sm font-medium text-slate-500">
          Loading your bookings...
        </p>
      </div>
    );
  }

  return (
    <div className="page-container py-8 sm:py-10">
      {/* PAGE HEADER */}

      <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="section-label">STUDENT ACCOUNT</p>

          <h1 className="page-heading mt-2">My Bookings</h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            View your sports reservations, check their schedules, and cancel
            bookings you no longer need.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fetchBookings(true)}
            disabled={refreshing}
            className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh bookings"}
          </button>

          <Link
            to="/dashboard"
            className="btn-primary inline-flex items-center justify-center"
          >
            Browse Sports Items
          </Link>
        </div>
      </section>

      {/* SUMMARY */}

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">Total Bookings</p>
          <p className="mt-2 text-3xl font-bold text-[#142b4a]">
            {bookings.length}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">Active Bookings</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {activeCount}
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Confirmed - Can Cancel
          </p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {confirmedCount}
          </p>
        </div>
      </section>

      {/* FEEDBACK */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* FILTERS */}

      <section>
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-[#142b4a]">
              Reservation History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your bookings and their current status.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All bookings" },
              { value: "active", label: "Active" },
              { value: "history", label: "History" },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter.value
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* BOOKINGS */}

        {filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h3 className="text-lg font-bold text-[#142b4a]">
              No bookings found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {activeFilter === "history"
                ? "Your returned or cancelled bookings will appear here."
                : "You have not made any bookings in this section yet."}
            </p>

            <Link
              to="/dashboard"
              className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Browse Sports Items
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const item = booking.sports_item;
              const slot = booking.time_slots;
              const canCancel = booking.status === "confirmed";

              return (
                <article
                  key={booking.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md md:flex-row"
                >
                  {/* IMAGE */}

                  <div className="h-48 shrink-0 bg-slate-100 md:h-auto md:min-h-[190px] md:w-56">
                    {item?.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.item_name || "Sports item"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-[190px] items-center justify-center text-sm text-slate-400">
                        No image available
                      </div>
                    )}
                  </div>

                  {/* DETAILS */}

                  <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-[#142b4a]">
                          {item?.item_name || "Sports item"}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                            statusStyles[booking.status] ||
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Item Code: {item?.item_code || "—"}
                      </p>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Booking Date
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {formatDate(booking.booking_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Time Slot
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {formatTime(slot?.start_time)} –{" "}
                            {formatTime(slot?.end_time)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {slot?.slot_name || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Booked On
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {formatBookedAt(booking.booked_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ACTION */}

                    <div className="flex shrink-0 flex-col gap-2 md:w-44">
                      {canCancel ? (
                        <button
                          type="button"
                          onClick={() => cancelBooking(booking)}
                          disabled={cancellingId === booking.id}
                          className="w-full rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancellingId === booking.id
                            ? "Cancelling..."
                            : "Cancel Booking"}
                        </button>
                      ) : (
                        <div className="rounded-lg bg-slate-50 px-4 py-3 text-center text-xs leading-5 text-slate-500">
                          {booking.status === "issued"
                            ? "Item issued. Please return it to the sports office."
                            : booking.status === "returned"
                              ? "This item has been returned."
                              : "This booking has been cancelled."}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyBookings;
