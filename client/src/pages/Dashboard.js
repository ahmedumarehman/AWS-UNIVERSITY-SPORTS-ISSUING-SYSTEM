import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// Get today's date using Pakistan Standard Time.
const getTodayDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
};

// Format date as DD/MM/YYYY.
const formatDate = (date) => {
  if (!date) return "Date not configured";

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

// Format time as 12-hour clock.
const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";

  return `${hour % 12 || 12}:${minutes} ${suffix}`;
};

// Format booking creation time.
const formatBookingTime = (dateTime) => {
  if (!dateTime) return "Time unavailable";

  const parsed = new Date(dateTime);

  if (Number.isNaN(parsed.getTime())) {
    return "Time unavailable";
  }

  return parsed.toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Check whether a schedule has ended.
const isSlotStillAvailableByTime = (slot) => {
  if (!slot.slot_date || !slot.end_time) {
    return false;
  }

  const endDateTime = new Date(`${slot.slot_date}T${slot.end_time}+05:00`);

  return !Number.isNaN(endDateTime.getTime()) && endDateTime > new Date();
};

const Dashboard = () => {
  const { isAdmin } = useAuth();

  const [items, setItems] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [windowSlots, setWindowSlots] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Fetch sports items, schedule assignments, time slots and bookings.
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [itemsResult, schedulesResult, slotsResult] = await Promise.all([
        supabase
          .from("sports_items")
          .select("id, item_name, item_code, condition_status, is_active")
          .eq("is_active", true)
          .eq("condition_status", "good")
          .order("item_name", { ascending: true }),

        supabase
          .from("sports_item_schedules")
          .select("id, sports_item_id, time_slot_id, is_active")
          .eq("is_active", true),

        supabase
          .from("time_slots")
          .select("id, slot_name, slot_date, start_time, end_time, is_active")
          .eq("is_active", true)
          .order("slot_date", { ascending: true })
          .order("start_time", { ascending: true }),
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (schedulesResult.error) throw schedulesResult.error;
      if (slotsResult.error) throw slotsResult.error;

      const activeItems = itemsResult.data || [];
      const activeSchedules = schedulesResult.data || [];
      const activeSlots = slotsResult.data || [];

      const today = getTodayDate();

      // Keep only upcoming schedules.
      const upcomingSlots = activeSlots.filter(
        (slot) =>
          slot.slot_date &&
          slot.slot_date >= today &&
          isSlotStillAvailableByTime(slot),
      );

      // Fetch public booking information for each upcoming date.
      const uniqueDates = [
        ...new Set(upcomingSlots.map((slot) => slot.slot_date)),
      ];

      const bookingResults = await Promise.all(
        uniqueDates.map((date) =>
          supabase.rpc("get_public_sports_item_bookings", {
            p_booking_date: date,
          }),
        ),
      );

      const allBookings = [];

      bookingResults.forEach((result) => {
        if (result.error) throw result.error;

        if (Array.isArray(result.data)) {
          allBookings.push(...result.data);
        }
      });

      setItems(activeItems);
      setSchedules(activeSchedules);
      setWindowSlots(upcomingSlots);
      setBookings(allBookings);
    } catch (err) {
      console.error("Student dashboard loading error:", err);
      setError(err.message || "Unable to load available sports items.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, isAdmin]);

  // Find bookings using sports item ID and time slot ID.
  const bookingLookup = useMemo(() => {
    const lookup = {};

    bookings.forEach((booking) => {
      const key = `${booking.sports_item_id}_${booking.time_slot_id}`;
      lookup[key] = booking;
    });

    return lookup;
  }, [bookings]);

  // Build one card per sports item.
  // Each card contains all upcoming schedules assigned to that item.
  const sportsItemsWithSchedules = useMemo(() => {
    const slotMap = new Map(windowSlots.map((slot) => [slot.id, slot]));

    const schedulesByItem = new Map();

    schedules.forEach((assignment) => {
      if (!assignment.is_active) return;

      const slot = slotMap.get(assignment.time_slot_id);

      if (!slot) return;

      if (!schedulesByItem.has(assignment.sports_item_id)) {
        schedulesByItem.set(assignment.sports_item_id, []);
      }

      const existing = schedulesByItem.get(assignment.sports_item_id);

      // Prevent duplicate schedule entries.
      if (!existing.some((entry) => entry.id === slot.id)) {
        existing.push(slot);
      }
    });

    return items.map((item) => {
      const itemSchedules = schedulesByItem.get(item.id) || [];

      itemSchedules.sort((a, b) => {
        return (
          a.slot_date.localeCompare(b.slot_date) ||
          a.start_time.localeCompare(b.start_time)
        );
      });

      return {
        ...item,
        upcomingSchedules: itemSchedules,
      };
    });
  }, [items, schedules, windowSlots]);

  // Administrators use the separate Admin Portal.
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="page-container py-8 sm:py-10">
      {/* PAGE HEADER */}

      <section className="mb-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="section-label">SPORTS ITEM AVAILABILITY</p>

            <h1 className="page-heading mt-2">Available Sports Items</h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Explore registered sports items, check their upcoming schedules,
              and reserve an available item.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={loading || refreshing}
            className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh availability"}
          </button>
        </div>
      </section>

      {/* LOADING STATE */}

      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((number) => (
            <div
              key={number}
              className="h-96 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      )}

      {/* ERROR STATE */}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="font-bold text-red-800">
            Unable to load sports availability
          </h3>

          <p className="mt-2 text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => fetchDashboardData()}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      )}

      {/* SPORTS ITEMS GRID */}

      {!loading && !error && (
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="section-label">AVAILABLE INVENTORY</p>

              <h2 className="page-heading mt-2">Explore Sports Items</h2>

              <p className="mt-2 text-sm text-slate-500">
                Select an item to view its details and booking options.
              </p>
            </div>

            <span className="shrink-0 text-sm font-semibold text-slate-500">
              {sportsItemsWithSchedules.length} items
            </span>
          </div>

          {sportsItemsWithSchedules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="font-bold text-[#142b4a]">
                No sports items available
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                There are currently no active sports items available for
                booking.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sportsItemsWithSchedules.map((item) => (
                <article
                  key={item.id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* ITEM INFORMATION */}

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold text-[#142b4a]">
                        {item.item_name}
                      </h3>

                      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
                        {item.condition_status}
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Item Code: {item.item_code}
                    </p>

                    <div className="my-5 border-t border-slate-100" />

                    {/* UPCOMING SCHEDULES */}

                    <div className="flex-1">
                      <h4 className="mb-3 text-sm font-bold text-[#142b4a]">
                        Upcoming Booking Schedules
                      </h4>

                      {item.upcomingSchedules.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm text-slate-500">
                            No upcoming schedules available for this item.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {item.upcomingSchedules.map((slot) => {
                            const bookingKey = `${item.id}_${slot.id}`;

                            const booking = bookingLookup[bookingKey];

                            const isBooked = Boolean(booking);

                            return (
                              <div
                                key={slot.id}
                                className={`rounded-lg border p-4 ${
                                  isBooked
                                    ? "border-red-100 bg-red-50"
                                    : "border-emerald-100 bg-emerald-50"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-bold text-[#142b4a]">
                                    {formatDate(slot.slot_date)}
                                  </span>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                                      isBooked
                                        ? "bg-red-100 text-red-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {isBooked ? "Booked" : "Available"}
                                  </span>
                                </div>

                                <p className="mt-2 text-sm font-medium text-slate-700">
                                  {formatTime(slot.start_time)}
                                  {" – "}
                                  {formatTime(slot.end_time)}
                                </p>

                                {slot.slot_name && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    {slot.slot_name}
                                  </p>
                                )}

                                {isBooked ? (
                                  <div className="mt-3 border-t border-red-200 pt-3">
                                    <p className="text-xs font-semibold text-slate-700">
                                      Reserved by roll number:
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-red-700">
                                      {booking.roll_number || "Not available"}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-500">
                                      Booking time:{" "}
                                      {formatBookingTime(booking.booked_at)}
                                    </p>

                                    <p className="mt-2 text-xs text-red-600">
                                      This item is unavailable for this
                                      schedule.
                                    </p>
                                  </div>
                                ) : (
                                  <p className="mt-2 text-xs font-medium text-emerald-700">
                                    This schedule is available for reservation.
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* BOOKING ACTION */}

                    <div className="mt-5 border-t border-slate-100 pt-5">
                      {item.upcomingSchedules.some(
                        (slot) => !bookingLookup[`${item.id}_${slot.id}`],
                      ) ? (
                        <Link
                          to={`/book/${encodeURIComponent(item.item_name)}`}
                          className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                          View Details & Book →
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full cursor-not-allowed rounded-lg bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500"
                        >
                          Currently Unavailable
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* MY BOOKINGS */}

      <section className="mt-10 rounded-xl border border-blue-100 bg-blue-50 p-6 sm:flex sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#142b4a]">
            Manage your reservations
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            View your confirmed bookings and reservation history.
          </p>
        </div>

        <Link
          to="/my-bookings"
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:mt-0"
        >
          My Bookings →
        </Link>
      </section>
    </div>
  );
};

export default Dashboard;
