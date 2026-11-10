import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const EquipmentUnitManagement = () => {
  const [equipment, setEquipment] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [equipmentResponse, unitsResponse] = await Promise.all([
        supabase
          .from("equipment")
          .select("id, name, is_active, condition_status")
          .order("name"),

        supabase
          .from("equipment_units")
          .select(
            `
            id,
            equipment_id,
            unit_label,
            condition_status,
            is_active,
            created_at,
            equipment(name)
          `,
          )
          .order("created_at", { ascending: true }),
      ]);

      if (equipmentResponse.error) throw equipmentResponse.error;
      if (unitsResponse.error) throw unitsResponse.error;

      setEquipment(equipmentResponse.data || []);
      setUnits(unitsResponse.data || []);

      if (!selectedEquipment && equipmentResponse.data?.length) {
        setSelectedEquipment(equipmentResponse.data[0].id);
      }
    } catch (err) {
      console.error("Inventory loading error:", err);
      setError(err.message || "Unable to load physical inventory.");
    } finally {
      setLoading(false);
    }
  }, [selectedEquipment]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const selectedUnits = units.filter(
    (unit) => unit.equipment_id === selectedEquipment,
  );

  const addUnit = async () => {
    if (!selectedEquipment) {
      setError("Please select an equipment category.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const existingNumbers = units
        .filter((unit) => unit.equipment_id === selectedEquipment)
        .map((unit) => {
          const match = unit.unit_label.match(/Unit\s+(\d+)/i);
          return match ? Number(match[1]) : 0;
        });

      const nextNumber =
        existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

      const unitLabel = `Unit ${nextNumber}`;

      const { error: insertError } = await supabase
        .from("equipment_units")
        .insert({
          equipment_id: selectedEquipment,
          unit_label: unitLabel,
          condition_status: "good",
          is_active: true,
        });

      if (insertError) throw insertError;

      setSuccess(`${unitLabel} was added successfully.`);
      await fetchInventory();
    } catch (err) {
      console.error("Add equipment unit error:", err);
      setError(err.message || "Unable to add equipment unit.");
    } finally {
      setSaving(false);
    }
  };

  const updateUnit = async (unitId, changes) => {
    try {
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("equipment_units")
        .update(changes)
        .eq("id", unitId);

      if (updateError) throw updateError;

      setSuccess("Physical unit updated successfully.");
      await fetchInventory();
    } catch (err) {
      console.error("Update equipment unit error:", err);
      setError(err.message || "Unable to update physical unit.");
    }
  };

  const handleConditionChange = (unit, condition) => {
    const changes = { condition_status: condition };

    // A unit requiring maintenance or marked damaged must not remain active.
    if (condition !== "good") {
      changes.is_active = false;
    }

    updateUnit(unit.id, changes);
  };

  const handleActiveChange = (unit, isActive) => {
    if (isActive && unit.condition_status !== "good") {
      setError("Only units in good condition can be activated.");
      return;
    }

    updateUnit(unit.id, { is_active: isActive });
  };

  const getUnitCounts = (categoryId) => {
    const categoryUnits = units.filter(
      (unit) => unit.equipment_id === categoryId,
    );

    return {
      total: categoryUnits.length,
      active: categoryUnits.filter(
        (unit) => unit.is_active && unit.condition_status === "good",
      ).length,
      maintenance: categoryUnits.filter(
        (unit) => unit.condition_status === "maintenance",
      ).length,
      damaged: categoryUnits.filter(
        (unit) => unit.condition_status === "damaged",
      ).length,
    };
  };

  if (loading) {
    return (
      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">
          Loading physical equipment inventory...
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#142b4a]">
            Physical Equipment Inventory
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage individual physical units available for student reservations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInventory}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#142b4a] hover:bg-slate-50"
        >
          Refresh inventory
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      {/* CATEGORY INVENTORY SUMMARY */}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {equipment.map((item) => {
          const counts = getUnitCounts(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedEquipment(item.id)}
              className={`rounded-xl border p-4 text-left transition ${
                selectedEquipment === item.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className="font-semibold text-[#142b4a]">{item.name}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <span className="text-slate-500">
                  Total units: <strong>{counts.total}</strong>
                </span>
                <span className="text-emerald-700">
                  Available: <strong>{counts.active}</strong>
                </span>
                <span className="text-amber-700">
                  Maintenance: <strong>{counts.maintenance}</strong>
                </span>
                <span className="text-red-700">
                  Damaged: <strong>{counts.damaged}</strong>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* SELECTED CATEGORY */}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[220px] flex-1">
          <label
            htmlFor="equipment-category"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Equipment category
          </label>

          <select
            id="equipment-category"
            value={selectedEquipment}
            onChange={(event) => setSelectedEquipment(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            {equipment.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={addUnit}
          disabled={saving || !selectedEquipment}
          className="rounded-lg bg-[#142b4a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Adding..." : "+ Add physical unit"}
        </button>
      </div>

      {/* UNIT TABLE */}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Physical unit</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3">Manage condition</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {selectedUnits.map((unit) => (
              <tr key={unit.id} className="hover:bg-slate-50">
                <td className="px-4 py-4">
                  <p className="font-semibold text-[#142b4a]">
                    {unit.equipment?.name || "Equipment"} — {unit.unit_label}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">ID: {unit.id}</p>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      unit.condition_status === "good"
                        ? "bg-emerald-50 text-emerald-700"
                        : unit.condition_status === "maintenance"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {unit.condition_status}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => handleActiveChange(unit, !unit.is_active)}
                    disabled={
                      !unit.is_active && unit.condition_status !== "good"
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                      unit.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {unit.is_active ? "Active" : "Inactive"}
                  </button>
                </td>

                <td className="px-4 py-4">
                  <select
                    value={unit.condition_status}
                    onChange={(event) =>
                      handleConditionChange(unit, event.target.value)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="good">Good</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </td>
              </tr>
            ))}

            {selectedUnits.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-10 text-center text-slate-500"
                >
                  No physical units registered for this category yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Units are deactivated rather than deleted so existing reservation
        records remain associated with their original physical equipment.
      </p>
    </section>
  );
};

export default EquipmentUnitManagement;
