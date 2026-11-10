import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const getToday = () => {
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

const emptyForm = {
  sports_item_id: "",
  slot_name: "",
  slot_date: getToday(),
  start_time: "",
  end_time: "",
};

const formatDate = (value) => {
  if (!value) return "Date not assigned";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

const formatTime = (value) => {
  if (!value) return "";
  const [hours, minutes] = value.split(":");
  const hour = Number(hours);
  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
};

const TimeSlotManagement = () => {
  const [items, setItems] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [itemsResult, schedulesResult] = await Promise.all([
        supabase
          .from("sports_items")
          .select("id, item_name, item_code, is_active, condition_status")
          .order("item_name"),

        supabase
          .from("sports_item_schedules")
          .select(
            `
            id,
            sports_item_id,
            time_slot_id,
            is_active,
            sports_items (
              item_name,
              item_code
            ),
            time_slots (
              id,
              slot_name,
              slot_date,
              start_time,
              end_time,
              is_active
            )
          `,
          )
          .order("created_at", { ascending: false }),
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (schedulesResult.error) throw schedulesResult.error;

      setItems(itemsResult.data || []);
      setSchedules(schedulesResult.data || []);
    } catch (err) {
      console.error("Schedule loading error:", err);
      setError(err.message || "Unable to load scheduling information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeItems = items.filter(
    (item) => item.is_active && item.condition_status === "good",
  );

  const resetForm = () => {
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    if (!form.sports_item_id) {
      setError("Select a physical sports item.");
      return;
    }

    if (!form.slot_name.trim()) {
      setError("Enter a schedule name.");
      return;
    }

    if (form.start_time >= form.end_time) {
      setError("End time must be later than start time.");
      return;
    }

    try {
      setSaving(true);

      // Create a new dated time slot.
      const { data: slot, error: slotError } = await supabase
        .from("time_slots")
        .insert({
          slot_name: form.slot_name.trim(),
          slot_date: form.slot_date,
          start_time: form.start_time,
          end_time: form.end_time,
          is_active: true,
        })
        .select("id")
        .single();

      if (slotError) throw slotError;

      // Assign this schedule to the selected physical item only.
      const { error: assignmentError } = await supabase
        .from("sports_item_schedules")
        .insert({
          sports_item_id: form.sports_item_id,
          time_slot_id: slot.id,
          is_active: true,
        });

      if (assignmentError) throw assignmentError;

      setSuccess("Schedule created and assigned to the physical item.");
      resetForm();
      await fetchData();
    } catch (err) {
      console.error("Schedule creation error:", err);
      setError(err.message || "Unable to create the schedule.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAssignment = async (schedule) => {
    const nextStatus = !schedule.is_active;

    const confirmed = window.confirm(
      `${nextStatus ? "Activate" : "Deactivate"} this item schedule?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("sports_item_schedules")
        .update({ is_active: nextStatus })
        .eq("id", schedule.id);

      if (updateError) throw updateError;

      setSuccess(`Item schedule ${nextStatus ? "activated" : "deactivated"}.`);

      await fetchData();
    } catch (err) {
      console.error("Schedule update error:", err);
      setError(err.message || "Unable to update this assignment.");
    }
  };

  if (loading) {
    return (
      <div className="mt-10 rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Loading scheduling information...
      </div>
    );
  }

  return (
    <section className="mt-10" id="schedule-management">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">Administration</p>
          <h2 className="mt-2 text-2xl font-bold text-[#142b4a]">
            Physical item schedules
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create a date and time schedule for one specific registered physical
            item.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh schedules
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#142b4a]">
          Create an item schedule
        </h3>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="sportsItem"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Physical sports item
            </label>

            <select
              id="sportsItem"
              className="form-input"
              value={form.sports_item_id}
              onChange={(event) =>
                setForm({
                  ...form,
                  sports_item_id: event.target.value,
                })
              }
              required
            >
              <option value="">Select physical item</option>

              {activeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name} — {item.item_code}
                </option>
              ))}
            </select>

            {activeItems.length === 0 && (
              <p className="mt-2 text-sm text-amber-700">
                No active physical items in good condition are available.
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="slotName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Schedule name
              </label>
              <input
                id="slotName"
                className="form-input"
                placeholder="e.g. Morning Session"
                value={form.slot_name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    slot_name: event.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label
                htmlFor="slotDate"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Schedule date
              </label>
              <input
                id="slotDate"
                type="date"
                className="form-input"
                min={getToday()}
                value={form.slot_date}
                onChange={(event) =>
                  setForm({
                    ...form,
                    slot_date: event.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label
                htmlFor="startTime"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Start time
              </label>
              <input
                id="startTime"
                type="time"
                className="form-input"
                value={form.start_time}
                onChange={(event) =>
                  setForm({
                    ...form,
                    start_time: event.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label
                htmlFor="endTime"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                End time
              </label>
              <input
                id="endTime"
                type="time"
                className="form-input"
                value={form.end_time}
                onChange={(event) =>
                  setForm({
                    ...form,
                    end_time: event.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || activeItems.length === 0}
            className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating schedule..." : "Create and assign schedule"}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-[#142b4a]">
          Existing item schedules
        </h3>

        {schedules.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No item schedules have been created.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {schedules.map((schedule) => {
              const slot = schedule.time_slots;
              const item = schedule.sports_items;

              return (
                <article
                  key={schedule.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-[#142b4a]">
                        {item?.item_name || "Unknown item"}
                      </h4>

                      <p className="mt-1 text-xs text-slate-500">
                        {item?.item_code || ""}
                      </p>

                      <p className="mt-3 font-semibold text-blue-700">
                        {slot?.slot_name || "Unknown schedule"}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {formatDate(slot?.slot_date)}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatTime(slot?.start_time)} –{" "}
                        {formatTime(slot?.end_time)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          schedule.is_active && slot?.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {schedule.is_active && slot?.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleAssignment(schedule)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {schedule.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default TimeSlotManagement;
