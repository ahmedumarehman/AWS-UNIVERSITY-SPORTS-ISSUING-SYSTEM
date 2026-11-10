import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const SportsItemManagement = () => {
  const [items, setItems] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [itemName, setItemName] = useState("");
  const [condition, setCondition] = useState("good");

  const [scheduleItem, setScheduleItem] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("16:00");

  const [editingId, setEditingId] = useState(null);

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Karachi",
  });

  // LOAD SPORTS ITEMS AND SCHEDULES

  const fetchData = useCallback(async () => {
    try {
      setError("");

      const [itemsResult, schedulesResult] = await Promise.all([
        supabase
          .from("sports_items")
          .select(
            "id,item_code,item_name,image_url,condition_status,is_active,created_at",
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("sports_item_schedules")
          .select(
            `
            id,
            sports_item_id,
            time_slot_id,
            is_active,
            time_slots!inner(
              id,
              slot_name,
              slot_date,
              start_time,
              end_time,
              is_active
            ),
            sports_items!inner(
              item_name,
              item_code
            )
          `,
          )
          .order("created_at", { ascending: false }),
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (schedulesResult.error) throw schedulesResult.error;

      setItems(itemsResult.data || []);
      setSchedules(schedulesResult.data || []);

      if (itemsResult.data?.length) {
        setScheduleItem((current) => current || itemsResult.data[0].id);
      }
    } catch (err) {
      console.error("Sports item loading error:", err);
      setError(err.message || "Unable to load sports inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // RESET FORM

  const resetForm = () => {
    setItemName("");
    setCondition("good");
    setEditingId(null);
  };

  // SAVE / ADD / EDIT SPORTS ITEM

  const saveItem = async (event) => {
    event.preventDefault();

    if (!itemName.trim()) {
      setError("Enter a sports item name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // UPDATE EXISTING ITEM

      if (editingId) {
        const changes = {
          item_name: itemName.trim(),
          condition_status: condition,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from("sports_items")
          .update(changes)
          .eq("id", editingId);

        if (updateError) throw updateError;

        setSuccess("Sports item updated successfully.");
      }

      // INSERT NEW ITEM
      else {
        const { error: insertError } = await supabase
          .from("sports_items")
          .insert({
            item_name: itemName.trim(),
            condition_status: condition,
            is_active: true,
          });

        if (insertError) throw insertError;

        setSuccess("Physical sports item added successfully.");
      }

      resetForm();
      await fetchData();
    } catch (err) {
      console.error("Save sports item error:", err);
      setError(err.message || "Unable to save sports item.");
    } finally {
      setSaving(false);
    }
  };

  // EDIT SPORTS ITEM

  const editItem = (item) => {
    setEditingId(item.id);
    setItemName(item.item_name);
    setCondition(item.condition_status);

    setError("");
    setSuccess("");
  };

  // ACTIVATE / DEACTIVATE ITEM

  const toggleItem = async (item) => {
    try {
      setError("");
      setSuccess("");

      if (!item.is_active && item.condition_status !== "good") {
        setError("Only items in good condition can be activated.");
        return;
      }

      const { error: updateError } = await supabase
        .from("sports_items")
        .update({
          is_active: !item.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (updateError) throw updateError;

      setSuccess(
        `${item.item_name} ${item.is_active ? "deactivated" : "activated"}.`,
      );

      await fetchData();
    } catch (err) {
      console.error("Update item status error:", err);
      setError(err.message || "Unable to update item status.");
    }
  };

  // DELETE SPORTS ITEM

  const deleteItem = async (item) => {
    const confirmed = window.confirm(
      `Delete ${item.item_name} (${item.item_code})? This is only possible if it has no booking history.`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const { error: deleteError } = await supabase
        .from("sports_items")
        .delete()
        .eq("id", item.id);

      if (deleteError) throw deleteError;

      setSuccess("Sports item deleted.");
      await fetchData();
    } catch (err) {
      console.error("Delete sports item error:", err);
      setError(
        "This item could not be deleted. If it has booking history, deactivate it instead.",
      );
    }
  };

  // CREATE AVAILABILITY SCHEDULE

  const createSchedule = async (event) => {
    event.preventDefault();

    if (!scheduleItem || !scheduleDate || !startTime || !endTime) {
      setError("Complete all schedule fields.");
      return;
    }

    if (scheduleDate < today) {
      setError("Choose today or a future date.");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be later than start time.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // PREVENT OVERLAPPING SCHEDULES

      const existing = schedules.filter(
        (schedule) =>
          schedule.sports_item_id === scheduleItem &&
          schedule.is_active &&
          schedule.time_slots?.slot_date === scheduleDate,
      );

      const overlaps = existing.some((schedule) => {
        const oldStart = schedule.time_slots.start_time.slice(0, 5);
        const oldEnd = schedule.time_slots.end_time.slice(0, 5);

        return startTime < oldEnd && endTime > oldStart;
      });

      if (overlaps) {
        throw new Error(
          "This item already has an overlapping active schedule on that date.",
        );
      }

      const slotName = `${scheduleDate} ${startTime}-${endTime}`;

      // CREATE TIME SLOT

      const { data: slot, error: slotError } = await supabase
        .from("time_slots")
        .insert({
          slot_name: slotName,
          slot_date: scheduleDate,
          start_time: startTime,
          end_time: endTime,
          is_active: true,
        })
        .select("id")
        .single();

      if (slotError) throw slotError;

      // LINK SPORTS ITEM WITH TIME SLOT

      const { error: linkError } = await supabase
        .from("sports_item_schedules")
        .insert({
          sports_item_id: scheduleItem,
          time_slot_id: slot.id,
          is_active: true,
        });

      if (linkError) {
        await supabase.from("time_slots").delete().eq("id", slot.id);

        throw linkError;
      }

      setSuccess("Availability schedule created successfully.");
      await fetchData();
    } catch (err) {
      console.error("Create schedule error:", err);
      setError(err.message || "Unable to create schedule.");
    } finally {
      setSaving(false);
    }
  };

  // ACTIVATE / DEACTIVATE SCHEDULE

  const toggleSchedule = async (schedule) => {
    try {
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("sports_item_schedules")
        .update({
          is_active: !schedule.is_active,
        })
        .eq("id", schedule.id);

      if (updateError) throw updateError;

      setSuccess("Schedule status updated.");
      await fetchData();
    } catch (err) {
      console.error("Schedule update error:", err);
      setError(err.message || "Unable to update schedule.");
    }
  };

  // DATE FORMAT

  const formatDate = (value) => {
    if (!value) return "—";

    const [year, month, day] = value.split("-");

    return `${day}/${month}/${year}`;
  };

  // TIME FORMAT

  const formatTime = (value) => {
    if (!value) return "—";

    const [hourText, minute] = value.slice(0, 5).split(":");

    const hour = Number(hourText);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute} ${suffix}`;
  };

  // INITIAL LOADING SCREEN

  if (loading) {
    return (
      <section className="mt-10 rounded-xl border bg-white p-6">
        <p className="text-sm text-slate-500">
          Loading sports item management...
        </p>
      </section>
    );
  }

  // MAIN COMPONENT

  return (
    <div className="mt-10 space-y-8">
      {/* ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      {/* ADD / EDIT PHYSICAL ITEM */}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-xl font-bold text-[#142b4a]">
            {editingId ? "Edit sports item" : "Add physical sports item"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Every record represents one individual physical item.
          </p>
        </div>

        <form onSubmit={saveItem} className="mt-6 grid gap-5 md:grid-cols-2">
          {/* ITEM NAME */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Sports item name
            </label>

            <input
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              placeholder="e.g. Table Tennis Ball"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* CONDITION */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Condition
            </label>

            <select
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="good">Good</option>
              <option value="maintenance">Maintenance</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>

          {/* FORM BUTTONS */}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#142b4a] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Add physical item"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel editing
              </button>
            )}
          </div>
        </form>
      </section>

      {/* PHYSICAL ITEM INVENTORY */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-[#142b4a]">
            Registered physical items
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {items.length} individual items registered.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Item</th>
                <th className="px-5 py-4">Unique code</th>
                <th className="px-5 py-4">Condition</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <span className="font-semibold text-[#142b4a]">
                      {item.item_name}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-mono text-xs text-slate-600">
                    {item.item_code}
                  </td>

                  <td className="px-5 py-4 capitalize text-slate-600">
                    {item.condition_status}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editItem(item)}
                        className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleItem(item)}
                        className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {item.is_active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteItem(item)}
                        className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No physical sports items have been registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CREATE AVAILABILITY SCHEDULE */}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-[#142b4a]">
          Create availability schedule
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Set the exact date and time when an individual item can be reserved.
        </p>

        <form
          onSubmit={createSchedule}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >
          {/* SELECT ITEM */}

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select physical item
            </label>

            <select
              value={scheduleItem}
              onChange={(event) => setScheduleItem(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">Choose an item</option>

              {items
                .filter(
                  (item) => item.is_active && item.condition_status === "good",
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_name} — {item.item_code}
                  </option>
                ))}
            </select>
          </div>

          {/* AVAILABLE DATE */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Available date
            </label>

            <input
              type="date"
              min={today}
              value={scheduleDate}
              onChange={(event) => setScheduleDate(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          {/* TIME SELECTION */}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Start time
              </label>

              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                End time
              </label>

              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
              />
            </div>
          </div>

          {/* PUBLISH SCHEDULE */}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving || !scheduleItem}
              className="rounded-lg bg-[#142b4a] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              {saving ? "Creating schedule..." : "Publish availability"}
            </button>
          </div>
        </form>
      </section>

      {/* EXISTING SCHEDULES */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-[#142b4a]">
            Published availability schedules
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Sports item</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Time</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#142b4a]">
                      {schedule.sports_items?.item_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {schedule.sports_items?.item_code}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {formatDate(schedule.time_slots?.slot_date)}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {formatTime(schedule.time_slots?.start_time)} –{" "}
                    {formatTime(schedule.time_slots?.end_time)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        schedule.is_active && schedule.time_slots?.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {schedule.is_active && schedule.time_slots?.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => toggleSchedule(schedule)}
                      className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {schedule.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}

              {schedules.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No availability schedules have been created.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SportsItemManagement;
