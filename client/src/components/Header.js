import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-700/40 bg-slate-900/95 text-white shadow-lg backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="text-2xl font-extrabold tracking-tight transition-transform duration-200 hover:scale-[1.01]">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">FAST</span>{" "}
          Sports System
        </div>
        <nav>
          <ul className="flex items-center space-x-2 sm:space-x-4">
            <li>
              <Link
                to="/dashboard"
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-100 transition-all duration-200 hover:bg-slate-700/60 hover:text-cyan-300"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/"
                className="rounded-md border border-slate-500/40 bg-slate-800/70 px-3 py-2 text-sm font-semibold text-slate-100 transition-all duration-200 hover:border-cyan-400/50 hover:bg-slate-700 hover:text-cyan-300"
              >
                Login
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;