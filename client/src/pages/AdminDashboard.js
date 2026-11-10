import React, { useCallback, useEffect, useState } from "react";
import SportsItemManagement from "../components/SportsItemManagement";
import TimeSlotManagement from "../components/TimeSlotManagement";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const initialStats = {
  totalEquipment: 0,
  activeEquipment: 0,
  maintenance: 0,
  damaged: 0,
  totalStudents: 0,
  totalBookings: 0,
  confirmed: 0,
  issued: 0,
  returned: 0,
  cancelled: 0,
  overdue: 0,
};

const StatCard = ({ title, value, description, icon, color }) => {
  const colors = {
    red: "border-red-100 bg-red-50 text-red-800",
    green: "border-green-100 bg-green-50 text-green-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    rose: "border-rose-100 bg-rose-50 text-rose-800",
    blue: "border-blue-100 bg-blue-50 text-blue-800",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
    violet: "border-violet-100 bg-violet-50 text-violet-800",
    slate: "border-slate-200 bg-slate-100 text-slate-800",
    orange: "border-orange-100 bg-orange-50 text-orange-800",
  };

  const selectedColor = colors[color] || colors.slate;

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition hover:shadow-md ${selectedColor}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold opacity-80">{title}</p>

        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/70 font-bold">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold">{value}</p>

      <p className="mt-2 text-xs opacity-75">{description}</p>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: "bg-emerald-50 text-emerald-700",
    issued: "bg-blue-50 text-blue-700",
    returned: "bg-slate-100 text-slate-700",
    cancelled: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

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
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
};

const formatDateTime = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  });
};

const AdminDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState(initialStats);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [dueAtByBooking, setDueAtByBooking] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------
  // FETCH DASHBOARD DATA
  // --------------------------------------------------

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccess("");

      const count = async (table, filters = []) => {
        let query = supabase
          .from(table)
          .select("*", { count: "exact", head: true });

        filters.forEach(([column, value]) => {
          query = query.eq(column, value);
        });

        const { count: total, error: queryError } = await query;

        if (queryError) throw queryError;

        return total ?? 0;
      };

      const [
        totalEquipment,
        activeEquipment,
        maintenance,
        damaged,
        totalStudents,
        totalBookings,
        confirmed,
        issued,
        returned,
        cancelled,
        overdue,
        bookingsResponse,
      ] = await Promise.all([
        count("sports_items"),

        count("sports_items", [["is_active", true]]),

        count("sports_items", [["condition_status", "maintenance"]]),

        count("sports_items", [["condition_status", "damaged"]]),

        count("profiles", [["role", "student"]]),

        count("bookings"),

        count("bookings", [["status", "confirmed"]]),

        count("bookings", [["status", "issued"]]),

        count("bookings", [["status", "returned"]]),

        count("bookings", [["status", "cancelled"]]),

        // Overdue issued bookings
        (async () => {
          const { count: overdueCount, error: overdueError } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("status", "issued")
            .not("due_at", "is", null)
            .lt("due_at", new Date().toISOString());

          if (overdueError) throw overdueError;

          return overdueCount ?? 0;
        })(),

        // Latest 20 reservations
        supabase
          .from("bookings")
          .select(
            `
            id,
            booking_date,
            booked_at,
            issued_at,
            due_at,
            returned_at,
            status,
            sports_item:sports_items (
              item_name,
              item_code
            ),
            time_slots (
              slot_name,
              start_time,
              end_time
            ),
            student:profiles!bookings_student_id_fkey (
              full_name,
              roll_number,
              contact_number
            )
          `,
          )
          .order("booked_at", { ascending: false })
          .limit(20),
      ]);

      if (bookingsResponse.error) {
        throw bookingsResponse.error;
      }

      setStats({
        totalEquipment,
        activeEquipment,
        maintenance,
        damaged,
        totalStudents,
        totalBookings,
        confirmed,
        issued,
        returned,
        cancelled,
        overdue,
      });

      setRecentBookings(bookingsResponse.data ?? []);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(err.message || "Unable to load dashboard information.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --------------------------------------------------
  // ISSUE / RETURN / CANCEL BOOKING
  // --------------------------------------------------

  const updateBookingStatus = async (booking, newStatus, dueAtValue = null) => {
    if (updatingBookingId) return;

    let returnCondition = "good";
    let dueAtIso = null;

    // Validate administrator-selected return deadline.
    if (newStatus === "issued") {
      if (!dueAtValue) {
        setError("Please select a return deadline before issuing this item.");
        return;
      }

      const selectedDeadline = new Date(dueAtValue);

      if (
        Number.isNaN(selectedDeadline.getTime()) ||
        selectedDeadline.getTime() <= Date.now()
      ) {
        setError("The return deadline must be a valid future date and time.");
        return;
      }

      dueAtIso = selectedDeadline.toISOString();
    }

    // Get returned equipment condition.
    if (newStatus === "returned") {
      const selectedCondition = window.prompt(
        "Enter returned item's condition:\n\ngood\nmaintenance\ndamaged",
      );

      if (selectedCondition === null) return;

      returnCondition = selectedCondition.trim().toLowerCase();

      if (!["good", "maintenance", "damaged"].includes(returnCondition)) {
        window.alert(
          "Invalid condition. Please enter good, maintenance, or damaged.",
        );
        return;
      }
    }

    const actionText =
      newStatus === "issued"
        ? "mark this item as issued"
        : newStatus === "returned"
          ? "mark this item as returned"
          : "cancel this booking";

    if (!window.confirm(`Are you sure you want to ${actionText}?`)) {
      return;
    }

    try {
      setUpdatingBookingId(booking.id);
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase.rpc(
        "admin_update_sports_booking_status",
        {
          p_booking_id: booking.id,
          p_new_status: newStatus,
          p_due_at: dueAtIso,
          p_return_condition: returnCondition,
        },
      );

      if (updateError) throw updateError;

      const successMessage =
        newStatus === "issued"
          ? "Equipment successfully marked as issued."
          : newStatus === "returned"
            ? `Equipment successfully returned. Condition: ${returnCondition}.`
            : "Booking successfully cancelled.";

      setSuccess(successMessage);

      if (newStatus === "issued") {
        setDueAtByBooking((previous) => {
          const next = { ...previous };
          delete next[booking.id];
          return next;
        });
      }

      await fetchDashboardData(true);
    } catch (err) {
      console.error("Booking status update error:", err);
      setError(err.message || "Unable to update booking status.");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // --------------------------------------------------
  // DASHBOARD CALCULATIONS
  // --------------------------------------------------

  const inventoryIssues = stats.maintenance + stats.damaged;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading administrator dashboard...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN DASHBOARD
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-10">
        {/* ADMIN DASHBOARD HEADER */}

        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="section-label">Administration</p>

            <h1 className="page-heading mt-3">Sports Management Dashboard</h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor physical sports items, reservations and students.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#142b4a] transition hover:bg-slate-100 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh data ↻"}
          </button>
        </div>

        {/* ADMIN IDENTITY */}

        <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Administrator session
          </p>

          <p className="mt-2 font-semibold text-[#142b4a]">{user?.email}</p>

          <p className="mt-1 text-xs text-slate-500">
            Authorized administrator
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        {/* PHYSICAL EQUIPMENT OVERVIEW */}

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#142b4a]">
              Physical equipment overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Statistics for individually registered physical sports items.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Items"
              value={stats.totalEquipment}
              description="All registered physical items"
              icon="E"
              color="red"
            />

            <StatCard
              title="Active Items"
              value={stats.activeEquipment}
              description="Items currently activated"
              icon="A"
              color="green"
            />

            <StatCard
              title="Maintenance"
              value={stats.maintenance}
              description="Items requiring maintenance"
              icon="M"
              color="amber"
            />

            <StatCard
              title="Damaged"
              value={stats.damaged}
              description="Items marked as damaged"
              icon="!"
              color="rose"
            />
          </div>
        </section>

        {/* BOOKING OVERVIEW */}

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#142b4a]">
              Booking overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Reservation activity and current booking statuses.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Total Bookings"
              value={stats.totalBookings}
              description="All reservation records"
              icon="B"
              color="blue"
            />

            <StatCard
              title="Confirmed"
              value={stats.confirmed}
              description="Approved reservations"
              icon="C"
              color="emerald"
            />

            <StatCard
              title="Issued"
              value={stats.issued}
              description="Equipment currently issued"
              icon="I"
              color="violet"
            />

            <StatCard
              title="Returned"
              value={stats.returned}
              description="Completed returns"
              icon="R"
              color="green"
            />

            <StatCard
              title="Cancelled"
              value={stats.cancelled}
              description="Cancelled reservations"
              icon="X"
              color="rose"
            />
          </div>
        </section>

        {/* STUDENT AND ALERT OVERVIEW */}

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-6">
            <p className="text-sm font-semibold text-sky-800">
              Registered Students
            </p>

            <p className="mt-3 text-4xl font-bold text-sky-900">
              {stats.totalStudents}
            </p>

            <p className="mt-2 text-sm text-sky-700">
              Student profiles registered in the system.
            </p>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
            <p className="text-sm font-semibold text-orange-800">
              Attention Required
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold text-orange-900">
                  {stats.overdue}
                </p>

                <p className="mt-1 text-xs text-orange-800">
                  Overdue issued items
                </p>
              </div>

              <div>
                <p className="text-3xl font-bold text-orange-900">
                  {inventoryIssues}
                </p>

                <p className="mt-1 text-xs text-orange-800">
                  Maintenance / damaged
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BOOKING MANAGEMENT */}

        <section className="mt-10 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
            <div>
              <h2 className="text-xl font-bold text-[#142b4a]">
                Booking management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review student reservations and manage equipment issuing and
                returns.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Live database
            </span>
          </div>

          {recentBookings.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No reservations have been recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Physical item</th>
                    <th className="px-5 py-4">Booking date</th>
                    <th className="px-5 py-4">Time slot</th>
                    <th className="px-5 py-4">Booked at</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentBookings.map((booking) => {
                    const timeSlot = booking.time_slots;
                    const student = booking.student;
                    const sportsItem = booking.sports_item;
                    const isUpdating = updatingBookingId === booking.id;

                    return (
                      <tr key={booking.id} className="hover:bg-slate-50">
                        {/* STUDENT */}

                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#142b4a]">
                            {student?.full_name || "Unknown student"}
                          </p>

                          <p className="mt-1 text-xs font-medium text-blue-700">
                            Roll: {student?.roll_number || "Not provided"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {student?.contact_number || "No contact number"}
                          </p>
                        </td>

                        {/* PHYSICAL ITEM */}

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-700">
                            {sportsItem?.item_name || "Unknown item"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {sportsItem?.item_code || "—"}
                          </p>
                        </td>

                        {/* BOOKING DATE */}

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(booking.booking_date)}
                        </td>

                        {/* TIME SLOT */}

                        <td className="px-5 py-4 text-slate-600">
                          {timeSlot?.start_time && timeSlot?.end_time
                            ? `${formatTime(timeSlot.start_time)} – ${formatTime(timeSlot.end_time)}`
                            : timeSlot?.slot_name || "—"}
                        </td>

                        {/* BOOKED AT */}

                        <td className="px-5 py-4 text-xs text-slate-600">
                          {formatDateTime(booking.booked_at)}
                        </td>

                        {/* STATUS AND RETURN DEADLINE */}

                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge status={booking.status} />

                            {booking.status === "issued" && (
                              <span
                                className={`text-xs ${
                                  booking.due_at &&
                                  new Date(booking.due_at).getTime() <
                                    Date.now()
                                    ? "font-semibold text-red-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {booking.due_at
                                  ? `Due: ${formatDateTime(booking.due_at)}`
                                  : "Return deadline not set"}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex min-w-[150px] flex-wrap gap-2">
                            {booking.status === "confirmed" && (
                              <>
                                <div className="flex min-w-[190px] flex-col gap-2">
                                  <label
                                    htmlFor={`due-at-${booking.id}`}
                                    className="text-xs font-medium text-slate-600"
                                  >
                                    Return deadline
                                  </label>

                                  <input
                                    id={`due-at-${booking.id}`}
                                    type="datetime-local"
                                    value={dueAtByBooking[booking.id] || ""}
                                    min={new Date(
                                      Date.now() -
                                        new Date().getTimezoneOffset() * 60000,
                                    )
                                      .toISOString()
                                      .slice(0, 16)}
                                    onChange={(event) => {
                                      const value = event.target.value;

                                      setDueAtByBooking((previous) => ({
                                        ...previous,
                                        [booking.id]: value,
                                      }));

                                      setError("");
                                    }}
                                    disabled={!!updatingBookingId}
                                    className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                  />

                                  <button
                                    type="button"
                                    disabled={
                                      !!updatingBookingId ||
                                      !dueAtByBooking[booking.id]
                                    }
                                    onClick={() =>
                                      updateBookingStatus(
                                        booking,
                                        "issued",
                                        dueAtByBooking[booking.id],
                                      )
                                    }
                                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isUpdating ? "Updating..." : "Issue item"}
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  disabled={!!updatingBookingId}
                                  onClick={() =>
                                    updateBookingStatus(booking, "cancelled")
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {booking.status === "issued" && (
                              <button
                                type="button"
                                disabled={!!updatingBookingId}
                                onClick={() =>
                                  updateBookingStatus(booking, "returned")
                                }
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isUpdating ? "Updating..." : "Mark returned"}
                              </button>
                            )}

                            {["returned", "cancelled"].includes(
                              booking.status,
                            ) && (
                              <span className="text-xs text-slate-400">
                                No action required
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-6 py-4">
            <p className="text-xs text-slate-400">
              Showing the latest 20 bookings. Refresh the dashboard to retrieve
              updated records.
            </p>
          </div>
        </section>

        {/* PHYSICAL SPORTS ITEM MANAGEMENT */}

        <SportsItemManagement />

        {/* TIME SLOT MANAGEMENT */}

        <TimeSlotManagement />

        {/* FOOTNOTE */}

        <p className="mt-6 text-xs text-slate-400">
          Dashboard figures are retrieved from Supabase. Overdue means an issued
          booking whose due date has passed. Student accounts are restricted to
          one active booking; administrator accounts are exempt.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
