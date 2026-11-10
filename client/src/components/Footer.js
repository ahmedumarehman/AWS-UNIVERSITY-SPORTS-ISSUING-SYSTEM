import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="page-container flex flex-col justify-between gap-6 py-8 sm:flex-row sm:items-center">
        {/* FAST UNIVERSITY BRANDING */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/fast-logo.png"
            alt="FAST-NUCES Official Logo"
            className="h-14 w-14 object-contain"
          />

          <div>
            <p className="text-sm font-extrabold tracking-tight text-[#142b4a]">
              FAST SPORTS & RECREATION
            </p>

            <p className="mt-1 text-xs text-slate-500">
              National University of Computer and Emerging Sciences
            </p>

            <p className="mt-1 text-xs text-slate-400">
              University Sports Issuing System
            </p>
          </div>
        </div>

        {/* FOOTER NAVIGATION */}
        <div className="flex gap-5 text-xs font-semibold text-slate-500">
          <Link to="/" className="transition-colors hover:text-blue-700">
            Home
          </Link>

          <Link
            to="/dashboard"
            className="transition-colors hover:text-blue-700"
          >
            Sports & Equipment
          </Link>
        </div>

        {/* COPYRIGHT */}
        <p className="text-xs text-slate-400">
          © 2026 FAST Sports & Recreation
        </p>
      </div>
    </footer>
  );
};

export default Footer;
