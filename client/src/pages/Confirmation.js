import React from "react";
import { Link } from "react-router-dom";

const Confirmation = () => {
  return (
    <div className="mx-auto mt-12 w-full max-w-xl rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-xl">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
        ✓
      </div>
      <h2 className="mb-3 text-3xl font-extrabold text-emerald-700">Your booking has been confirmed</h2>
      <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
        Late return may result in penalty.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-cyan-600 hover:shadow-lg"
      >
        Back to Dashboard
      </Link>
    </div>
  );
};

export default Confirmation;