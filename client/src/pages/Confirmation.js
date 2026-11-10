import React from "react";
import { Link, useLocation } from "react-router-dom";

const Confirmation = () => {
  const location = useLocation();

  const booking = location.state?.booking;
  const itemName = location.state?.itemName;
  const timeSlot = location.state?.timeSlot;

  return (
    <div className="page-container flex min-h-[620px] items-center justify-center py-16">
      <div className="card w-full max-w-xl p-8 text-center sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl font-bold text-emerald-600">
          ✓
        </div>

        <p className="section-label mt-7">Reservation submitted</p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#142b4a]">
          Thank you!
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500">
          Your booking request has been submitted to the sports issuing system.
        </p>

        {(itemName || timeSlot) && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5 text-left">
            <h2 className="text-sm font-bold text-[#142b4a]">
              Reservation details
            </h2>

            {itemName && (
              <div className="mt-4 flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Equipment</span>
                <span className="font-semibold text-slate-800">{itemName}</span>
              </div>
            )}

            {timeSlot && (
              <div className="mt-3 flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Time slot</span>
                <span className="font-semibold text-slate-800">{timeSlot}</span>
              </div>
            )}

            {booking?.id && (
              <div className="mt-3 flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Booking ID</span>
                <span className="font-semibold text-slate-800">
                  {booking.id}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
          <p className="text-sm font-semibold text-amber-800">
            Important information
          </p>

          <p className="mt-2 text-xs leading-6 text-amber-700">
            Follow the university sports department's issuing and return
            procedures. A submitted booking request should not be interpreted as
            proof that equipment has physically been issued.
          </p>
        </div>

        <Link to="/dashboard" className="btn-primary mt-8 w-full">
          Return to sports catalogue
        </Link>
      </div>
    </div>
  );
};

export default Confirmation;
