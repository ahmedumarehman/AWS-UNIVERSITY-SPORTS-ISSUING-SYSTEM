import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sanitizedEmail = email.trim().toLowerCase();
    if (!sanitizedEmail.endsWith("@nu.edu.pk")) {
      setError("Invalid email. Please use your university email.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await axios.post("http://3.231.204.101:5001/api/auth/login", { email: sanitizedEmail });
      localStorage.setItem("userEmail", sanitizedEmail);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
      <h2 className="mb-2 text-center text-3xl font-extrabold text-slate-900">Welcome Back</h2>
      <p className="mb-7 text-center text-sm text-slate-500">Sign in with your FAST university email</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
            id="email"
            type="email"
            placeholder="i221580@nu.edu.pk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium italic text-red-600">{error}</p>}
        <div className="flex items-center justify-between">
          <button
            className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-cyan-600 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;