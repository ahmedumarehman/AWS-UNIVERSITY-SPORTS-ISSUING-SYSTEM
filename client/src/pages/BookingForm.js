import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const formatTime = (value) => {
  if (!value) return "";
  const [hours, minutes] = value.split(":");
  const hour = Number(hours);
  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
};

const formatDate = (value) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value || "",
  );

const BookingForm = () => {
  const { itemName } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [item, setItem] = useState(null);
  const [profile, setProfile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);

  const [rollNumber, setRollNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");

  const loadData = useCallback(async () => {
    if (!user?.id || !itemName) return;

    try {
      setLoading(true);
      setError("");

      let itemQuery = supabase
        .from("sports_items")
        .select(
          "id, item_name, item_code, image_url, condition_status, is_active",
        );

      itemQuery = isUuid(itemName)
        ? itemQuery.eq("id", itemName)
        : itemQuery.eq("item_name", decodeURIComponent(itemName));

      const [itemResult, profileResult] = await Promise.all([
        itemQuery.maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name, roll_number, contact_number, role")
          .eq("id", user.id)
          .single(),
      ]);

      if (itemResult.error) throw itemResult.error;
      if (profileResult.error) throw profileResult.error;
      if (!itemResult.data) throw new Error("Sports item not found.");

      if (
        !itemResult.data.is_active ||
        itemResult.data.condition_status !== "good"
      ) {
        throw new Error("This physical item is currently unavailable.");
      }

      setItem(itemResult.data);
      setProfile(profileResult.data);
      setRollNumber(profileResult.data.roll_number || "");
      setContactNumber(profileResult.data.contact_number || "");

      // Administrators are exempt from the one-active-booking restriction.
      if (!isAdmin) {
        const { data: currentBookings, error: bookingError } = await supabase
          .from("bookings")
          .select("id, status, booking_date, sports_item_id, time_slot_id")
          .eq("student_id", user.id)
          .in("status", ["confirmed", "issued"])
          .order("booked_at", { ascending: false })
          .limit(1);

        if (bookingError) throw bookingError;
        setActiveBooking(currentBookings?.[0] || null);
      } else {
        setActiveBooking(null);
      }
    } catch (err) {
      console.error("Booking page loading error:", err);
      setError(err.message || "Unable to load booking information.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, itemName, isAdmin]);

  const loadAvailableSchedules = useCallback(async () => {
    if (!item?.id) return;

    try {
      setCheckingAvailability(true);
      setAvailabilityError("");
      setSelectedSlot("");

      const { data, error: scheduleError } = await supabase.rpc(
        "get_available_sports_item_slots",
        { p_sports_item_id: item.id },
      );

      if (scheduleError) throw scheduleError;

      setSchedules(data || []);
    } catch (err) {
      console.error("Schedule availability error:", err);
      setSchedules([]);
      setAvailabilityError(
        err.message || "Unable to load available schedules.",
      );
    } finally {
      setCheckingAvailability(false);
    }
  }, [item?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (item?.id) loadAvailableSchedules();
  }, [item?.id, loadAvailableSchedules]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    if (!selectedSlot) {
      setError("Please select an available schedule.");
      return;
    }

    if (!isAdmin && !activeBooking && !rollNumber.trim()) {
      setError("Please enter your university roll number.");
      return;
    }

    if (!contactNumber.trim()) {
      setError("Please enter your contact number.");
      return;
    }

    const selectedSchedule = schedules.find(
      (slot) => slot.time_slot_id === selectedSlot,
    );

    if (!selectedSchedule) {
      setError("This schedule is no longer available. Refresh and try again.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const { data, error: bookingError } = await supabase.rpc(
        "create_sports_item_booking",
        {
          p_sports_item_id: item.id,
          p_time_slot_id: selectedSlot,
          p_booking_date: selectedSchedule.slot_date,
          p_roll_number: rollNumber.trim(),
          p_contact_number: contactNumber.trim(),
        },
      );

      if (bookingError) throw bookingError;

      const booking = Array.isArray(data) ? data[0] : data;

      if (!booking?.id) {
        throw new Error("No booking reference was returned.");
      }

      navigate("/confirmation", {
        state: {
          booking,
          sportsItemId: item.id,
          itemName: item.item_name,
          itemCode: item.item_code,
          imageUrl: item.image_url,
          equipmentId: null,
          timeSlot: selectedSchedule.slot_name,
          bookingDate: selectedSchedule.slot_date,
          studentName: profile?.full_name || user.email,
          rollNumber: rollNumber.trim(),
          contactNumber: contactNumber.trim(),
          email: user.email,
        },
      });
    } catch (err) {
      console.error("Booking submission error:", err);
      setError(err.message || "Your booking could not be completed.");
      await loadAvailableSchedules();
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container py-16">
        <div className="card p-10 text-center text-sm text-slate-500">
          Loading item and student information...
        </div>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="page-container py-16">
        <div className="card p-10 text-center">
          <h2 className="text-xl font-bold text-[#142b4a]">
            Sports item unavailable
          </h2>
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <Link to="/dashboard" className="btn-primary mt-6">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/dashboard"
          className="text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          ← Back to dashboard
        </Link>

        <div className="mb-8 mt-7">
          <p className="section-label">Sports equipment reservation</p>
          <h1 className="page-heading mt-3">Book your sports item</h1>
          <p className="mt-3 text-sm text-slate-500">
            Select one of the schedules assigned to this physical item by the
            administrator.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="bg-[#142b4a] p-7 text-white sm:p-9">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.item_name}
                className="mb-6 h-48 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="mb-6 flex h-48 items-center justify-center rounded-xl bg-white/10 text-sm text-white/60">
                No image available
              </div>
            )}

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
              Registered physical item
            </p>
            <h2 className="mt-4 text-3xl font-bold">{item.item_name}</h2>

            <div className="mt-6 border-t border-white/20 pt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-200">
                Unique item code
              </p>
              <p className="mt-2 text-sm font-semibold">{item.item_code}</p>
            </div>

            <div className="mt-6 border-t border-white/20 pt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-200">
                Condition
              </p>
              <span className="mt-3 inline-flex rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-bold capitalize text-emerald-300">
                {item.condition_status}
              </span>
            </div>
          </aside>

          <section className="p-6 sm:p-9">
            <h2 className="text-xl font-bold text-[#142b4a]">
              Booking information
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your booking is limited to one active item at a time.
            </p>

            {!isAdmin && activeBooking && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="font-bold text-amber-900">
                  You already have an active booking
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  You must return or cancel your current booking before
                  reserving another sports item.
                </p>
                <p className="mt-2 text-xs text-amber-800">
                  Current status: {activeBooking.status}
                </p>
                <Link
                  to="/my-bookings"
                  className="mt-4 inline-block font-semibold text-amber-900 underline"
                >
                  View my booking
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-6">
              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-blue-700">
                  Student information
                </p>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={profile?.full_name || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Registered email address
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ""}
                  readOnly
                />
              </div>

              <div>
                <label
                  htmlFor="rollNumber"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  University roll number
                </label>
                <input
                  id="rollNumber"
                  type="text"
                  className="form-input"
                  placeholder="e.g. i22-1580"
                  value={rollNumber}
                  onChange={(event) => setRollNumber(event.target.value)}
                  readOnly={!!profile?.roll_number}
                  required={!isAdmin}
                />
                <p className="mt-1 text-xs text-slate-400">
                  {profile?.roll_number
                    ? "Your registered roll number."
                    : "Enter your roll number. It will be saved to your profile when you book."}
                </p>
              </div>

              <div>
                <label
                  htmlFor="contactNumber"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Contact number
                </label>
                <input
                  id="contactNumber"
                  type="tel"
                  className="form-input"
                  placeholder="+92 300 1234567"
                  value={contactNumber}
                  onChange={(event) => setContactNumber(event.target.value)}
                  required
                />
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Admin-assigned schedules
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  You cannot create or change schedules. Only available
                  schedules configured by the administrator appear here.
                </p>
              </div>

              {availabilityError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {availabilityError}
                  <button
                    type="button"
                    onClick={loadAvailableSchedules}
                    className="ml-2 font-bold underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Available schedules
                  </label>
                  {checkingAvailability && (
                    <span className="text-xs text-blue-600">Loading...</span>
                  )}
                </div>

                {schedules.map((slot) => {
                  const selected = selectedSlot === slot.time_slot_id;

                  return (
                    <button
                      key={slot.time_slot_id}
                      type="button"
                      disabled={
                        submitting || checkingAvailability || !!activeBooking
                      }
                      onClick={() => {
                        setSelectedSlot(slot.time_slot_id);
                        setError("");
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-blue-400"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-[#142b4a]">
                            {slot.slot_name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatTime(slot.start_time)} –{" "}
                            {formatTime(slot.end_time)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(slot.slot_date)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                            selected
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {selected ? "Selected" : "Available"}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {!checkingAvailability &&
                  !availabilityError &&
                  schedules.length === 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                      No future available schedules have been assigned to this
                      item. Please check again later.
                    </div>
                  )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {selectedSlot && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                    Booking summary
                  </p>
                  {(() => {
                    const slot = schedules.find(
                      (entry) => entry.time_slot_id === selectedSlot,
                    );
                    return slot ? (
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <p>
                          <strong>Item:</strong> {item.item_name}
                        </p>
                        <p>
                          <strong>Item code:</strong> {item.item_code}
                        </p>
                        <p>
                          <strong>Date:</strong> {formatDate(slot.slot_date)}
                        </p>
                        <p>
                          <strong>Time:</strong> {formatTime(slot.start_time)} –{" "}
                          {formatTime(slot.end_time)}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitting ||
                  checkingAvailability ||
                  !!availabilityError ||
                  !selectedSlot ||
                  !!activeBooking ||
                  !contactNumber.trim() ||
                  (!isAdmin && !rollNumber.trim())
                }
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Confirming booking..." : "Confirm booking"}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                The system verifies item and student availability before
                confirming your reservation.
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
