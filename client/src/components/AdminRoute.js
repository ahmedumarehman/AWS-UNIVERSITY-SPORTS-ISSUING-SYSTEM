import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = () => {
  const { user, loading, mfaLoading, mfaStatus, isAdmin } = useAuth();

  if (loading || (user && mfaLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Verifying administrator access...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (mfaStatus !== "verified") {
    return <Navigate to="/mfa" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
