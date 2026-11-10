import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Sign out error:", error.message);
    }
  };

  const navClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors hover:text-blue-700 ${
      isActive ? "text-blue-700" : "text-slate-600"
    }`;

  const dashboardPath = isAdmin ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="page-container flex min-h-[82px] items-center justify-between gap-3">
        {/* BRANDING */}

        <Link
          to={user ? dashboardPath : "/"}
          className="flex shrink-0 items-center gap-3"
        >
          <img
            src="/assets/fast-logo.png"
            alt="FAST-NUCES Official Logo"
            className="h-14 w-14 object-contain"
          />

          <div>
            <div className="text-lg font-extrabold tracking-tight text-[#142b4a]">
              FAST <span className="font-medium text-[#2878d0]">SPORTS</span>
            </div>

            <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-slate-500">
              Sports & Recreation
            </p>
          </div>
        </Link>

        {/* ROLE-BASED NAVIGATION */}

        <nav className="flex items-center gap-3 sm:gap-5">
          {user && (
            <NavLink
              to={isAdmin ? "/admin" : "/my-bookings"}
              className={navClass}
            >
              {isAdmin ? "Admin Portal" : "My Bookings"}
            </NavLink>
          )}

          {user ? (
            <>
              <span className="hidden max-w-[180px] truncate text-xs font-medium text-slate-500 lg:block">
                {user.email}
              </span>

              <button
                type="button"
                onClick={handleSignOut}
                className="btn-primary !px-4 !py-2.5 sm:!px-5"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/" className="btn-primary !px-5 !py-2.5">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
