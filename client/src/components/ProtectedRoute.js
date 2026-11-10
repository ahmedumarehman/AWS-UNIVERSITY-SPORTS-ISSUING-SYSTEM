import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user, loading, mfaLoading, mfaStatus } = useAuth();

  if (loading || (user && mfaLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Checking authentication and security...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (mfaStatus !== "verified") {
    return <Navigate to="/mfa" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
