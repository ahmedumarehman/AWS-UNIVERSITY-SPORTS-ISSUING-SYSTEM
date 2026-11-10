import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const isLogin = mode === "login";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setNotice("");
    setSubmitting(true);

    try {
      const email = formData.email.trim();

      if (isLogin) {
        await signIn(email, formData.password);

        navigate("/mfa", { replace: true });
      } else {
        const fullName = formData.fullName.trim();

        if (!fullName) {
          throw new Error("Please enter your full name.");
        }

        const data = await signUp(fullName, email, formData.password);

        if (data.session) {
          setNoticeType("success");
          setNotice("Your account has been created successfully.");
          navigate("/mfa", { replace: true });
        } else {
          setNoticeType("success");
          setNotice(
            "Registration successful! Please check your email and click the verification link before signing in.",
          );
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);

      setNoticeType("error");
      setNotice(error.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const changeMode = (selectedMode) => {
    setMode(selectedMode);
    setNotice("");
    setNoticeType("info");
    setShowPassword(false);
  };

  return (
    <div className="page-container py-8 sm:py-12">
      <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
        {/* EDITORIAL IMAGE */}
        <section className="login-image relative flex min-h-[300px] flex-col justify-end p-8 sm:p-12 lg:min-h-full">
          <div className="absolute left-8 top-8 sm:left-12 sm:top-12">
            <span className="rounded bg-white/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
              FAST University
            </span>
          </div>

          <div className="relative max-w-lg pb-4">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-blue-200">
              Sports & Recreation
            </p>

            <h1 className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Make time
              <br />
              for the game.
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/85 sm:text-base">
              Your university sports experience, all in one place. Discover
              available equipment, reserve your preferred time slots and manage
              your bookings with ease.
            </p>

            <div className="mt-10 flex items-center gap-3">
              <div className="h-1 w-12 bg-blue-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Play. Participate. Perform.
              </p>
            </div>
          </div>
        </section>

        {/* AUTHENTICATION FORM */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md">
            <div className="mb-9">
              <div className="mb-6 flex items-center gap-4">
                <img
                  src="/assets/fast-logo.png"
                  alt="FAST National University of Computer and Emerging Sciences"
                  className="h-20 w-20 object-contain"
                />

                <div>
                  <p className="text-sm font-extrabold tracking-wide text-[#142b4a]">
                    FAST-NUCES
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    National University
                    <br />
                    of Computer and Emerging Sciences
                  </p>
                </div>
              </div>

              <p className="section-label">FAST SPORTS PORTAL</p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#142b4a]">
                {isLogin ? "Welcome back" : "Create your account"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {isLogin
                  ? "Sign in to access your sports and equipment bookings."
                  : "Register to start using the university sports portal."}
              </p>
            </div>

            {/* TAB SWITCHER */}
            <div className="mb-7 flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => changeMode("login")}
                className={`mr-7 border-b-2 pb-3 text-sm font-bold transition-colors ${
                  isLogin
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={() => changeMode("register")}
                className={`border-b-2 pb-3 text-sm font-bold transition-colors ${
                  !isLogin
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full name
                  </label>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    className="form-input"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder="Enter your password"
                    className="form-input pr-16"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={8}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-700 hover:text-blue-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {notice && (
                <div
                  role="status"
                  className={`rounded-lg border p-4 text-sm leading-6 ${
                    noticeType === "error"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : noticeType === "success"
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {notice}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Please wait..."
                  : isLogin
                    ? "Sign in to your account"
                    : "Create account"}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-center text-xs leading-6 text-slate-400">
                University Sports Issuing System
                <br />
                FAST Sports & Recreation
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-7 flex flex-wrap justify-center gap-6 text-xs text-slate-500">
        <span>Equipment management</span>
        <span>Sports reservations</span>
        <span>Booking management</span>
      </div>
    </div>
  );
};

export default Login;
